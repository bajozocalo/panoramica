import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { ErrorSuppressor } from "@/components/ErrorSuppressor";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";
import { CreditProvider } from "@/hooks/useCredits";
import { Providers } from "@/components/ui/Providers";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const poppins = Poppins({
