/* Single exit point for runtime diagnostics, so production noise stays in one place. */
type Level = 'info' | 'warn' | 'error'

function write(level: Level, msg: string, detail?: unknown): void {
  if (import.meta.env.PROD && level === 'info') return
  const line = `[halden] ${msg}`
  // eslint-disable-next-line no-console
  globalThis.console[level](line, detail ?? '')
}

export const logger = {
  info: (msg: string, detail?: unknown) => write('info', msg, detail),
  warn: (msg: string, detail?: unknown) => write('warn', msg, detail),
  error: (msg: string, detail?: unknown) => write('error', msg, detail),
}
