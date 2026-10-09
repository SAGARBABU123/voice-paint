type StatusBarProps = {
  message: string
}

export function StatusBar({ message }: StatusBarProps) {
  return (
    <footer
      className="border-t border-neutral-200 px-4 py-2 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-400"
      role="status"
      aria-live="polite"
    >
      {message}
    </footer>
  )
}
