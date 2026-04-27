import { Link, Outlet, useLocation } from 'react-router';
import { LayoutDashboard, BarChart3, FileText, AlertTriangle, Target } from 'lucide-react';
import { AccessGate } from './AccessGate';

export function Root() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-full flex flex-col">
      <AccessGate />
      {/* Navigation — cream bar matching nexusgovernance.eu */}
      <nav
        className="border-b px-6 py-4"
        style={{ background: '#F5F5F2', borderColor: 'rgba(35, 53, 84, 0.12)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center gap-8">
          <a
            href="https://nexusgovernance.eu/"
            className="flex items-center gap-4 no-underline shrink-0"
            style={{ color: '#233554' }}
          >
            <span
              className="text-[22px] font-bold leading-none"
              style={{ fontFamily: '"Libre Baskerville", Georgia, "Times New Roman", serif', letterSpacing: '-0.01em' }}
            >
              Nexus
            </span>
            <span
              aria-hidden="true"
              className="block w-px h-5"
              style={{ background: 'rgba(35, 53, 84, 0.25)' }}
            ></span>
            <span
              className="text-[13px] font-medium"
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif', color: '#0F1C2E', opacity: 0.75, letterSpacing: '0.02em' }}
            >
              Compendium
            </span>
          </a>
          <div className="flex gap-2">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'text-blue-700 border-blue-600 bg-transparent'
                  : 'border-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </Link>
            <Link
              to="/sdg-coverage"
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
                isActive('/sdg-coverage')
                  ? 'text-blue-700 border-blue-600 bg-transparent'
                  : 'border-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              SDG Coverage
            </Link>
            <Link
              to="/policy-actions"
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
                isActive('/policy-actions')
                  ? 'text-blue-700 border-blue-600 bg-transparent'
                  : 'border-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              Policy Actions
            </Link>
            <Link
              to="/challenges-barriers"
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
                isActive('/challenges-barriers')
                  ? 'text-blue-700 border-blue-600 bg-transparent'
                  : 'border-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Challenges & Barriers
            </Link>
            <Link
              to="/commitment-statements"
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
                isActive('/commitment-statements')
                  ? 'text-blue-700 border-blue-600 bg-transparent'
                  : 'border-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Target className="w-4 h-4" />
              Commitments
            </Link>
          </div>
          <Link
            to="/methodology"
            className={`ml-auto text-xs tracking-wide transition-colors ${
              isActive('/methodology')
                ? 'text-slate-900'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Methodology
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div key={location.pathname} className="animate-[fadeIn_0.2s_ease-out]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
