import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ExternalLayout from '@/components/ui/ExternalLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Product Photography | Panoramica.digital',
  description: 'Generate beautiful, high-quality product photos in minutes. Our AI-powered tool makes it easy to create stunning images for your e-commerce store.',
};

export default function Home() {
  return (
    <ExternalLayout>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 lg:py-40 xl:py-56 bg-gray-100">
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
              <div className="flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Create Stunning Product Photos with AI
                  </h1>
                  <p className="max-w-[600px] text-gray-600 md:text-xl leading-relaxed">
                    Upload your product, choose a scene, and let our AI generate beautiful, high-quality images for your
                    e-commerce store.
                  </p>
                </div>
                <div className="flex flex-col gap-4 min-[400px]:flex-row">
                  <Link
                    href="/auth/signup"
                    className="inline-flex h-12 items-center justify-center rounded-md bg-gray-900 px-10 text-lg font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                    prefetch={false}
                  >
                    Get Started for Free
                  </Link>
                </div>
              </div>
              <Image
                src="https://images.pexels.com/photos/7292737/pexels-photo-7292737.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                width="550"
                height="550"
                alt="Stunning product photo created by Panoramica AI"
                className="mx-auto aspect-square overflow-hidden rounded-xl object-cover"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-20 md:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium">
                  Key Features
                </div>
                <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl">How It Works</h2>
                <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our simple three-step process makes it easy to create professional product photos in minutes.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 py-16 sm:grid-cols-2 md:gap-12 lg:grid-cols-3">
              <Card className="p-6">
                <CardHeader>
                  <CardTitle>1. Upload Your Product</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Upload a clear image of your product. Our AI will automatically remove the background.</p>
                </CardContent>
              </Card>
              <Card className="p-6">
                <CardHeader>
                  <CardTitle>2. Choose a Scene</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Select from a library of professionally designed scenes to match your product&apos;s style.</p>
                </CardContent>
              </Card>
              <Card className="p-6">
                <CardHeader>
                  <CardTitle>3. Generate Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Our AI will generate a set of high-quality images of your product in the chosen scene.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="w-full py-20 md:py-32 border-t bg-gray-100">
          <div className="container grid items-center justify-center gap-6 px-4 text-center md:px-6">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold tracking-tighter md:text-5xl">
                Ready to elevate your product photography?
              </h2>
              <p className="mx-auto max-w-[600px] text-gray-600 md:text-xl/relaxed">
                Sign up today and start creating stunning product photos with the power of AI.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <Link href="/auth/signup" prefetch={false}>
                <Button type="submit" className="w-full h-12 text-lg">
                  Sign Up for Free
                </Button>
              </Link>
              <p className="text-xs text-gray-500">
                30 free credits to start. No credit card required.
              </p>
            </div>
          </div>
        </section>
      </main>
    </ExternalLayout>
  );
}