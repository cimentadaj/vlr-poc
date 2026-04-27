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
  const [consentOutreach, setConsentOutreach] = useState<boolean>(false);
  const [consentMarketing, setConsentMarketing] = useState<boolean>(false);
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
    const website = (form.elements.namedItem('website') as HTMLInputElement).value;

    const next: { [k: string]: string } = {};
    if (!full_name) next.full_name = 'Required.';
    if (!email) next.email = 'Required.';
    else if (!EMAIL_RE.test(email)) next.email = 'Enter a valid email address.';
    if (!organisation) next.organisation = 'Required.';
    if (!consentOutreach) next.consentOutreach = 'Please confirm the first statement below to continue.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const apiPayload = {
      full_name,
      email,
      organisation,
      consent_outreach: consentOutreach,
      consent_marketing: consentMarketing,
      source: 'observatory',
      website,
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
          {/* Honeypot: real users never fill this. Inline-styled instead of
              `display: none` so headless browsers that ignore display rules
              still render it as a normal input and may auto-fill it. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            defaultValue=""
            style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, opacity: 0 }}
          />
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

          {/* Required: acceptance of access conditions (contractual basis,
              not marketing consent — see the description that follows). */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent_outreach"
                checked={consentOutreach}
                onCheckedChange={(v) => setConsentOutreach(v === true)}
                aria-invalid={!!errors.consentOutreach || undefined}
                aria-required="true"
                className="mt-0.5"
              />
              <Label
                htmlFor="consent_outreach"
                className="text-xs leading-relaxed text-slate-600 font-normal cursor-pointer"
              >
                I accept the access conditions described below.
              </Label>
            </div>
            {errors.consentOutreach && (
              <p className="text-xs text-red-600 pl-7">{errors.consentOutreach}</p>
            )}
          </div>

          {/* Operational fineprint — describes the access conditions the
              user is accepting in the box above. Frames the contact as
              operational/research, not marketing, and names the legal
              basis (contract / legitimate interest, not consent for
              marketing purposes). */}
          <p className="text-[11px] leading-relaxed text-slate-500 pl-7">
            Nexus Governance stores the details you provide to manage your
            access, and may contact you about your use of the Compendium and
            the use cases it supports — for feedback, research, and partnership
            purposes, not marketing. We do not share your details with third
            parties. To withdraw access or request deletion of your details at
            any time, email{' '}
            <a
              href="mailto:hello@nexusgovernance.eu"
              className="text-blue-700 underline-offset-2 hover:underline"
            >
              hello@nexusgovernance.eu
            </a>
            .
          </p>

          {/* Optional: marketing consent — separately opted in. */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="consent_marketing"
              checked={consentMarketing}
              onCheckedChange={(v) => setConsentMarketing(v === true)}
              className="mt-0.5"
            />
            <Label
              htmlFor="consent_marketing"
              className="text-xs leading-relaxed text-slate-600 font-normal cursor-pointer"
            >
              (Optional) I agree to receive occasional updates from Nexus Governance about
              the Compendium, methodology revisions, and related work. I can
              withdraw at any time by writing to{' '}
              <a
                href="mailto:hello@nexusgovernance.eu"
                className="text-blue-700 underline-offset-2 hover:underline"
              >
                hello@nexusgovernance.eu
              </a>
              .
            </Label>
          </div>

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
