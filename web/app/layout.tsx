import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { ErrorSuppressor } from "@/components/ErrorSuppressor";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";
import { CreditProvider } from "@/hooks/useCredits";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: '--font-poppins'
});

export const metadata: Metadata = {
  title: {
    template: '%s | Panoramica.digital',
    default: 'Panoramica.digital | AI-Powered Product Photography',
  },
  description: 'Create stunning product photos with AI. Upload your product, choose a scene, and let our AI generate beautiful, high-quality images for your e-commerce store.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} font-sans`}>
        <ErrorSuppressor />
        <AuthProvider>
          <CreditProvider>
            {children}
          </CreditProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
