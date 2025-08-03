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
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6">{description}</p>
        {actionButton && (
          <Button asChild>
            <Link href={actionButton.href}>
              {actionButton.icon && <actionButton.icon className="mr-2 h-4 w-4" />}
              {actionButton.label}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
