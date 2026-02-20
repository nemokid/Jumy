'use client';

import { useRef, useEffect } from 'react';

export default function PinInput({ value, onChange, onComplete, disabled }) {
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, e) => {
    const digit = e.target.value.replace(/\D/g, '').slice(-1);
    const newValue = (value || '').split('');
    newValue[index] = digit;
    const newPin = newValue.join('');
    onChange(newPin);

    if (digit && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newPin.length === 5 && !newPin.includes('') && newPin.split('').every(d => d !== '')) {
      onComplete?.(newPin);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !value?.[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 5);
    if (pastedData) {
      onChange(pastedData.padEnd(5, ''));
      if (pastedData.length === 5) {
        onComplete?.(pastedData);
      }
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3, 4].map((index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={value?.[index] || ''}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`pin-digit ${value?.[index] ? 'filled' : ''}`}
          autoComplete="off"
        />
      ))}
    </div>
  );
}
