interface SequenceTrackerOptions {
    onReset?: () => void;
}
export default class SequenceTracker {
    static readonly CHORD_TIMEOUT = 1500;
    private _path;
    private timer;
    private onReset;
    constructor({ onReset }?: SequenceTrackerOptions);
    get path(): readonly string[];
    registerKeypress(hotkey: string): void;
    reset(): void;
    private killTimer;
    private startTimer;
}
export {};
