export default class SequenceTracker {
    constructor({ onReset } = {}) {
        this._path = [];
        this.timer = null;
        this.onReset = onReset;
    }
    get path() {
        return this._path;
    }
    registerKeypress(hotkey) {
        this._path = [...this._path, hotkey];
        this.startTimer();
    }
    reset() {
        var _a;
        this.killTimer();
        this._path = [];
        (_a = this.onReset) === null || _a === void 0 ? void 0 : _a.call(this);
    }
    killTimer() {
        if (this.timer != null) {
            window.clearTimeout(this.timer);
        }
        this.timer = null;
    }
    startTimer() {
        this.killTimer();
        this.timer = window.setTimeout(() => this.reset(), SequenceTracker.CHORD_TIMEOUT);
    }
}
SequenceTracker.CHORD_TIMEOUT = 1500;
