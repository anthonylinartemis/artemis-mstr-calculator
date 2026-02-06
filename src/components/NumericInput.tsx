import { useState, useEffect, useCallback, useRef } from 'react';

interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  selectOnFocus?: boolean;
}

/**
 * TradingView-style numeric input that:
 * - Allows backspace to fully clear the field (no lingering 0)
 * - Shows formatted display when blurred
 * - Allows raw numeric input when focused
 * - Supports keyboard shortcuts (arrow up/down to increment)
 * - Commits value on blur or Enter
 */
export function NumericInput({
  value,
  onChange,
  className = '',
  min,
  max,
  step = 1,
  prefix,
  suffix,
  placeholder = '0',
  selectOnFocus = true,
}: NumericInputProps) {
  // Internal string state for editing
  const [displayValue, setDisplayValue] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes (e.g., from API updates)
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value.toString());
    }
  }, [value, isFocused]);

  const commitValue = useCallback((rawValue: string) => {
    const trimmed = rawValue.trim();
    if (trimmed === '' || trimmed === '-') {
      // Empty input - revert to previous value or 0
      onChange(0);
      setDisplayValue('0');
      return;
    }

    let num = parseFloat(trimmed);
    if (isNaN(num)) {
      // Invalid input - revert
      setDisplayValue(value.toString());
      return;
    }

    // Apply constraints
    if (min !== undefined && num < min) num = min;
    if (max !== undefined && num > max) num = max;

    onChange(num);
    setDisplayValue(num.toString());
  }, [onChange, value, min, max]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (selectOnFocus) {
      // Delay to ensure focus is complete
      setTimeout(() => e.target.select(), 0);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    commitValue(displayValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    // Allow empty, negative sign, decimal point, and numbers
    if (raw === '' || /^-?\d*\.?\d*$/.test(raw)) {
      // Strip leading zeroes: "007" → "7", "00" → "0", but keep "0.5"
      raw = raw.replace(/^(-?)0+(\d)/, '$1$2');
      setDisplayValue(raw);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitValue(displayValue);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setDisplayValue(value.toString());
      inputRef.current?.blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newVal = value + step;
      const constrained = max !== undefined ? Math.min(newVal, max) : newVal;
      onChange(constrained);
      setDisplayValue(constrained.toString());
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newVal = value - step;
      const constrained = min !== undefined ? Math.max(newVal, min) : newVal;
      onChange(constrained);
      setDisplayValue(constrained.toString());
    }
  };

  // Format display value when not focused
  const formattedDisplay = isFocused
    ? displayValue
    : value.toLocaleString();

  return (
    <div className="relative inline-flex items-center">
      {prefix && (
        <span className="text-gray-400 mr-1 select-none">{prefix}</span>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={formattedDisplay}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`
          bg-lavender-bg border border-lavender-border rounded
          px-3 py-1.5 text-white text-right
          transition-all duration-150
          hover:border-lavender-accent/50
          focus:border-lavender-accent focus:ring-1 focus:ring-lavender-accent/30
          ${className}
        `}
      />
      {suffix && (
        <span className="text-gray-400 ml-1 select-none">{suffix}</span>
      )}
    </div>
  );
}

/**
 * Compact table cell variant
 */
export function TableNumericInput({
  value,
  onChange,
  className = '',
  min,
  max,
}: Omit<NumericInputProps, 'prefix' | 'suffix' | 'selectOnFocus'>) {
  const [displayValue, setDisplayValue] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value.toString());
    }
  }, [value, isFocused]);

  const commitValue = useCallback((rawValue: string) => {
    const trimmed = rawValue.trim();
    if (trimmed === '' || trimmed === '-') {
      onChange(0);
      setDisplayValue('0');
      return;
    }

    let num = parseFloat(trimmed);
    if (isNaN(num)) {
      setDisplayValue(value.toString());
      return;
    }

    if (min !== undefined && num < min) num = min;
    if (max !== undefined && num > max) num = max;

    onChange(num);
    setDisplayValue(num.toString());
  }, [onChange, value, min, max]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    setTimeout(() => e.target.select(), 0);
  };

  const handleBlur = () => {
    setIsFocused(false);
    commitValue(displayValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    if (raw === '' || /^-?\d*\.?\d*$/.test(raw)) {
      // Strip leading zeroes: "007" → "7", "00" → "0", but keep "0.5"
      raw = raw.replace(/^(-?)0+(\d)/, '$1$2');
      setDisplayValue(raw);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitValue(displayValue);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setDisplayValue(value.toString());
      inputRef.current?.blur();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={isFocused ? displayValue : value.toLocaleString()}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`
        bg-lavender-bg border border-lavender-border rounded
        px-3 py-2 text-white text-center
        transition-all duration-150
        hover:border-lavender-accent/50
        focus:border-lavender-accent focus:ring-1 focus:ring-lavender-accent/30
        ${className}
      `}
    />
  );
}
