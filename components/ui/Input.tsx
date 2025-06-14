
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  Icon?: React.FC<React.SVGProps<SVGSVGElement>>;
}

const Input: React.FC<InputProps> = ({ label, name, error, Icon, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-unifafibe_gray-dark mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-unifafibe_gray" aria-hidden="true" />
          </div>
        )}
        <input
          id={name}
          name={name}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm 
                     focus:outline-none focus:ring-2 
                     ${Icon ? 'pl-10' : ''}
                     ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                             : 'border-unifafibe_gray-light focus:ring-unifafibe_blue focus:border-unifafibe_blue'}
                     ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default Input;
