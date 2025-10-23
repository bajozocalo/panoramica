import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { ErrorSuppressor } from "@/components/ErrorSuppressor";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";
import { CreditProvider } from "@/hooks/useCredits";
import { I18nProvider } from "@/components/ui/I18nProvider";

// ... other imports

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} font-sans`}>
        <ErrorSuppressor />
        <I18nProvider>
          <AuthProvider>
            <CreditProvider>
              {children}
            </CreditProvider>
          </AuthProvider>
        </I18nProvider>
        <Toaster />
      </body>
    </html>
  );
}