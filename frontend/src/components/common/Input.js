import React from 'react';

const Input = ({ 
  label, 
  type = 'text', 
  error, 
  className = '', 
  required = false,
  ...props 
}) => {
  const inputClasses = `
    w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-200
    ${error 
      ? 'border-danger-300 focus:ring-danger-500 focus:border-danger-500' 
      : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
    }
    ${className}
  `;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        className={inputClasses}
        {...props}
      />
      {error && (
        <p className="text-sm text-danger-600">{error}</p>
      )}
    </div>
  );
};

export default Input; 