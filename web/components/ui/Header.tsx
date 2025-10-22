'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import UserMenu from '@/components/ui/UserMenu';
import CreditBalance from '@/components/ui/CreditBalance';
import { Button } from '@/components/ui/button';

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
      <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logopanoramica.jpg"
            alt="Panoramica.digital Logo"
            width={50}
            height={50}
            className="transition-transform group-hover:scale-105 rounded-full"
          />
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-900 via-blue-700 to-blue-600 bg-clip-text text-transparent tracking-tight hidden sm:block">
            panoramica.digital
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          {user ? (
            <>
              <CreditBalance />
              <Link href="/pricing">
                <Button size="sm">Buy Credits</Button>
              </Link>
              <UserMenu />
            </>
          ) : (
            <>
              <Link href="/playground" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Editor Online
              </Link>
              <Link href="/pricing" className="text-gray-700 hover:text-blue-600 font-medium transition-colors hidden sm:block">
                Pricing
              </Link>
              <Link href="/auth/login" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105"
              >
                <span>Sign Up</span>
                <Sparkles className="w-4 h-4" />
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
