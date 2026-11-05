import { TASK_PRIORITIES, TASK_STATUSES, type TaskDraft, type TaskInput } from '@/types/task'

export type TaskField = keyof TaskDraft
export type TaskValidationErrors = Partial<Record<TaskField, string>>

export function validateTask(value: unknown): { data: TaskInput | null; errors: TaskValidationErrors } {
  if (!value || typeof value !== 'object') {
    return { data: null, errors: { title: 'Enter a task title.' } }
  }

  const input = value as Record<string, unknown>
  const errors: TaskValidationErrors = {}
  const title = typeof input.title === 'string' ? input.title.trim() : ''
  if (!title) errors.title = 'Enter a task title.'
  else if (title.length > 200) errors.title = 'Title must be 200 characters or fewer.'

  const status = input.status
  if (typeof status !== 'string' || !TASK_STATUSES.includes(status as (typeof TASK_STATUSES)[number])) {
    errors.status = 'Choose a valid task status.'
  }
  const priority = input.priority
  if (typeof priority !== 'string' || !TASK_PRIORITIES.includes(priority as (typeof TASK_PRIORITIES)[number])) {
    errors.priority = 'Choose a valid priority.'
  }

  const description = typeof input.description === 'string' ? input.description.trim() : ''
  const dueDate = input.due_date
  const parsedDate = typeof dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? new Date(`${dueDate}T00:00:00Z`) : null
  if (dueDate !== null && dueDate !== '' && (!parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== dueDate)) {
    errors.due_date = 'Choose a valid due date.'
  }
  if (Object.keys(errors).length) return { data: null, errors }

  return {
    data: {
      title,
      description: description || null,
      status: status as TaskInput['status'],
      priority: priority as TaskInput['priority'],
      due_date: typeof dueDate === 'string' && dueDate ? dueDate : null,
    },
    errors,
  }
}
