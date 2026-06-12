import React, { useState } from 'react';
import { useKeyboardStore } from '../../store/keyboardStore';
import { Delete, ArrowUpCircle, XCircle } from 'lucide-react';

const QwertyLayout = () => {
  const { typeKey, backspace, clear } = useKeyboardStore();
  const [isShifted, setIsShifted] = useState(false);

  const rows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  const handleKeyClick = (key) => {
    typeKey(isShifted ? key.toUpperCase() : key);
  };

  const handleShiftClick = () => {
    setIsShifted(!isShifted);
  };

  const KeyButton = ({ children, onClick, className = '', isSpecial = false }) => (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center
        min-h-[44px] min-w-[44px]
        m-[2px]
        text-lg font-medium
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
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-1">
      {/* Number Row */}
      <div className="flex justify-center w-full">
        {rows[0].map(key => (
          <KeyButton key={key} onClick={() => handleKeyClick(key)} className="flex-1">
            {key}
          </KeyButton>
        ))}
      </div>

      {/* QWERTY Row */}
      <div className="flex justify-center w-full px-4">
        {rows[1].map(key => (
          <KeyButton key={key} onClick={() => handleKeyClick(key)} className="flex-1">
            {isShifted ? key.toUpperCase() : key}
          </KeyButton>
        ))}
      </div>

      {/* ASDFGH Row */}
      <div className="flex justify-center w-full px-8">
        {rows[2].map(key => (
          <KeyButton key={key} onClick={() => handleKeyClick(key)} className="flex-1">
            {isShifted ? key.toUpperCase() : key}
          </KeyButton>
        ))}
      </div>

      {/* ZXCVBN Row + Shift + Backspace */}
      <div className="flex justify-center w-full space-x-1">
        <KeyButton onClick={handleShiftClick} className="flex-grow max-w-[60px]" isSpecial>
          <ArrowUpCircle className={isShifted ? "fill-current" : ""} />
        </KeyButton>

        <div className="flex flex-1 justify-center">
          {rows[3].map(key => (
            <KeyButton key={key} onClick={() => handleKeyClick(key)} className="flex-1">
              {isShifted ? key.toUpperCase() : key}
            </KeyButton>
          ))}
        </div>

        <KeyButton onClick={backspace} className="flex-grow max-w-[60px]" isSpecial>
          <Delete />
        </KeyButton>
      </div>

      {/* Bottom Row: Clear, Space, etc. */}
      <div className="flex justify-center w-full space-x-1 mt-2">
        <KeyButton onClick={clear} className="w-16" isSpecial>
          <XCircle />
        </KeyButton>
        <KeyButton onClick={() => typeKey(' ')} className="flex-grow max-w-md">
          Space
        </KeyButton>
      </div>
    </div>
  );
};

export default QwertyLayout;
