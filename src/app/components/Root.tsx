import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { LayoutDashboard, BarChart3, FileText, AlertTriangle, Target, Menu, X } from 'lucide-react';
import { AccessGate } from './AccessGate';

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/sdg-coverage', label: 'SDG Coverage', icon: BarChart3 },
  { to: '/policy-actions', label: 'Policy Actions', icon: FileText },
  { to: '/challenges-barriers', label: 'Challenges & Barriers', icon: AlertTriangle },
  { to: '/commitment-statements', label: 'Commitments', icon: Target },
];

export function Root() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent background scroll while the mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileOpen]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-full flex flex-col">
      <AccessGate />
      {/* Navigation — cream bar matching nexusgovernance.eu */}
      <nav
        className="relative border-b px-4 py-3 sm:px-6 sm:py-4"
        style={{ background: '#F5F5F2', borderColor: 'rgba(35, 53, 84, 0.12)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center gap-4 xl:gap-8">
          <a
            href="https://nexusgovernance.eu/"
            className="flex items-center gap-3 md:gap-4 no-underline shrink-0"
            style={{ color: '#233554' }}
          >
            <span
              className="text-[20px] sm:text-[22px] font-bold leading-none"
              style={{ fontFamily: '"Libre Baskerville", Georgia, "Times New Roman", serif', letterSpacing: '-0.01em' }}
            >
              Nexus
            </span>
            <span
              aria-hidden="true"
              className="hidden sm:block w-px h-5"
              style={{ background: 'rgba(35, 53, 84, 0.25)' }}
            ></span>
            <span
              className="text-[13px] font-medium hidden sm:inline"
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif', color: '#0F1C2E', opacity: 0.75, letterSpacing: '0.02em' }}
            >
              SDG Intelligence
            </span>
          </a>

          {/* Desktop nav (md+) — horizontal links */}
          <div className="hidden xl:flex gap-2">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
                  isActive(to)
                    ? 'text-blue-700 border-blue-600 bg-transparent'
                    : 'border-transparent text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop methodology link pushed to the right */}
          <Link
            to="/methodology"
            className={`hidden xl:inline ml-auto text-xs tracking-wide transition-colors ${
              isActive('/methodology')
                ? 'text-slate-900'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Methodology
          </Link>

          {/* Mobile hamburger button (visible < md) */}
          <button
            type="button"
            onClick={() => setMobileOpen(v => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
            className="xl:hidden ml-auto inline-flex items-center justify-center w-11 h-11 rounded-md text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile drawer — slides out below the nav bar */}
        {mobileOpen && (
          <div
            id="mobile-nav-drawer"
            className="xl:hidden absolute left-0 right-0 top-full z-40 border-b shadow-lg"
            style={{ background: '#F5F5F2', borderColor: 'rgba(35, 53, 84, 0.12)' }}
          >
            <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col">
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                    isActive(to)
                      ? 'text-blue-700 bg-blue-50'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              ))}
              <Link
                to="/methodology"
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium transition-colors border-t mt-1 pt-3 ${
                  isActive('/methodology')
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                style={{ borderColor: 'rgba(35, 53, 84, 0.12)' }}
              >
                Methodology
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-auto relative">
        <div key={location.pathname} className="animate-[fadeIn_0.2s_ease-out]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
