import { useEffect, useRef, useState } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Lock } from 'lucide-react';

const STORAGE_KEY = 'nexus_access_granted_v1';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readGrant(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(localStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
}

export function AccessGate() {
  const [granted, setGranted] = useState<boolean>(readGrant);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [consent, setConsent] = useState<boolean>(false);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (granted) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    firstFieldRef.current?.focus();
    return () => {
      document.body.style.overflow = original;
    };
  }, [granted]);

  if (granted) return null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const full_name = (form.elements.namedItem('full_name') as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const organisation = (form.elements.namedItem('organisation') as HTMLInputElement).value.trim();

    const next: { [k: string]: string } = {};
    if (!full_name) next.full_name = 'Required.';
    if (!email) next.email = 'Required.';
    else if (!EMAIL_RE.test(email)) next.email = 'Enter a valid email address.';
    if (!organisation) next.organisation = 'Required.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const apiPayload = {
      full_name,
      email,
      organisation,
      consent_marketing: consent,
      source: 'observatory',
    };

    const SIGNUP_API_URL = 'https://nexus-api-qr3qz.ondigitalocean.app';
    try {
      await fetch(`${SIGNUP_API_URL}/signup`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });
    } catch (err) {
      // Soft-fail: a transient backend outage shouldn't strand a real user
      // behind a re-show loop. localStorage still grants local access;
      // we'll have lost this submission server-side.
      console.error('Signup POST failed', err);
    }

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...apiPayload, submitted_at: new Date().toISOString() }),
      );
    } catch {
      // localStorage may be disabled; flow still completes for the session.
    }
    setGranted(true);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="access-gate-title"
      aria-describedby="access-gate-description"
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-900/70 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-7 shadow-xl sm:p-9">
        <div className="mb-5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Access
        </div>
        <h2
          id="access-gate-title"
          className="text-2xl font-semibold leading-tight text-slate-900 sm:text-[28px]"
        >
          Open the Nexus Compendium
        </h2>
        <p
          id="access-gate-description"
          className="mt-3 text-sm leading-relaxed text-slate-600"
        >
          A short identification step before continuing. Your details support how we
          measure reach and stay in touch with the institutions using the Compendium.
        </p>

        <form onSubmit={onSubmit} noValidate className="mt-7 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name" className="text-xs font-medium tracking-wide text-slate-700">
              Full name
            </Label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              autoComplete="name"
              required
              ref={firstFieldRef}
              aria-invalid={!!errors.full_name || undefined}
              className="h-11"
            />
            {errors.full_name && (
              <p className="text-xs text-red-600">{errors.full_name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium tracking-wide text-slate-700">
              Work email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={!!errors.email || undefined}
              className="h-11"
            />
            {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="organisation" className="text-xs font-medium tracking-wide text-slate-700">
              Organisation
            </Label>
            <Input
              id="organisation"
              name="organisation"
              type="text"
              autoComplete="organization"
              required
              aria-invalid={!!errors.organisation || undefined}
              className="h-11"
            />
            {errors.organisation && (
              <p className="text-xs text-red-600">{errors.organisation}</p>
            )}
          </div>

          <div className="flex items-start gap-3 pt-2">
            <Checkbox
              id="consent_marketing"
              checked={consent}
              onCheckedChange={(v) => setConsent(v === true)}
              className="mt-0.5"
            />
            <Label
              htmlFor="consent_marketing"
              className="text-xs leading-relaxed text-slate-600 font-normal cursor-pointer"
            >
              I agree to receive occasional updates from Nexus Governance about the
              Compendium, methodology revisions, and related work. I can withdraw at
              any time by writing to{' '}
              <a
                href="mailto:hello@nexusgovernance.eu"
                className="text-blue-700 underline-offset-2 hover:underline"
              >
                hello@nexusgovernance.eu
              </a>
              .
            </Label>
          </div>

          <p className="text-[11px] leading-relaxed text-slate-500 pt-1">
            By continuing you accept that your details are stored to manage access.
            We do not share them with third parties.
          </p>

          <button
            type="submit"
            className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-md bg-blue-700 px-6 text-sm font-medium tracking-wide text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Continue to the Compendium →
          </button>
        </form>
      </div>
    </div>
  );
}
