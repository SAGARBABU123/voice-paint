import { fireEvent, render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useFocusTrap } from './useFocusTrap'

function Dialog({ onEscape }: { onEscape: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, onEscape)
  return (
    <div ref={ref}>
      <button type="button">First</button>
      <button type="button">Last</button>
    </div>
  )
}

function Harness({ open, onEscape }: { open: boolean; onEscape: () => void }) {
  return (
    <>
      <button type="button">Trigger</button>
      {open ? <Dialog onEscape={onEscape} /> : null}
    </>
  )
}

describe('useFocusTrap', () => {
  it('closes on Escape', () => {
    const onEscape = vi.fn()
    render(<Dialog onEscape={onEscape} />)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onEscape).toHaveBeenCalledTimes(1)
  })

  it('wraps Tab from the last element to the first', () => {
    render(<Dialog onEscape={vi.fn()} />)
    const first = screen.getByRole('button', { name: 'First' })
    const last = screen.getByRole('button', { name: 'Last' })

    last.focus()
    fireEvent.keyDown(document, { key: 'Tab' })

    expect(document.activeElement).toBe(first)
  })

  it('wraps Shift+Tab from the first element to the last', () => {
    render(<Dialog onEscape={vi.fn()} />)
    const first = screen.getByRole('button', { name: 'First' })
    const last = screen.getByRole('button', { name: 'Last' })

    first.focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })

    expect(document.activeElement).toBe(last)
  })

  it('restores focus to the opener when the dialog closes', () => {
    const onEscape = vi.fn()
    const { rerender } = render(<Harness open={false} onEscape={onEscape} />)

    const trigger = screen.getByRole('button', { name: 'Trigger' })
    trigger.focus()

    rerender(<Harness open onEscape={onEscape} />)
    rerender(<Harness open={false} onEscape={onEscape} />)

    expect(document.activeElement).toBe(trigger)
  })
})
