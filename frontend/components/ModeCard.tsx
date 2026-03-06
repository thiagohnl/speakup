'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface ModeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  href: string;
}

export default function ModeCard({ title, description, icon: Icon, color, href }: ModeCardProps) {
  return (
    <Link
      href={href}
      className="block w-full rounded-2xl border border-white/10 bg-white/5 p-6 transition-transform active:scale-95"
    >
      <div className="flex items-center gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          <p className="text-sm text-text-secondary">{description}</p>
        </div>
      </div>
    </Link>
  );
}
