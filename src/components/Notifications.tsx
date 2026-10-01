import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Bell, CheckCircle, XCircle, Clock, FileText, User, ChevronRight } from 'lucide-react'

interface Notification {
  id: string
  type: 'approval' | 'rejection' | 'review' | 'mention' | 'system'
  title: string
  message: string
  document_id?: string
  is_read: boolean
  created_at: string
}

interface NotificationsProps {
  isOpen: boolean
  onClose: () => void
  onUnreadCountChange?: (count: number) => void
}

export function Notifications({ isOpen, onClose, onUnreadCountChange }: NotificationsProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id || !isOpen) return

    async function loadNotifications() {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(20)

        if (error) throw error
        setNotifications(data || [])
        const unread = (data || []).filter(n => !n.is_read).length
        onUnreadCountChange?.(unread)
      } catch (err) {
        console.error('Failed to load notifications:', err)
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [user?.id, isOpen])

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
      const newUnread = notifications.filter(n => n.id !== id && !n.is_read).length
      onUnreadCountChange?.(newUnread)
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user!.id)
        .eq('is_read', false)

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      onUnreadCountChange?.(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'approval': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'rejection': return <XCircle className="w-4 h-4 text-red-600" />
      case 'review': return <Clock className="w-4 h-4 text-amber-600" />
      case 'mention': return <User className="w-4 h-4 text-blue-600" />
      default: return <FileText className="w-4 h-4 text-slate-600" />
    }
  }

  const getColor = (type: Notification['type']) => {
    switch (type) {
      case 'approval': return 'bg-green-50 border-green-200'
      case 'rejection': return 'bg-red-50 border-red-200'
      case 'review': return 'bg-amber-50 border-amber-200'
      case 'mention': return 'bg-blue-50 border-blue-200'
      default: return 'bg-slate-50 border-slate-200'
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div className="absolute right-0 top-12 w-96 bg-white rounded-xl border border-slate-200 shadow-2xl z-50">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-600 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* list */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-400">Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${!n.is_read ? 'bg-blue-50/30' : ''}`}
                  onClick={() => {
                    if (!n.is_read) markAsRead(n.id)
                    if (n.document_id) {
                      navigate(`/documents/${n.document_id}`)
                      onClose()
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${getColor(n.type)}`}>
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                        {!n.is_read && (
                          <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5 ml-2" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mb-2">{n.message}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-slate-400">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                        {n.document_id && (
                          <span className="text-[10px] text-blue-600 flex items-center gap-0.5">
                            View <ChevronRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-100">
          <button
            onClick={() => { navigate('/activity-logs'); onClose() }}
            className="w-full text-center text-xs text-blue-600 hover:underline font-medium"
          >
            View activity log
          </button>
        </div>
      </div>
    </>
  )
}
