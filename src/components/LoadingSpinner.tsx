import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`animate-pulse space-y-4 ${className}`}>
      <div className={`bg-muted rounded w-1/2 mx-auto ${sizeClasses[size]}`}></div>
      <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
    </div>
  );
}
