import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ExternalLayout from '@/components/ui/ExternalLayout';
import type { Metadata } from 'next';
import { Upload, Sparkles, Image as ImageIcon, Zap, Star, Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Product Photography | Panoramica.digital',
  description: 'Generate beautiful, high-quality product photos in minutes. Our AI-powered tool makes it easy to create stunning images for your e-commerce store.',
};

export default function Home() {
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
                  {/* Trust badge */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium w-fit">
                    <Sparkles className="w-4 h-4" />
                    <span>AI-Powered Product Photography</span>
                  </div>

                  <h1 className="text-5xl font-bold tracking-tight sm:text-6xl xl:text-7xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent leading-tight">
                    Create Stunning Product Photos with AI
                  </h1>
                  <p className="max-w-[600px] text-gray-600 text-lg md:text-xl leading-relaxed">
                    Upload your product, choose from professional scenes, and let our AI generate beautiful, high-quality images for your e-commerce store in minutes.
                  </p>

                  {/* Benefits list */}
                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-base">30 free credits to start</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-base">No credit card required</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-base">Professional results in minutes</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:gap-4">
                  <Link
                    href="/auth/signup"
                    className="group inline-flex h-14 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-10 text-lg font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:shadow-xl hover:shadow-blue-600/40 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                    prefetch={false}
                  >
                    Get Started for Free
                    <Sparkles className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex h-14 items-center justify-center rounded-lg border-2 border-gray-300 bg-white px-10 text-lg font-semibold text-gray-900 transition-all hover:border-gray-400 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                    prefetch={false}
                  >
                    View Pricing
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-2xl opacity-20" />
                <Image
                  src="https://images.pexels.com/photos/7292737/pexels-photo-7292737.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                  width="600"
                  height="600"
                  alt="Stunning product photo created by Panoramica AI"
                  className="relative mx-auto aspect-square overflow-hidden rounded-2xl object-cover shadow-2xl ring-1 ring-gray-900/10"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-24 md:py-32 bg-white">
          <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
            <div className="flex flex-col items-center justify-center space-y-8 text-center">
              <div className="space-y-4 max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 px-5 py-2 text-sm font-semibold text-blue-700">
                  <Zap className="w-4 h-4" />
                  <span>Simple & Powerful</span>
                </div>
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  How It Works
                </h2>
                <p className="max-w-[900px] text-gray-600 text-lg md:text-xl leading-relaxed">
                  Our simple three-step process makes it easy to create professional product photos in minutes.
                </p>
              </div>
            </div>

            <div className="mx-auto grid max-w-6xl gap-8 py-16 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
              {/* Step 1 */}
              <Card className="relative overflow-hidden border-2 hover:shadow-xl transition-all duration-300 hover:border-blue-200 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />
                <CardHeader className="pb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg">
                    <Upload className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-2xl">1. Upload Your Product</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-base leading-relaxed">
                    Upload a clear image of your product. Our AI will automatically remove the background and prepare it for scene integration.
                  </p>
                </CardContent>
              </Card>

              {/* Step 2 */}
              <Card className="relative overflow-hidden border-2 hover:shadow-xl transition-all duration-300 hover:border-purple-200 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />
                <CardHeader className="pb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
                    <ImageIcon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-2xl">2. Choose a Scene</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-base leading-relaxed">
                    Select from a library of professionally designed scenes to match your product's style and brand aesthetic.
                  </p>
                </CardContent>
              </Card>

              {/* Step 3 */}
              <Card className="relative overflow-hidden border-2 hover:shadow-xl transition-all duration-300 hover:border-green-200 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />
                <CardHeader className="pb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4 shadow-lg">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-2xl">3. Generate Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-base leading-relaxed">
                    Our AI will generate a set of high-quality, professional images of your product in the chosen scene within minutes.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="w-full py-16 bg-gradient-to-b from-white to-gray-50">
          <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
            <div className="flex flex-col items-center justify-center space-y-8">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="ml-2 font-medium">Trusted by e-commerce businesses</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 items-center opacity-60">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">1000+</div>
                  <div className="text-sm text-gray-600 mt-1">Products Created</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">50+</div>
                  <div className="text-sm text-gray-600 mt-1">Happy Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">100+</div>
                  <div className="text-sm text-gray-600 mt-1">Scenes Available</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">2 min</div>
                  <div className="text-sm text-gray-600 mt-1">Average Generation</div>
                </div>
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