import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, CircleHelp, ClipboardList, LogOut, Plus, Search, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { TaskForm } from '@/components/tasks/TaskForm'
import { TaskRow } from '@/components/tasks/TaskRow'
import { useAuth } from '@/hooks/useAuth'
import { createTask, deleteTask, listTasks, updateTask } from '@/services/taskService'
import type { Task, TaskDraft, TaskPriority, TaskStatus } from '@/types/task'
import { validateTask } from '@/utils/validation'

export function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const refreshTasks = useCallback(async () => {
    setError('')
    try {
      setTasks(await listTasks())
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load your tasks.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    void listTasks().then((items) => {
      if (active) setTasks(items)
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Unable to load your tasks.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  const visibleTasks = useMemo(() => {
    const term = search.trim().toLowerCase()
    return tasks.filter((task) =>
      (!term || task.title.toLowerCase().includes(term)) &&
      (statusFilter === 'all' || task.status === statusFilter) &&
      (priorityFilter === 'all' || task.priority === priorityFilter),
    )
  }, [tasks, search, statusFilter, priorityFilter])
  const completeCount = tasks.filter((task) => task.status === 'completed').length
  const pendingCount = tasks.filter((task) => task.status !== 'completed').length
  const overdueCount = tasks.filter((task) => task.due_date && task.status !== 'completed' && task.due_date < new Date().toISOString().slice(0, 10)).length

  function openCreate() {
    setEditingTask(null)
    setDialogOpen(true)
  }

  function openEdit(task: Task) {
    setEditingTask(task)
    setDialogOpen(true)
  }

  async function saveTask(draft: TaskDraft) {
    const { data, errors } = validateTask(draft)
    if (!data) throw new Error(Object.values(errors)[0] ?? 'Check the task details.')
    if (editingTask) await updateTask(editingTask.id, data)
    else await createTask(data)
    setDialogOpen(false)
    setNotice(editingTask ? 'Task updated successfully.' : 'Task created successfully.')
    await refreshTasks()
  }

  async function removeTask(task: Task) {
    if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return
    try {
      await deleteTask(task.id)
      setNotice('Task deleted.')
      await refreshTasks()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to delete this task.')
    }
  }

  async function toggleTask(task: Task) {
    const input = {
      title: task.title,
      description: task.description,
      priority: task.priority,
      due_date: task.due_date,
      status: (task.status === 'completed' ? 'pending' : 'completed') as TaskStatus,
    }
    try {
      await updateTask(task.id, input)
      await refreshTasks()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update this task.')
    }
  }

  async function logout() {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to sign out.')
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <a href="/" className="inline-flex items-center gap-2 text-lg font-extrabold tracking-tight text-slate-900">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-white"><CheckCircle2 size={19} /></span>TaskFlow
          </a>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-52 truncate text-sm text-muted-foreground sm:inline">{user?.email}</span>
            <span className="grid size-9 place-items-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-800">{user?.email?.slice(0, 1).toUpperCase()}</span>
            <Button type="button" variant="ghost" className="h-9 px-2.5" onClick={logout} aria-label="Log out"><LogOut size={16} /><span className="hidden sm:inline">Log out</span></Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-8 sm:pt-12">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700"><Sparkles size={14} /> Your personal workspace</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Good work starts here.</h1>
            <p className="mt-2 text-sm text-muted-foreground">A little progress adds up. What’s on your list today?</p>
          </div>
          <Button type="button" onClick={openCreate}><Plus size={17} /> New task</Button>
        </div>

        <section aria-label="Task overview" className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-white p-5"><div className="flex items-center justify-between text-sm text-muted-foreground"><span>To focus on</span><ClipboardList size={17} /></div><p className="mt-3 text-3xl font-bold">{pendingCount}<span className="ml-2 text-sm font-medium text-muted-foreground">tasks</span></p></div>
          <div className="rounded-2xl border border-border bg-white p-5"><div className="flex items-center justify-between text-sm text-muted-foreground"><span>Completed</span><CheckCircle2 size={17} /></div><p className="mt-3 text-3xl font-bold">{completeCount}<span className="ml-2 text-sm font-medium text-muted-foreground">tasks</span></p></div>
          <div className="rounded-2xl border border-border bg-white p-5"><div className="flex items-center justify-between text-sm text-muted-foreground"><span>Past due</span><CircleHelp size={17} /></div><p className="mt-3 text-3xl font-bold">{overdueCount}<span className="ml-2 text-sm font-medium text-muted-foreground">tasks</span></p></div>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div><h2 className="font-bold">Your tasks</h2><p className="mt-0.5 text-xs text-muted-foreground">{visibleTasks.length} {visibleTasks.length === 1 ? 'task' : 'tasks'} shown</p></div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1 sm:w-48"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks…" className="pl-9" aria-label="Search tasks" /></div>
              <Select value={statusFilter} onValueChange={setStatusFilter} options={[
                { value: 'all', label: 'All statuses' }, { value: 'pending', label: 'To do' }, { value: 'in_progress', label: 'In progress' }, { value: 'completed', label: 'Completed' },
              ]} />
              <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as TaskPriority | 'all')} options={[
                { value: 'all', label: 'All priorities' }, { value: 'low', label: 'Low priority' }, { value: 'medium', label: 'Medium priority' }, { value: 'high', label: 'High priority' },
              ]} />
            </div>
          </div>
          {error && <p role="alert" className="m-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {notice && <p role="status" className="m-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
          {loading ? <div className="p-12 text-center text-sm text-muted-foreground">Loading your tasks…</div> : visibleTasks.length ? (
            <div>{visibleTasks.map((task) => <TaskRow key={task.id} task={task} onEdit={() => openEdit(task)} onDelete={() => void removeTask(task)} onStatusChange={() => void toggleTask(task)} />)}</div>
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><ClipboardList size={23} /></div>
              <h3 className="mt-4 font-semibold">{tasks.length ? 'No matching tasks' : 'Your list is a blank canvas'}</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{tasks.length ? 'Try adjusting your search or filters.' : 'Add your first task and turn a good idea into a finished thing.'}</p>
              {!tasks.length && <Button className="mt-5" type="button" onClick={openCreate}><Plus size={16} /> Create a task</Button>}
            </div>
          )}
        </section>
      </main>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title={editingTask ? 'Edit task' : 'Create a task'} description={editingTask ? 'Update the details and keep moving.' : 'Add the details for your next task.'}>
        <TaskForm key={editingTask?.id ?? 'new'} task={editingTask} onSubmit={saveTask} onCancel={() => setDialogOpen(false)} />
      </Dialog>
    </div>
  )
}
