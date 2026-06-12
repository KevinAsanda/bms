import { useEffect, useState } from 'react';
import { useKeyboardStore } from '../../store/keyboardStore';
import { useSettingsStore } from '../../store/settingsStore';
import QwertyLayout from './QwertyLayout';
import NumpadLayout from './NumpadLayout';

const VirtualKeyboard = () => {
  const { isOpen, keyboardType, setActiveInput, closeKeyboard } = useKeyboardStore();
  const { inputMode } = useSettingsStore();
  const [hardwareTouch, setHardwareTouch] = useState(false);

  // Check for hardware touch capability
  useEffect(() => {
    const checkTouch = () => {
      setHardwareTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0
      );
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  const isKeyboardActive = inputMode === 'touch' || (inputMode === 'mouse' && hardwareTouch);

  // Global click/touch listener to open/close keyboard on explicit input interactions
  useEffect(() => {
    const handleInteraction = (e) => {
      if (!isKeyboardActive) return;

      const target = e.target;
      
      // If the interaction is inside the keyboard container, ignore it to prevent closure
      const keyboardEl = document.getElementById('virtual-keyboard-container');
      if (keyboardEl && keyboardEl.contains(target)) {
        return;
      }

      if (
        target.tagName === 'INPUT' &&
        !['checkbox', 'radio', 'button', 'submit', 'color', 'file', 'image', 'reset', 'hidden', 'date'].includes(target.type)
      ) {
        // Tapped/clicked an input field -> open/update keyboard
        setActiveInput(target);
      } else {
        // Tapped/clicked outside input and outside keyboard -> close keyboard
        closeKeyboard();
      }
    };

    document.addEventListener('mousedown', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    return () => {
      document.removeEventListener('mousedown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, [isKeyboardActive, setActiveInput, closeKeyboard]);

  if (!isOpen || !isKeyboardActive) return null;

  return (
    <div 
      id="virtual-keyboard-container" 
      className="fixed inset-x-0 bottom-0 z-[100] animate-slideUp"
    >
      <div
        className="bg-[#F7F4F2] border-t border-[var(--color-border-default)] shadow-[var(--shadow-lg)] p-2 pb-safe w-full"
        onMouseDown={(e) => e.preventDefault()} // Prevent clicking keyboard from taking focus away from input
        onTouchStart={(e) => e.preventDefault()} // Same for touch
      >
        <div className="flex justify-end mb-2">
          <button
            onClick={closeKeyboard}
            className="text-[var(--color-brand-red)] font-semibold py-2 px-4 rounded-md text-sm active:bg-gray-200"
          >
            Done
          </button>
        </div>

        {keyboardType === 'numpad' ? (
          <NumpadLayout />
        ) : (
          <QwertyLayout />
        )}
      </div>
    </div>
  );
};

export default VirtualKeyboard;
