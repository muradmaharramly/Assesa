import React from 'react';
import { FadeLoader } from 'react-spinners';
import '../../styles/components/_button.scss';

const Button = ({ 
  children, 
  variant = 'primary', 
  type = 'button', 
  loading = false, 
  disabled = false, 
  onClick,
  className = '',
  style = {}
}) => {
  return (
    <button 
      type={type} 
      className={`btn btn-${variant} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      style={style}
    >
      {loading ? <FadeLoader height={5} width={2} margin={-10} radius={2} color={variant === 'secondary' ? 'var(--text-secondary)' : '#ffffff'} /> : children}
    </button>
  );
};

export default Button;
