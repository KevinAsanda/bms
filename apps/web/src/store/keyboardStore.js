import { create } from 'zustand';

export const useKeyboardStore = create((set, get) => ({
  isOpen: false,
  activeInput: null,
  keyboardType: null,

  setActiveInput: (element) => {
    if (!element) {
      set({ isOpen: false, activeInput: null, keyboardType: null });
      return;
    }

    const type = element.getAttribute('type');
    const inputMode = element.getAttribute('inputmode');
    const className = element.className || '';

    let kbType = 'keyboard';
    if (
      type === 'number' ||
      inputMode === 'numeric' ||
      className.includes('input-numeric')
    ) {
      kbType = 'numpad';
    }

    set({
      isOpen: true,
      activeInput: element,
      keyboardType: kbType,
    });
  },

  closeKeyboard: () => {
    set({ isOpen: false, activeInput: null, keyboardType: null });
  },

  typeKey: (key) => {
    const { activeInput } = get();
    if (!activeInput) return;

    activeInput.focus();

    // Try to insert text at cursor position if supported
    try {
      const start = activeInput.selectionStart;
      const end = activeInput.selectionEnd;

      if (start !== null && end !== null) {
        const value = activeInput.value;
        activeInput.value = value.substring(0, start) + key + value.substring(end);

        // Restore cursor position
        activeInput.selectionStart = activeInput.selectionEnd = start + key.length;
      } else {
        // Fallback
        activeInput.value += key;
      }
    } catch (e) {
      // Inputs like type="number" do not support selectionStart/End in some browsers
      activeInput.value += key;
    }

    // Trigger React's onChange event
    const event = new Event('input', { bubbles: true });

    // React 16+ overrides the value setter, need to call the native setter to make React fire onChange
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(activeInput, activeInput.value);
    }

    activeInput.dispatchEvent(event);
  },

  backspace: () => {
    const { activeInput } = get();
    if (!activeInput) return;

    activeInput.focus();

    try {
      const start = activeInput.selectionStart;
      const end = activeInput.selectionEnd;

      if (start !== null && end !== null) {
        const value = activeInput.value;
        if (start === end && start > 0) {
          activeInput.value = value.substring(0, start - 1) + value.substring(end);
          activeInput.selectionStart = activeInput.selectionEnd = start - 1;
        } else if (start !== end) {
          activeInput.value = value.substring(0, start) + value.substring(end);
          activeInput.selectionStart = activeInput.selectionEnd = start;
        }
      } else {
        activeInput.value = activeInput.value.slice(0, -1);
      }
    } catch (e) {
      activeInput.value = activeInput.value.toString().slice(0, -1);
    }

    const event = new Event('input', { bubbles: true });

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(activeInput, activeInput.value);
    }

    activeInput.dispatchEvent(event);
  },

  clear: () => {
    const { activeInput } = get();
    if (!activeInput) return;

    activeInput.focus();
    activeInput.value = '';

    const event = new Event('input', { bubbles: true });

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(activeInput, '');
    }

    activeInput.dispatchEvent(event);
  }
}));
