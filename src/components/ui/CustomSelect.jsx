import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';

const CustomSelect = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Select...", 
  className = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue) => {
    // If onChange expects an event object (for compatibility), create a mock one
    // But usually custom components pass the value directly. 
    // I'll assume direct value passing for better DX, but wrapper might be needed if existing code relies on e.target.value
    // Given I'm refactoring, I'll update the handlers to accept value directly or wrap it here.
    // Let's pass the value directly as it's cleaner.
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`custom-select-container ${className}`} ref={selectRef}>
      <div 
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <FiChevronDown className={`arrow ${isOpen ? 'open' : ''}`} />
      </div>

      {isOpen && (
        <div className="custom-select-options">
          {options.map((option) => (
            <div
              key={option.value}
              className={`custom-option ${value === option.value ? 'selected' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;