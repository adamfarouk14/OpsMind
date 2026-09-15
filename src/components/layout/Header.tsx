import { Search, Menu, Bell, Sparkles, ChevronRight } from 'lucide-react'
import { useLocation } from 'react-router-dom'

interface HeaderProps {
  onMenuClick: () => void
}

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/documents': 'Documents',
  '/search': 'Search',
  '/ai-knowledge': 'AI Knowledge',
  '/approvals': 'Approvals',
  '/reports': 'Reports',
  '/activity-logs': 'Activity Logs',
  '/administration': 'Administration',
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation()
  const currentPage = routeLabels[location.pathname] ?? 'Dashboard'

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex-shrink-0 z-10">
      <div className="h-full px-4 lg:px-5 flex items-center justify-between gap-4">

        <div className="flex items-center gap-3 min-w-0">
          {/* hamburger — for mobile only */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* breadcrumb — hidden on small screens */}
          <nav className="hidden sm:flex items-center gap-1.5 text-[13px] text-slate-500 min-w-0">
            <span className="font-medium text-slate-700">OpsMind</span>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
            <span>Knowledge Base</span>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
            <span className="font-semibold text-slate-800 truncate">{currentPage}</span>
          </nav>

          {/* just the page name on mobile.. */}
          <span className="sm:hidden text-[14px] font-semibold text-slate-800">{currentPage}</span>
        </div>

        {/* search bar — hidden below md */}
        <div className="flex-1 max-w-sm hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search SOPs, technical guides…"
              className="w-full pl-9 pr-3 py-1.5 text-[13px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors placeholder:text-slate-400"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 bg-slate-100 border border-slate-200 rounded px-1 py-0.5 font-mono">Ctrl+K</kbd>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium rounded-lg transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            Ask AI
          </button>


          {/* Notification bell */}
          <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>

          <div className="w-px h-6 bg-slate-200 mx-1" />

          <div className="flex items-center gap-2.5">
            <div className="text-right hidden lg:block">
              <p className="text-[13px] font-semibold text-slate-800 leading-tight">Adam Farouk</p>
              <p className="text-[11px] text-slate-500 leading-tight">Technical Support Lead</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0">
              YH
            </div>
          </div>
        </div>

      </div>
    </header>
  )
}
