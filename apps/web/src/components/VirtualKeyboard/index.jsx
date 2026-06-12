import React, { useEffect, useState } from 'react';
import { useKeyboardStore } from '../../store/keyboardStore';
import QwertyLayout from './QwertyLayout';
import NumpadLayout from './NumpadLayout';

const VirtualKeyboard = () => {
  const { isOpen, keyboardType, setActiveInput, closeKeyboard } = useKeyboardStore();
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Check for touch capability
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0
      );
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  // Global focus listener
  useEffect(() => {
    const handleFocusIn = (e) => {
      if (!isTouchDevice) return; // Only trigger on touch devices

      const target = e.target;
      if (
        target.tagName === 'INPUT' &&
        !['checkbox', 'radio', 'button', 'submit', 'color', 'file', 'image', 'reset', 'hidden', 'date'].includes(target.type)
      ) {
        setActiveInput(target);
      }
    };

    const handleFocusOut = (e) => {
      // Small delay to check if we are focusing another input or just blurring
      setTimeout(() => {
        if (!document.activeElement || document.activeElement.tagName !== 'INPUT') {
          // If we tap outside, but not on another input, we might want to keep it open until "Done" or click outside?
          // Actually, if we tap outside, close it. But clicking the keyboard itself might trigger blur.
          // The keyboard container will prevent default on mouse down.
        }
      }, 50);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [isTouchDevice, setActiveInput]);

  if (!isOpen || !isTouchDevice) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] animate-slideUp">
      {/* Invisible backdrop to catch clicks outside and close */}
      <div
        className="fixed inset-0 z-[-1]"
        onClick={closeKeyboard}
      />

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
