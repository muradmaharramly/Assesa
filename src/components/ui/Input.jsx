import React from 'react';
import '../../styles/components/_input.scss';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  className = ''
}) => {
  return (
    <div className={`input-group ${className}`}>
      {label && <label htmlFor={name} className="input-label">{label} {required && '*'}</label>}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`input-field ${error ? 'input-error' : ''}`}
        required={required}
      />
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
};

export default Input;
