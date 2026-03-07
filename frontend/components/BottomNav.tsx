'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Mic, HandHeart } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Home', activeColor: '#00E5CC' },
  { href: '/learn', icon: BookOpen, label: 'Learn', activeColor: '#00E5CC' },
  { href: '/practice', icon: Mic, label: 'Practice', activeColor: '#00E5CC' },
  { href: '/prayer', icon: HandHeart, label: 'Prayer', activeColor: '#C9922A' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-navy/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label, activeColor }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          const color = isActive ? activeColor : '#94A3B8';
          return (
            <Link
              key={href}
              href={href}
              className="flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 px-3"
            >
              <Icon
                className="h-5 w-5 transition-colors"
                style={{ color }}
              />
              <span
                className="text-xs transition-colors"
                style={{ color }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
