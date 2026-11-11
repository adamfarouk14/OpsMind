import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import logo from '../../assets/opsmind_mainlogo.png'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { PERMISSIONS, type Permission } from '../../lib/permissions'
import {
  Activity,
  BarChart3,
  Brain,
  CheckCircle,
  FileText,
  HardDrive,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  User,
  X
} from 'lucide-react'

interface SidebarCounts {
  documents: number
  approvals: number
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

type NavItem = {
  name: string
  href: string
  icon: LucideIcon
  badge: string | null
  permission?: Permission
}

const COLLAPSED_KEY = 'opsmind.sidebar.collapsed'

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()
  const [counts, setCounts] = useState<SidebarCounts>({ documents: 0, approvals: 0 })
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === '1')

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0')
  }, [collapsed])

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

  const { can } = useAuth()

  const navigationGroups: NavItem[][] = [
    [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard, badge: null },
      { name: 'Search', href: '/search', icon: Search, badge: null },
    ],
    [
      { name: 'Documents', href: '/documents', icon: FileText, badge: counts.documents > 0 ? counts.documents.toString() : null },
      { name: 'Devices', href: '/devices', icon: HardDrive, badge: null, permission: PERMISSIONS.VIEW_DEVICES },
      { name: 'AI Knowledge', href: '/ai-knowledge', icon: Brain, badge: 'AI', permission: PERMISSIONS.USE_AI_ASSISTANT },
      { name: 'Approvals', href: '/approvals', icon: CheckCircle, badge: counts.approvals > 0 ? counts.approvals.toString() : null, permission: PERMISSIONS.REVIEW_DOCUMENTS },
    ],
    [
      { name: 'Reports', href: '/reports', icon: BarChart3, badge: null, permission: PERMISSIONS.VIEW_TEAM_REPORTS },
      { name: 'Activity Logs', href: '/activity-logs', icon: Activity, badge: null, permission: PERMISSIONS.VIEW_AUDIT_LOGS },
      { name: 'Administration', href: '/administration', icon: Settings, badge: null, permission: PERMISSIONS.MANAGE_USERS },
    ],
  ]
    .map(group => group.filter(item => !item.permission || can(item.permission)))
    .filter(group => group.length > 0)

  const rail = collapsed ? 'lg:hidden' : ''
  const railCenter = collapsed ? 'lg:justify-center lg:px-0' : ''

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
        transform transition-[transform,width] duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:z-auto lg:h-full lg:flex-shrink-0
        w-56 ${collapsed ? 'lg:w-[68px]' : ''} flex flex-col
        bg-[#0d1117] text-white
      `}>

        {/* logo */}
        <div className={`px-4 pt-5 pb-4 border-b border-white/10 ${collapsed ? 'lg:px-2' : ''}`}>
          <div className={`flex items-center justify-between ${collapsed ? 'lg:flex-col lg:justify-center lg:gap-3' : ''}`}>
            <div className={`flex items-center gap-2 min-w-0 ${collapsed ? 'lg:justify-center' : ''}`}>
              <img src={logo} alt="OpsMind Logo" className="w-7 h-7 object-contain flex-shrink-0" />
              <span className={`text-white font-bold text-lg tracking-tight ${rail}`}>OpsMind</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCollapsed(v => !v)}
                className="hidden lg:flex p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed
                  ? <PanelLeftOpen className="w-[18px] h-[18px]" />
                  : <PanelLeftClose className="w-[18px] h-[18px]" />}
              </button>
              <button
                onClick={onClose}
                className="lg:hidden text-slate-400 hover:text-white transition-colors p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* nav */}
        <nav className="flex-1 overflow-y-auto py-3">
          {navigationGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {groupIndex > 0 && <div className="my-3 mx-4 h-px bg-white/10" />}
              <ul className="px-2 space-y-0.5">
                {group.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.href ||
                    (item.href !== '/' && location.pathname.startsWith(item.href))

                  return (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        onClick={() => onClose()}
                        title={item.name}
                        className={`relative flex items-center justify-between px-3 py-2.5 rounded-md transition-colors duration-150 group ${
                          isActive
                            ? 'bg-blue-500/10 text-white'
                            : 'text-slate-400 hover:bg-white/10 hover:text-white'
                        } ${railCenter}`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-blue-500" />
                        )}
                        <div className={`flex items-center gap-3 min-w-0 ${collapsed ? 'lg:gap-0' : ''}`}>
                          <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                          <span className={`text-[13px] font-medium truncate ${rail}`}>{item.name}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            item.badge === 'AI'
                              ? 'bg-purple-600/40 text-purple-300'
                              : isActive
                              ? 'bg-blue-500/30 text-blue-100'
                              : 'bg-blue-600/25 text-blue-200'
                          } ${rail}`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* my profile */}
        <div className="border-t border-white/10 py-3 px-2">
          <Link
            to="/profile"
            onClick={() => onClose()}
            title="My Profile"
            className={`relative flex items-center justify-between px-3 py-2.5 rounded-md transition-colors duration-150 group ${
              location.pathname === '/profile'
                ? 'bg-blue-500/10 text-white'
                : 'text-slate-400 hover:bg-white/10 hover:text-white'
            } ${railCenter}`}
          >
            {location.pathname === '/profile' && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-blue-500" />
            )}
            <div className={`flex items-center gap-3 min-w-0 ${collapsed ? 'lg:gap-0' : ''}`}>
              <User className="w-[18px] h-[18px] flex-shrink-0" />
              <span className={`text-[13px] font-medium ${rail}`}>My Profile</span>
            </div>
          </Link>
        </div>

      </aside>
    </>
  )
}
