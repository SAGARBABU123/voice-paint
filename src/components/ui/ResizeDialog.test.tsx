import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ResizeDialog } from './ResizeDialog'

describe('ResizeDialog', () => {
  it('applies the entered dimensions', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(
      <ResizeDialog initialWidth={960} initialHeight={720} onApply={onApply} onCancel={vi.fn()} />,
    )

    const width = screen.getByLabelText('Width')
    await user.clear(width)
    await user.type(width, '480')
    await user.click(screen.getByRole('button', { name: 'Apply resize' }))

    expect(onApply).toHaveBeenCalledWith(480, 720)
  })

  it('cancels', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <ResizeDialog initialWidth={960} initialHeight={720} onApply={vi.fn()} onCancel={onCancel} />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('does not apply invalid dimensions', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(
      <ResizeDialog initialWidth={960} initialHeight={720} onApply={onApply} onCancel={vi.fn()} />,
    )

    const width = screen.getByLabelText('Width')
    await user.clear(width)
    await user.type(width, '0')
    await user.click(screen.getByRole('button', { name: 'Apply resize' }))

    expect(onApply).not.toHaveBeenCalled()
  })
})
