import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface AuthFormLayoutProps {
  title: string;
  subtitle: string;
  cardTitle: string;
  cardDescription: string;
  children: React.ReactNode;
  linkText: string;
  linkHref: string;
  linkLabel: string;
}

export function AuthFormLayout({
  title,
  subtitle,
  cardTitle,
  cardDescription,
  children,
  linkText,
  linkHref,
  linkLabel,
}: AuthFormLayoutProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{cardTitle}</CardTitle>
            <CardDescription>{cardDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {children}

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {linkText}{' '}
                <Link href={linkHref} className="text-primary hover:underline">
                  {linkLabel}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
