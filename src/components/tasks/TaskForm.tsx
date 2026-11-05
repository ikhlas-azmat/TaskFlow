import { useState, type FormEvent } from 'react'
import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { Task, TaskDraft } from '@/types/task'
import { validateTask } from '@/utils/validation'

const initialDraft: TaskDraft = { title: '', description: '', status: 'pending', priority: 'medium', due_date: '' }

export function TaskForm({ task, onSubmit, onCancel }: {
  task: Task | null
  onSubmit: (draft: TaskDraft) => Promise<void>
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<TaskDraft>(task ? {
    title: task.title,
    description: task.description ?? '',
    status: task.status,
    priority: task.priority,
    due_date: task.due_date ?? '',
  } : initialDraft)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function update<K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = validateTask(draft)
    if (!result.data) {
      setErrors(result.errors)
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      await onSubmit(draft)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to save this task.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block space-y-1.5 text-sm font-medium">
        Title <span className="text-red-500">*</span>
        <Input autoFocus maxLength={200} value={draft.title} onChange={(event) => update('title', event.target.value)} placeholder="What needs to get done?" aria-invalid={Boolean(errors.title)} />
        {errors.title && <span className="text-xs font-normal text-red-600">{errors.title}</span>}
      </label>
      <label className="block space-y-1.5 text-sm font-medium">
        Description <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        <Textarea value={draft.description} onChange={(event) => update('description', event.target.value)} placeholder="Add a few details…" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1.5 text-sm font-medium">
          <span className="block">Status</span>
          <Select value={draft.status} onValueChange={(value) => update('status', value as TaskDraft['status'])} options={[
            { value: 'pending', label: 'To do' }, { value: 'in_progress', label: 'In progress' }, { value: 'completed', label: 'Completed' },
          ]} />
          {errors.status && <span className="block text-xs font-normal text-red-600">{errors.status}</span>}
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          <span className="block">Priority</span>
          <Select value={draft.priority} onValueChange={(value) => update('priority', value as TaskDraft['priority'])} options={[
            { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' },
          ]} />
          {errors.priority && <span className="block text-xs font-normal text-red-600">{errors.priority}</span>}
        </label>
      </div>
      <label className="block space-y-1.5 text-sm font-medium">
        Due date <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        <Input type="date" value={draft.due_date} onChange={(event) => update('due_date', event.target.value)} aria-invalid={Boolean(errors.due_date)} />
        {errors.due_date && <span className="text-xs font-normal text-red-600">{errors.due_date}</span>}
      </label>
      {submitError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting && <LoaderCircle size={16} className="animate-spin" />}{task ? 'Save changes' : 'Create task'}</Button>
      </div>
    </form>
  )
}
