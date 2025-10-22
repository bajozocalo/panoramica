'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ExternalLayout from '@/components/ui/ExternalLayout';
import type { Metadata } from 'next';
import { Upload, Sparkles, Image as ImageIcon, Zap, Star, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BeforeAfterSlider } from '@/components/ui/BeforeAfterSlider';

export default function Home() {
  const { t } = useTranslation();

  return (
    <ExternalLayout>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 lg:py-40 xl:py-48 bg-gradient-to-b from-blue-50 via-white to-white relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-20 -z-10" />
          <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-20 -z-10" />

          <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="flex flex-col justify-center space-y-8">
                <div className="space-y-6">
                  <h1 className="text-5xl font-bold tracking-tight sm:text-6xl xl:text-7xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent leading-tight">
                    {t('hero.title')}
                  </h1>
                  <p className="max-w-[600px] text-gray-600 text-lg md:text-xl leading-relaxed">
                    {t('hero.subtitle')}
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:gap-4">
                  <Link
                    href="/auth/signup"
                    className="group inline-flex h-14 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-10 text-lg font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:shadow-xl hover:shadow-blue-600/40 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                    prefetch={false}
                  >
                    {t('hero.cta')}
                    <Sparkles className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-2xl opacity-20" />
                <BeforeAfterSlider />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-24 md:py-32 bg-white">
          <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
            <div className="flex flex-col items-center justify-center space-y-8 text-center">
              <div className="space-y-4 max-w-3xl">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {t('features.title')}
                </h2>
                <p className="max-w-[900px] text-gray-600 text-lg md:text-xl leading-relaxed">
                  {t('features.subtitle')}
                </p>
              </div>
            </div>

            <div className="mx-auto grid max-w-6xl gap-8 py-16 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
              {/* Step 1 */}
              <Card className="relative overflow-hidden border-2 hover:shadow-xl transition-all duration-300 hover:border-blue-200 group">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl">{t('features.step1.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-base leading-relaxed">
                    {t('features.step1.description')}
                  </p>
                </CardContent>
              </Card>

              {/* Step 2 */}
              <Card className="relative overflow-hidden border-2 hover:shadow-xl transition-all duration-300 hover:border-purple-200 group">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl">{t('features.step2.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-base leading-relaxed">
                    {t('features.step2.description')}
                  </p>
                </CardContent>
              </Card>

              {/* Step 3 */}
              <Card className="relative overflow-hidden border-2 hover:shadow-xl transition-all duration-300 hover:border-green-200 group">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl">{t('features.step3.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-base leading-relaxed">
                    {t('features.step3.description')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="w-full py-24 md:py-32 bg-white">
          <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
            <div className="flex flex-col items-center justify-center space-y-8 text-center">
              <div className="space-y-4 max-w-3xl">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {t('testimonials.title')}
                </h2>
                <p className="max-w-[900px] text-gray-600 text-lg md:text-xl leading-relaxed">
                  {t('testimonials.subtitle')}
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-6xl gap-8 py-16 sm:grid-cols-1 md:gap-8 lg:grid-cols-2">
              <Card className="p-6">
                <CardContent className="flex flex-col items-center text-center">
                  <img className="h-20 w-20 rounded-full mb-4" src="https://randomuser.me/api/portraits/women/44.jpg" alt="User 1" />
                  <p className="text-lg font-medium text-gray-800">"{t('testimonials.user1.quote')}"</p>
                  <p className="mt-4 text-base font-semibold text-blue-600">{t('testimonials.user1.name')}</p>
                </CardContent>
              </Card>
              <Card className="p-6">
                <CardContent className="flex flex-col items-center text-center">
                  <img className="h-20 w-20 rounded-full mb-4" src="https://randomuser.me/api/portraits/men/46.jpg" alt="User 2" />
                  <p className="text-lg font-medium text-gray-800">"{t('testimonials.user2.quote')}"</p>
                  <p className="mt-4 text-base font-semibold text-blue-600">{t('testimonials.user2.name')}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="w-full py-16 bg-gray-50">
          <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h3 className="text-2xl font-bold text-gray-700">{t('socialProof.title')}</h3>
              <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
                <Image width={120} height={40} src="https://placehold.co/120x40/png" alt="Placeholder Logo 1" />
                <Image width={120} height={40} src="https://placehold.co/120x40/png" alt="Placeholder Logo 2" />
                <Image width={120} height={40} src="https://placehold.co/120x40/png" alt="Placeholder Logo 3" />
                <Image width={120} height={40} src="https://placehold.co/120x40/png" alt="Placeholder Logo 4" />
                <Image width={120} height={40} src="https://placehold.co/120x40/png" alt="Placeholder Logo 5" />
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="w-full py-24 md:py-32 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
          <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 relative z-10 grid items-center justify-center gap-8 text-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-white">
                Ready to elevate your product photography?
              </h2>
              <p className="mx-auto max-w-[700px] text-blue-100 text-lg md:text-xl leading-relaxed">
                Join hundreds of businesses creating stunning product photos with AI. Start for free today with 30 credits—no credit card required.
              </p>
            </div>
            <div className="mx-auto w-full max-w-md space-y-4">
              <Link href="/auth/signup" prefetch={false}>
                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-semibold bg-white text-blue-700 hover:bg-gray-50 shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
                >
                  Sign Up for Free
                  <Sparkles className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <p className="text-sm text-blue-100">
                30 free credits to start • No credit card required • Cancel anytime
              </p>
            </div>
          </div>
        </section>
      </main>
    </ExternalLayout>
  );
}