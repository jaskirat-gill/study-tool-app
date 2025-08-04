import React from 'react';
import Link from 'next/link';
import { Button } from './ui/button';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionButton?: {
    label: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionButton,
}: EmptyStateProps) {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="w-full max-w-md bg-gradient-to-br from-blue-50/80 to-indigo-100/80 rounded-3xl shadow-xl p-10 flex flex-col items-center border border-blue-100">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full flex items-center justify-center mb-6 shadow-md">
          <Icon className="h-10 w-10 text-indigo-500" />
        </div>
        <h3 className="text-2xl font-bold mb-2 text-gray-900 drop-shadow-sm">{title}</h3>
        <p className="text-base text-gray-600 mb-8 leading-relaxed">{description}</p>
        {actionButton && (
          <Button
            asChild
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-xl shadow hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center"
            size="lg"
          >
            <Link href={actionButton.href}>
              {actionButton.icon && <actionButton.icon className="mr-2 h-5 w-5" />}
              {actionButton.label}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
