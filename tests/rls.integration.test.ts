import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from 'node:process'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

interface TestTask {
  id: string
  user_id: string
  title: string
}

describe('PostgreSQL task RLS (live Supabase integration)', () => {
  let admin: SupabaseClient
  let userA: SupabaseClient
  let userB: SupabaseClient
  let userAId = ''
  let userBId = ''
  let taskA: TestTask
  let taskB: TestTask

  beforeAll(async () => {
    const url = env.SUPABASE_URL
    const anonKey = env.SUPABASE_ANON_KEY
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !anonKey || !serviceKey) {
      throw new Error('RLS tests require SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY. See README.md.')
    }

    admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const emailA = `taskflow-a-${suffix}@example.test`
    const emailB = `taskflow-b-${suffix}@example.test`
    const password = `TaskFlow-${suffix}-Aa9!`
    const { data: createdA, error: errorA } = await admin.auth.admin.createUser({ email: emailA, password, email_confirm: true })
    if (errorA) throw errorA
    const { data: createdB, error: errorB } = await admin.auth.admin.createUser({ email: emailB, password, email_confirm: true })
    if (errorB) {
      await admin.auth.admin.deleteUser(createdA.user.id)
      throw errorB
    }
    userAId = createdA.user.id
    userBId = createdB.user.id

    userA = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
    userB = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const [signInA, signInB] = await Promise.all([
      userA.auth.signInWithPassword({ email: emailA, password }),
      userB.auth.signInWithPassword({ email: emailB, password }),
    ])
    if (signInA.error) throw signInA.error
    if (signInB.error) throw signInB.error

    const [insertA, insertB] = await Promise.all([
      userA.from('tasks').insert({ title: 'User A private task', user_id: userAId }).select('id,user_id,title').single(),
      userB.from('tasks').insert({ title: 'User B private task', user_id: userBId }).select('id,user_id,title').single(),
    ])
    if (insertA.error) throw insertA.error
    if (insertB.error) throw insertB.error
    taskA = insertA.data
    taskB = insertB.data
  })

  afterAll(async () => {
    if (admin) {
      if (userAId) await admin.auth.admin.deleteUser(userAId)
      if (userBId) await admin.auth.admin.deleteUser(userBId)
    }
  })

  it('allows User A to create and read their own task', async () => {
    expect(taskA.user_id).toBe(userAId)
    const { data, error } = await userA.from('tasks').select('id,title').eq('id', taskA.id).single()
    expect(error).toBeNull()
    expect(data?.title).toBe('User A private task')
  })

  it('prevents User B from reading or updating User A task rows', async () => {
    const { data: rows, error } = await userB.from('tasks').select('id').eq('id', taskA.id)
    expect(error).toBeNull()
    expect(rows).toEqual([])

    const { data: updated, error: updateError } = await userB.from('tasks').update({ title: 'Attempted update' }).eq('id', taskA.id).select('id')
    expect(updateError).toBeNull()
    expect(updated).toEqual([])

    const { data: unchanged, error: ownerError } = await userA.from('tasks').select('title').eq('id', taskA.id).single()
    expect(ownerError).toBeNull()
    expect(unchanged?.title).toBe('User A private task')
  })

  it('prevents User B from deleting User A task rows', async () => {
    const { data, error } = await userB.from('tasks').delete().eq('id', taskA.id).select('id')
    expect(error).toBeNull()
    expect(data).toEqual([])
    const { data: ownerRow, error: ownerError } = await userA.from('tasks').select('id').eq('id', taskA.id).single()
    expect(ownerError).toBeNull()
    expect(ownerRow?.id).toBe(taskA.id)
  })

  it('allows User B to create and read their task while User A cannot see it', async () => {
    const { data: ownTask, error } = await userB.from('tasks').select('id,title').eq('id', taskB.id).single()
    expect(error).toBeNull()
    expect(ownTask?.title).toBe('User B private task')

    const { data: foreignRows, error: foreignError } = await userA.from('tasks').select('id').eq('id', taskB.id)
    expect(foreignError).toBeNull()
    expect(foreignRows).toEqual([])
  })
})
