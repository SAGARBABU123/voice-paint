import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { PaintEngineProvider } from '../../hooks/PaintProvider'
import { PaintEngine } from '../../paint/engine'
import type { StrokeOperation } from '../../paint/types'
import { createFakeSpeechAdapter } from '../../test/fakeSpeechAdapter'
import { VoicePanel } from './VoicePanel'

function stroke(id = 's1'): StrokeOperation {
  return {
    id,
    kind: 'stroke',
    tool: 'pencil',
    color: '#111111',
    size: 4,
    points: [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ],
  }
}

function renderPanel(supported = true) {
  const engine = new PaintEngine()
  const fake = createFakeSpeechAdapter(supported)
  render(
    <PaintEngineProvider engine={engine}>
      <VoicePanel adapter={fake.adapter} />
    </PaintEngineProvider>,
  )
  return { engine, ...fake }
}

describe('VoicePanel', () => {
  it('starts and stops listening', async () => {
    const user = userEvent.setup()
    const { adapter, isStarted } = renderPanel()

    await user.click(screen.getByRole('button', { name: /start voice control/i }))
    expect(isStarted()).toBe(true)

    await user.click(screen.getByRole('button', { name: /stop voice control/i }))
    expect(adapter.stop).toHaveBeenCalledTimes(1)
  })

  it('runs a voice command through the shared engine and reports it', async () => {
    const user = userEvent.setup()
    const { engine, emitResult } = renderPanel()

    await user.click(screen.getByRole('button', { name: /start voice control/i }))
    await act(async () => {
      emitResult('set color to red')
    })

    expect(engine.getSnapshot().color).toBe('#ef4444')
    expect(screen.getByRole('status')).toHaveTextContent(/colour set to/i)
  })

  it('asks for confirmation before clearing', async () => {
    const user = userEvent.setup()
    const { engine, emitResult } = renderPanel()
    act(() => {
      engine.commit(stroke())
    })

    await user.click(screen.getByRole('button', { name: /start voice control/i }))
    await act(async () => {
      emitResult('clear canvas')
    })

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(engine.getSnapshot().operationCount).toBe(1)

    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(engine.getSnapshot().operationCount).toBe(0)
  })

  it('toggles the help panel', async () => {
    const user = userEvent.setup()
    renderPanel()

    await user.click(screen.getByRole('button', { name: /what can i say/i }))

    expect(screen.getByRole('region', { name: /voice command help/i })).toBeInTheDocument()
  })

  it('disables the microphone and explains when unsupported', () => {
    renderPanel(false)

    expect(screen.getByRole('button', { name: /start voice control/i })).toBeDisabled()
    expect(screen.getByText(/not supported in this browser/i)).toBeInTheDocument()
  })
})
