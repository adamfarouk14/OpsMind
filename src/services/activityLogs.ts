import { supabase } from '../lib/supabase'

export async function getActivityLogs(limit: number = 50) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select(`
      *,
      users:user_id (
        name,
        initials,
        avatar_color
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function logActivity(activity: {
  user_id?: string
  action: string
  target_type?: string
  target_id?: string
  target_title?: string
  target_code?: string
  details?: string
  ip_address?: string
}) {
  const { data, error } = await supabase
    .from('activity_logs')
    .insert(activity)
    .select()
    .single()

  if (error) throw error
  return data
}