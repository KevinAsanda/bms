import React from 'react';
import { useKeyboardStore } from '../../store/keyboardStore';
import { Delete, XCircle } from 'lucide-react';

const NumpadLayout = () => {
  const { typeKey, backspace, clear } = useKeyboardStore();

  const handleKeyClick = (key) => {
    typeKey(key);
  };

  const KeyButton = ({ children, onClick, className = '', isSpecial = false }) => (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center
        min-h-[56px] min-w-[56px]
        m-[2px]
        text-2xl font-semibold
        bg-white
        active:bg-gray-200
        border border-[var(--color-border-default)]
        shadow-sm
        transition-colors
        ${isSpecial ? 'bg-gray-100 text-[var(--color-brand-red)]' : 'text-[var(--color-brand-black)]'}
        ${className}
      `}
      style={{ borderRadius: 0 }} // Intentionally square per design docs
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto space-y-1 pb-4">
      <div className="grid grid-cols-3 w-full gap-1">
        <KeyButton onClick={() => handleKeyClick('1')}>1</KeyButton>
        <KeyButton onClick={() => handleKeyClick('2')}>2</KeyButton>
        <KeyButton onClick={() => handleKeyClick('3')}>3</KeyButton>

        <KeyButton onClick={() => handleKeyClick('4')}>4</KeyButton>
        <KeyButton onClick={() => handleKeyClick('5')}>5</KeyButton>
        <KeyButton onClick={() => handleKeyClick('6')}>6</KeyButton>

        <KeyButton onClick={() => handleKeyClick('7')}>7</KeyButton>
        <KeyButton onClick={() => handleKeyClick('8')}>8</KeyButton>
        <KeyButton onClick={() => handleKeyClick('9')}>9</KeyButton>

        <KeyButton onClick={clear} isSpecial><XCircle size={28} /></KeyButton>
        <KeyButton onClick={() => handleKeyClick('0')}>0</KeyButton>
        <KeyButton onClick={backspace} isSpecial><Delete size={28} /></KeyButton>
      </div>
    </div>
  );
};

export default NumpadLayout;
