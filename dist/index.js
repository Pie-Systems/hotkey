class Leaf {
    constructor(trie) {
        this.children = [];
        this.parent = trie;
    }
    delete(value) {
        const index = this.children.indexOf(value);
        if (index === -1)
            return false;
        this.children = this.children.slice(0, index).concat(this.children.slice(index + 1));
        if (this.children.length === 0) {
            this.parent.delete(this);
        }
        return true;
    }
    add(value) {
        this.children.push(value);
        return this;
    }
}
class RadixTrie {
    constructor(trie) {
        this.parent = null;
        this.children = {};
        this.parent = trie || null;
    }
    get(edge) {
        return this.children[edge];
    }
    insert(edges) {
        let currentNode = this;
        for (let i = 0; i < edges.length; i += 1) {
            const edge = edges[i];
            let nextNode = currentNode.get(edge);
            if (i === edges.length - 1) {
                if (nextNode instanceof RadixTrie) {
                    currentNode.delete(nextNode);
                    nextNode = null;
                }
                if (!nextNode) {
                    nextNode = new Leaf(currentNode);
                    currentNode.children[edge] = nextNode;
                }
                return nextNode;
            }
            else {
                if (nextNode instanceof Leaf)
                    nextNode = null;
                if (!nextNode) {
                    nextNode = new RadixTrie(currentNode);
                    currentNode.children[edge] = nextNode;
                }
            }
            currentNode = nextNode;
        }
        return currentNode;
    }
    delete(node) {
        for (const edge in this.children) {
            const currentNode = this.children[edge];
            if (currentNode === node) {
                const success = delete this.children[edge];
                if (Object.keys(this.children).length === 0 && this.parent) {
                    this.parent.delete(this);
                }
                return success;
            }
        }
        return false;
    }
}

function isFormField(element) {
    if (!(element instanceof HTMLElement)) {
        return false;
    }
    const name = element.nodeName.toLowerCase();
    const type = (element.getAttribute('type') || '').toLowerCase();
    return (name === 'select' ||
        name === 'textarea' ||
        (name === 'input' &&
            type !== 'submit' &&
            type !== 'reset' &&
            type !== 'checkbox' &&
            type !== 'radio' &&
            type !== 'file' &&
            type !== 'text' &&
            type !== 'number') ||
        element.isContentEditable);
}
function fireDeterminedAction(el, path) {
    const delegateEvent = new CustomEvent('hotkey-fire', { cancelable: true, detail: { path } });
    const cancelled = !el.dispatchEvent(delegateEvent);
    if (cancelled)
        return;
    if (isFormField(el)) {
        el.focus();
    }
    else {
        el.click();
    }
}
function expandHotkeyToEdges(hotkey) {
    const output = [];
    let acc = [''];
    let commaIsSeparator = false;
    for (let i = 0; i < hotkey.length; i++) {
        if (commaIsSeparator && hotkey[i] === ',') {
            output.push(acc);
            acc = [''];
            commaIsSeparator = false;
            continue;
        }
        if (hotkey[i] === ' ') {
            acc.push('');
            commaIsSeparator = false;
            continue;
        }
        else if (hotkey[i] === '+') {
            commaIsSeparator = false;
        }
        else {
            commaIsSeparator = true;
        }
        acc[acc.length - 1] += hotkey[i];
    }
    output.push(acc);
    return output.map(h => h.filter(k => k !== '')).filter(h => h.length > 0);
}

function hotkey(event) {
    const { ctrlKey, altKey, metaKey, key } = event;
    const hotkeyString = [];
    const modifiers = [ctrlKey, altKey, metaKey, showShift(event)];
    for (const [i, mod] of modifiers.entries()) {
        if (mod)
            hotkeyString.push(modifierKeyNames[i]);
    }
    if (!modifierKeyNames.includes(key)) {
        hotkeyString.push(key);
    }
    return hotkeyString.join('+');
}
const modifierKeyNames = [`Control`, 'Alt', 'Meta', 'Shift'];
function showShift(event) {
    const { shiftKey, code, key } = event;
    return shiftKey && !(code.startsWith('Key') && key.toUpperCase() === key);
}

class SequenceTracker {
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

const hotkeyRadixTrie = new RadixTrie();
const elementsLeaves = new WeakMap();
let currentTriePosition = hotkeyRadixTrie;
const sequenceTracker = new SequenceTracker({
    onReset() {
        currentTriePosition = hotkeyRadixTrie;
    }
});
function keyDownHandler(event) {
    if (event.defaultPrevented)
        return;
    if (!(event.target instanceof Node))
        return;
    if (isFormField(event.target)) {
        const target = event.target;
        if (!target.id)
            return;
        if (!target.ownerDocument.querySelector(`[data-hotkey-scope="${target.id}"]`))
            return;
    }
    const newTriePosition = currentTriePosition.get(hotkey(event));
    if (!newTriePosition) {
        sequenceTracker.reset();
        return;
    }
    sequenceTracker.registerKeypress(hotkey(event));
    currentTriePosition = newTriePosition;
    if (newTriePosition instanceof Leaf) {
        const target = event.target;
        let shouldFire = false;
        let elementToFire;
        const formField = isFormField(target);
        for (let i = newTriePosition.children.length - 1; i >= 0; i -= 1) {
            elementToFire = newTriePosition.children[i];
            const scope = elementToFire.getAttribute('data-hotkey-scope');
            if ((!formField && !scope) || (formField && target.id === scope)) {
                shouldFire = true;
                break;
            }
        }
        if (elementToFire && shouldFire) {
            fireDeterminedAction(elementToFire, sequenceTracker.path);
            event.preventDefault();
        }
        sequenceTracker.reset();
    }
}
function install(element, hotkey) {
    if (Object.keys(hotkeyRadixTrie.children).length === 0) {
        document.addEventListener('keydown', keyDownHandler);
    }
    const hotkeys = expandHotkeyToEdges(hotkey || element.getAttribute('data-hotkey') || '');
    const leaves = hotkeys.map(h => hotkeyRadixTrie.insert(h).add(element));
    elementsLeaves.set(element, leaves);
}
function uninstall(element) {
    const leaves = elementsLeaves.get(element);
    if (leaves && leaves.length) {
        for (const leaf of leaves) {
            leaf && leaf.delete(element);
        }
    }
    if (Object.keys(hotkeyRadixTrie.children).length === 0) {
        document.removeEventListener('keydown', keyDownHandler);
    }
}

export { Leaf, RadixTrie, hotkey as eventToHotkeyString, install, uninstall };
