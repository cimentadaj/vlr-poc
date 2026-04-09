import { Link, Outlet, useLocation } from 'react-router';
import { LayoutDashboard, BarChart3, FileText, AlertTriangle, Target } from 'lucide-react';

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
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-8">
          <div>
            <div className="text-xl font-bold text-slate-900">VLR Intelligence Platform</div>
            <div className="text-xs text-slate-500">Urban Governance Insights from Voluntary Local Reviews</div>
          </div>
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
