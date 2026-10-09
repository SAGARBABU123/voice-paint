import { useState } from 'react'
import { EditorShell } from '../components/editor/EditorShell'
import { PaintEngineProvider } from '../hooks/PaintProvider'
import { PaintEngine } from '../paint/engine'

export default function App() {
  const [engine] = useState(() => new PaintEngine())

  return (
    <PaintEngineProvider engine={engine}>
      <EditorShell />
    </PaintEngineProvider>
  )
}
