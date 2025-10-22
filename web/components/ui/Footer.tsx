import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-50 to-gray-100 border-t border-gray-200">
      <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logopanoramica.jpg"
                alt="Panoramica.digital Logo"
                width={80}
                height={80}
                className="rounded-full"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-900 via-blue-700 to-blue-600 bg-clip-text text-transparent tracking-tight">
                panoramica.digital
              </span>
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed">
              AI-powered product photography for e-commerce businesses.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/pricing" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/auth/signup" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact/Legal */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-gray-300 text-center">
          <p className="text-sm text-gray-600">
            &copy; {new Date().getFullYear()} Panoramica.digital. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
