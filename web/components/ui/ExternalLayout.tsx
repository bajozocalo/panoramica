import Image from 'next/image';
import Link from 'next/link';

export default function ExternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/">
            <Image
              src="/panoramicalogo.png"
              alt="Panoramica.digital Logo"
              width={200}
              height={40}
            />
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/pricing" className="text-slate-600 hover:text-slate-900">
              Pricing
            </Link>
            <Link href="/auth/login" className="text-slate-600 hover:text-slate-900">
              Login
            </Link>
            <Link href="/auth/signup" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Sign Up
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-grow">{children}</main>
      <footer className="bg-slate-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-slate-500">
          <p>&copy; {new Date().getFullYear()} Panoramica.digital. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
