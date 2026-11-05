import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TaskForm } from '../src/components/tasks/TaskForm'

describe('TaskForm', () => {
  it('shows required title validation and does not submit an empty form', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<TaskForm task={null} onSubmit={onSubmit} onCancel={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Create task' }))
    expect(screen.getByText('Enter a task title.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
