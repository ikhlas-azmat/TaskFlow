export const TASK_STATUSES = ['pending', 'in_progress', 'completed'] as const
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface TaskInput {
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
}

export type TaskDraft = Omit<TaskInput, 'description' | 'due_date'> & { description: string; due_date: string }
