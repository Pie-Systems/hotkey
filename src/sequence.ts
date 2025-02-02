interface SequenceTrackerOptions {
  onReset?: () => void
}

export default class SequenceTracker {
  static readonly CHORD_TIMEOUT = 1500

  private _path: readonly string[] = []
  private timer: number | null = null
  private onReset

  constructor({onReset}: SequenceTrackerOptions = {}) {
    this.onReset = onReset
  }

  get path(): readonly string[] {
    return this._path
  }

  registerKeypress(hotkey: string): void {
    this._path = [...this._path, hotkey]
    this.startTimer()
  }

  reset(): void {
    this.killTimer()
    this._path = []
    this.onReset?.()
  }

  private killTimer(): void {
    if (this.timer != null) {
      window.clearTimeout(this.timer)
    }
    this.timer = null
  }

  private startTimer(): void {
    this.killTimer()
    this.timer = window.setTimeout(() => this.reset(), SequenceTracker.CHORD_TIMEOUT)
  }
}
