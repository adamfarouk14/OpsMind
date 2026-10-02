import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../../assets/opsmind_mainlogo.png'
import { supabase } from '../../lib/supabase'
import {
  LayoutDashboard,
  FileText,
  Search,
  Brain,
  CheckCircle,
  BarChart3,
  Activity,
  Settings,
  X,
  User,
  ChevronRight
} from 'lucide-react'

interface SidebarCounts {
  documents: number
  approvals: number
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()
  const [counts, setCounts] = useState<SidebarCounts>({ documents: 0, approvals: 0 })

  useEffect(() => {
    async function loadCounts() {
      try {
        const [docsRes, approvalsRes] = await Promise.all([
          supabase.from('documents').select('id', { count: 'exact', head: true }),
          supabase.from('documents').select('id', { count: 'exact', head: true }).eq('status', 'In Review'),
        ])
        setCounts({
          documents: docsRes.count || 0,
          approvals: approvalsRes.count || 0,
        })
      } catch {
        // silently fail — badges just show 0
      }
    }
    loadCounts()
  }, [])

  const navigationItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, badge: null },
    { name: 'Documents', href: '/documents', icon: FileText, badge: counts.documents > 0 ? counts.documents.toString() : null },
    { name: 'Search', href: '/search', icon: Search, badge: null },
    { name: 'AI Knowledge', href: '/ai-knowledge', icon: Brain, badge: 'AI' },
    { name: 'Approvals', href: '/approvals', icon: CheckCircle, badge: counts.approvals > 0 ? counts.approvals.toString() : null },
    { name: 'Reports', href: '/reports', icon: BarChart3, badge: null },
    { name: 'Activity Logs', href: '/activity-logs', icon: Activity, badge: null },
    { name: 'Administration', href: '/administration', icon: Settings, badge: null },
  ]

  return (
    <>
      {/* dark overlay on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed left-0 top-0 h-full z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:z-auto lg:h-full lg:flex-shrink-0
        w-56 flex flex-col
        bg-[#1a1f2e] text-white
      `}>

        {/* logo */}
        <div className="px-4 pt-5 pb-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <img src={logo} alt="OpsMind Logo" className="w-7 h-7 object-contain" />
                <span className="text-white font-bold text-lg tracking-tight">OpsMind</span>
              
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-none">Solve Knowledge Base</p>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white transition-colors p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button className="mt-3 w-full flex items-center justify-between text-left bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2 transition-colors group">
            <div>
              <p className="text-[11px] text-slate-300 font-medium">Technical Support</p>
              <p className="text-[10px] text-slate-500">Default Repository</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
          </button>
        </div>

        {/* nav */}
        <nav className="flex-1 overflow-y-auto py-3">
          <ul className="space-y-0.5 px-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href ||
                (item.href !== '/' && location.pathname.startsWith(item.href))

              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={() => onClose()}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-[13px] font-medium">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badge === 'AI'
                          ? 'bg-purple-600/40 text-purple-300'
                          : 'bg-white/10 text-slate-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="px-2 pb-4">
          <Link
            to="/profile"
            className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all group"
          >
            <div className="flex items-center gap-3">
              <User className="w-4 h-4" />
              <span className="text-[13px] font-medium">My Profile</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>

      </aside>
    </>
  )
}
