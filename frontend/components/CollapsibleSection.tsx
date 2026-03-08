'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function CollapsibleSection({ title, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <button
        onClick={() => setIsOpen(v => !v)}
        className="flex w-full min-h-[48px] items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-text-primary">{title}</span>
        {isOpen
          ? <ChevronUp className="h-4 w-4 text-text-secondary" />
          : <ChevronDown className="h-4 w-4 text-text-secondary" />}
      </button>
      {isOpen && (
        <div className="border-t border-white/10 px-4 py-2">
          {children}
        </div>
      )}
    </div>
  );
}
