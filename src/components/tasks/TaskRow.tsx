import { CalendarDays, Check, Circle, Clock3, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { Task } from '@/types/task'

const statusNames = { pending: 'To do', in_progress: 'In progress', completed: 'Completed' }

export function TaskRow({ task, onEdit, onDelete, onStatusChange }: {
  task: Task
  onEdit: () => void
  onDelete: () => void
  onStatusChange: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const overdue = task.due_date && task.status !== 'completed' && task.due_date < new Date().toISOString().slice(0, 10)
  return (
    <article className="group flex items-start gap-3 border-b border-border/70 px-4 py-4 last:border-0 sm:items-center sm:px-5">
      <button onClick={onStatusChange} aria-label={`Mark ${task.title} ${task.status === 'completed' ? 'to do' : 'completed'}`} className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition sm:mt-0 ${task.status === 'completed' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 text-transparent hover:border-emerald-500 hover:text-emerald-500'}`}>
        <Check size={12} strokeWidth={3} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={`truncate text-sm font-semibold ${task.status === 'completed' ? 'text-muted-foreground line-through' : 'text-slate-800'}`}>{task.title}</h3>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${task.priority === 'high' ? 'bg-red-50 text-red-700' : task.priority === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{task.priority}</span>
        </div>
        {task.description && <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{task.description}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className={`size-1.5 rounded-full ${task.status === 'completed' ? 'bg-emerald-500' : task.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-400'}`} />{statusNames[task.status]}</span>
          {task.due_date && <span className={`inline-flex items-center gap-1 ${overdue ? 'font-medium text-red-600' : ''}`}><CalendarDays size={13} />{overdue ? 'Overdue · ' : ''}{new Date(`${task.due_date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
        </div>
      </div>
      <div className="relative">
        <button aria-label={`Actions for ${task.title}`} onClick={() => setMenuOpen((open) => !open)} className="rounded-md p-2 text-muted-foreground hover:bg-muted"><MoreHorizontal size={17} /></button>
        {menuOpen && <div className="absolute right-0 top-9 z-20 w-40 rounded-xl border border-border bg-white p-1.5 shadow-lg">
          <button onClick={() => { setMenuOpen(false); onEdit() }} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted"><Pencil size={14} /> Edit task</button>
          <button onClick={() => { setMenuOpen(false); onStatusChange() }} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted">{task.status === 'completed' ? <Circle size={14} /> : <Clock3 size={14} />}{task.status === 'completed' ? 'Mark to do' : 'Mark completed'}</button>
          <button onClick={() => { setMenuOpen(false); onDelete() }} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-red-600 hover:bg-red-50"><Trash2 size={14} /> Delete task</button>
        </div>}
      </div>
    </article>
  )
}
