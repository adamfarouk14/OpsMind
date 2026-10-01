import { useState, useEffect } from 'react'
import { Search, Menu, Bell, Sparkles, ChevronRight, LogOut } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Notifications } from '../Notifications'

interface HeaderProps {
  onMenuClick: () => void
}

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/documents': 'Documents',
  '/search': 'Search',
  '/ai-knowledge': 'AI Knowledge',
  '/approvals': 'Approvals',
  '/reports': 'Reports',
  '/activity-logs': 'Activity Logs',
  '/administration': 'Administration',
  '/profile': 'Profile',
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchValue, setSearchValue] = useState('')

  const currentPage = routeLabels[location.pathname] ?? 'Dashboard'

  // Load initial unread count on mount
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .then(({ count }) => setUnreadCount(count || 0))
      .catch(() => {})
  }, [user?.id])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`)
      setSearchValue('')
    } else {
      navigate('/search')
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e as any)
    }
  }

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex-shrink-0 z-10">
      <div className="h-full px-4 lg:px-5 flex items-center justify-between gap-4">

        <div className="flex items-center gap-3 min-w-0">
          {/* hamburger — mobile only */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* breadcrumb */}
          <nav className="hidden sm:flex items-center gap-1.5 text-[13px] text-slate-500 min-w-0">
            <span className="font-medium text-slate-700">OpsMind</span>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
            <span>Knowledge Base</span>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
            <span className="font-semibold text-slate-800 truncate">{currentPage}</span>
          </nav>

          <span className="sm:hidden text-[14px] font-semibold text-slate-800">{currentPage}</span>
        </div>

        {/* search bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search SOPs, technical guides…"
              className="w-full pl-9 pr-3 py-1.5 text-[13px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors placeholder:text-slate-400"
            />
          </div>
        </form>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => navigate('/ai-knowledge')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ask AI
          </button>

          {/* notification bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <Notifications
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                onUnreadCountChange={setUnreadCount}
              />
            )}
          </div>

          <div className="w-px h-6 bg-slate-200 mx-1" />

          <div className="flex items-center gap-2.5">
            <div className="text-right hidden lg:block">
              <p className="text-[13px] font-semibold text-slate-800 leading-tight">{user?.name || 'User'}</p>
              <p className="text-[11px] text-slate-500 leading-tight">{user?.role || 'Team Member'}</p>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0 ${user?.avatar_color || 'bg-gradient-to-br from-blue-500 to-blue-700'} hover:opacity-80 transition-opacity`}
            >
              {user?.initials || 'U'}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </header>
  )
}
