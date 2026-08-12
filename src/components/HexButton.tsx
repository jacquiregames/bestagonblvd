import React from 'react';
import '../styles/HexButton.css';

interface HexButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'active' | 'highlight';	
  size?: 'normal' | 'small'; 
  className?: string; 
}

const HexButton: React.FC<HexButtonProps> = ({
  children,
  onClick,
  disabled = false,
  type = 'button',
  variant = 'primary',
  size = 'normal',
  className = '',	
}) => {
  return ( 
    <div className={`button-wrapper ${variant} ${className}`}>
      <button
        className={`button ${size}`} 
        type={type}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
        <span className="button-inner-wrapper">
          <span className="button-inner"></span>
        </span>
      </button>
    </div>
  );
};

export default HexButton;