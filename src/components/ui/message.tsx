import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface MessageProps {
  type: 'error' | 'success';
  message: string;
}

export function Message({ type, message }: MessageProps) {
  const isError = type === 'error';
  
  return (
    <div className={`flex items-center space-x-2 p-3 rounded-lg ${
      isError 
        ? 'text-red-600 bg-red-50' 
        : 'text-green-600 bg-green-50'
    }`}>
      {isError ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <CheckCircle className="h-4 w-4" />
      )}
      <span className="text-sm">{message}</span>
    </div>
  );
}
