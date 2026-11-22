// Tiny pub-sub shared by the canvases and the React overlay.

type Listener<T> = (value: T) => void

export class Signal<T> {
  private listeners = new Set<Listener<T>>()
  private current: T

  constructor(initial: T) {
    this.current = initial
  }

  get value(): T {
    return this.current
  }

  set(next: T): void {
    if (Object.is(next, this.current)) return
    this.current = next
    this.listeners.forEach((fn) => fn(next))
  }

  subscribe(fn: Listener<T>): () => void {
    this.listeners.add(fn)
    fn(this.current)
    return () => this.listeners.delete(fn)
  }
}
