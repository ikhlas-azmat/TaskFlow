import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requireSupabase } = vi.hoisted(() => ({ requireSupabase: vi.fn() }))
vi.mock('../src/lib/supabase', () => ({ requireSupabase }))

import { createTask, deleteTask, listTasks, updateTask } from '../src/services/taskService'

describe('taskService', () => {
  beforeEach(() => requireSupabase.mockReset())

  it('lists tasks through the authenticated Supabase client', async () => {
    const task = { id: 'one', title: 'Task' }
    const order = vi.fn().mockResolvedValue({ data: [task], error: null })
    const select = vi.fn().mockReturnValue({ order })
    requireSupabase.mockReturnValue({ from: vi.fn().mockReturnValue({ select }) })
    await expect(listTasks()).resolves.toEqual([task])
    expect(select).toHaveBeenCalledWith('*')
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('derives task ownership from the verified current session, not form input', async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: 'one', user_id: 'auth-user' }, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    requireSupabase.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'auth-user' } }, error: null }) },
      from: vi.fn().mockReturnValue({ insert }),
    })
    const input = { title: 'Task', description: null, status: 'pending', priority: 'medium', due_date: null } as const
    await createTask(input)
    expect(insert).toHaveBeenCalledWith({ ...input, user_id: 'auth-user' })
  })

  it('reports Supabase errors rather than returning success-shaped fallbacks', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'database unavailable' } })
    const select = vi.fn().mockReturnValue({ order })
    requireSupabase.mockReturnValue({ from: vi.fn().mockReturnValue({ select }) })
    await expect(listTasks()).rejects.toThrow('database unavailable')
  })

  it('explains how to fix a missing tasks table in the PostgREST schema cache', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST205', message: "Could not find the table 'public.tasks' in the schema cache" } })
    const select = vi.fn().mockReturnValue({ order })
    requireSupabase.mockReturnValue({ from: vi.fn().mockReturnValue({ select }) })
    await expect(listTasks()).rejects.toThrow('Apply the migration in supabase/migrations/20261105000000_create_tasks.sql')
  })

  it('updates and deletes by task ID using Supabase operations', async () => {
    const updated = { id: 'one' }
    const updateSingle = vi.fn().mockResolvedValue({ data: updated, error: null })
    const updateSelect = vi.fn().mockReturnValue({ single: updateSingle })
    const updateEq = vi.fn().mockReturnValue({ select: updateSelect })
    const update = vi.fn().mockReturnValue({ eq: updateEq })
    const deleteEq = vi.fn().mockResolvedValue({ error: null })
    const remove = vi.fn().mockReturnValue({ eq: deleteEq })
    requireSupabase.mockReturnValue({ from: vi.fn().mockImplementation(() => ({ update, delete: remove })) })

    await expect(updateTask('one', { title: 'Task', description: null, status: 'pending', priority: 'low', due_date: null })).resolves.toEqual(updated)
    await deleteTask('one')
    expect(updateEq).toHaveBeenCalledWith('id', 'one')
    expect(deleteEq).toHaveBeenCalledWith('id', 'one')
  })
})
