import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'normal' | 'large';
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  noBorder?: boolean;
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'normal',
  title,
  subtitle,
  actions,
  footer,
  noBorder = false,
  hoverable = false,
}) => {
  const paddingClasses = {
    none: '',
    small: 'p-3',
    normal: 'p-4 sm:p-6',
    large: 'p-6 sm:p-8',
  };

  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm
        ${!noBorder ? 'border border-gray-200' : ''}
        ${hoverable ? 'transition duration-200 hover:shadow-md' : ''}
        ${className}
      `}
    >
      {(title || actions) && (
        <div className="border-b border-gray-200 px-4 py-4 sm:px-6 flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      
      <div className={paddingClasses[padding]}>{children}</div>
      
      {footer && (
        <div className="border-t border-gray-200 px-4 py-4 sm:px-6 bg-gray-50 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;