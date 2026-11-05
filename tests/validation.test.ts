import { describe, expect, it } from 'vitest'
import { validateTask } from '../src/utils/validation'

describe('validateTask', () => {
  const validTask = { title: 'Review proposal', description: 'Read the draft', status: 'pending', priority: 'medium', due_date: null }

  it('accepts a valid task and normalizes whitespace and empty optional fields', () => {
    expect(validateTask({ ...validTask, title: '  Review proposal ', description: '  ' })).toEqual({
      data: { ...validTask, title: 'Review proposal', description: null },
      errors: {},
    })
  })

  it('requires a title', () => {
    expect(validateTask({ ...validTask, title: '  ' }).errors.title).toBe('Enter a task title.')
  })

  it('rejects invalid status and priority values', () => {
    const result = validateTask({ ...validTask, status: 'blocked', priority: 'urgent' })
    expect(result.errors.status).toBe('Choose a valid task status.')
    expect(result.errors.priority).toBe('Choose a valid priority.')
  })

  it('rejects a malformed due date', () => {
    expect(validateTask({ ...validTask, due_date: 'tomorrow' }).errors.due_date).toBe('Choose a valid due date.')
    expect(validateTask({ ...validTask, due_date: '2025-02-31' }).errors.due_date).toBe('Choose a valid due date.')
  })
})
