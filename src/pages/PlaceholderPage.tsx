import React from 'react';

interface PlaceholderPageProps {
  title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col h-full">
      <h1 className="page-title capitalize">{title.replace('-', ' ')}</h1>
      <div className="card flex-1 flex flex-col items-center justify-center text-center text-muted">
        <h2 className="text-xl font-bold mb-2">Coming Soon</h2>
        <p>The {title.replace('-', ' ')} module is currently under development.</p>
      </div>
    </div>
  );
}
