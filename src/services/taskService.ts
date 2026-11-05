import { requireSupabase } from '@/lib/supabase'
import type { Task, TaskInput, TaskPriority, TaskStatus } from '@/types/task'

export interface TaskFilters {
  status?: TaskStatus | 'all'
  priority?: TaskPriority | 'all'
}

function throwIfError(error: { message: string; code?: string } | null): void {
  if (!error) return
  if (error.code === 'PGRST205') {
    throw new Error('The tasks table is missing from this Supabase project. Apply the migration in supabase/migrations/20261105000000_create_tasks.sql to the project configured by VITE_SUPABASE_URL, then refresh the schema cache.')
  }
  throw new Error(error.message)
}

export async function listTasks(filters: TaskFilters = {}): Promise<Task[]> {
  let query = requireSupabase().from('tasks').select('*').order('created_at', { ascending: false })
  if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status)
  if (filters.priority && filters.priority !== 'all') query = query.eq('priority', filters.priority)
  const { data, error } = await query
  throwIfError(error)
  return data ?? []
}

export async function createTask(input: TaskInput): Promise<Task> {
  const client = requireSupabase()
  const { data: { user }, error: userError } = await client.auth.getUser()
  throwIfError(userError)
  if (!user) throw new Error('You must be signed in to create a task.')
  const { data, error } = await client.from('tasks').insert({ ...input, user_id: user.id }).select('*').single()
  throwIfError(error)
  if (!data) throw new Error('The task could not be created.')
  return data
}

export async function updateTask(id: string, input: TaskInput): Promise<Task> {
  const { data, error } = await requireSupabase().from('tasks').update(input).eq('id', id).select('*').single()
  throwIfError(error)
  if (!data) throw new Error('The task could not be updated.')
  return data
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await requireSupabase().from('tasks').delete().eq('id', id)
  throwIfError(error)
}
