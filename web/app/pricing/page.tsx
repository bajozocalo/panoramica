'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { functions, db } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import ExternalLayout from '@/components/ui/ExternalLayout';
import { Check, Sparkles, Zap, Star, Crown } from 'lucide-react';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface Tier {
  name: string;
  priceId: string;
  price: number;
  credits: number;
  features: string[];
}

export default function PricingPage() {
  const { user } = useAuth();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTiers = async () => {
      const settingsRef = doc(db, 'settings', 'global');
      const settingsDoc = await getDoc(settingsRef);
      if (settingsDoc.exists()) {
        setTiers(settingsDoc.data().pricing.tiers);
      }
      setLoading(false);
    };
    fetchTiers();
  }, []);

  const handleCheckout = async (priceId: string) => {
    if (!user) {
      // Redirect to login or show a message
      window.location.href = '/auth/login?redirect=/pricing';
      return;
    }

    try {
      const createStripeCheckoutSession = httpsCallable(
        functions,
        'createStripeCheckoutSession'
      );
      const { data } = await createStripeCheckoutSession({ priceId });
      const { sessionId } = data as any;

      const stripe = await stripePromise;
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error('Error creating Stripe Checkout session:', error);
    }
  };

  // Helper to determine if tier is most popular (middle tier)
  const isPopular = (index: number) => index === 1 && tiers.length === 3;

  if (loading) {
    return (
      <ExternalLayout>
        <main className="w-full max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-24">
          <div className="text-center mb-16">
            <Skeleton className="h-12 w-72 mx-auto mb-4" />
            <Skeleton className="h-6 w-[600px] mx-auto" />
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <Skeleton className="h-[500px] w-full" />
            <Skeleton className="h-[500px] w-full" />
            <Skeleton className="h-[500px] w-full" />
          </div>
        </main>
      </ExternalLayout>
    )
  }

  return (
    <ExternalLayout>
      <main className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-purple-50/30 -z-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-10 -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-10 -z-10" />

        <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-24">
          {/* Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Simple, Transparent Pricing</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent mb-6">
              Choose Your Plan
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Start creating stunning product photos today. All plans include access to our complete scene library and AI-powered generation.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-6 max-w-7xl mx-auto">
            {tiers.map((tier, index) => {
              const popular = isPopular(index);

              return (
                <Card
                  key={tier.name}
                  className={`relative flex flex-col transition-all duration-300 hover:shadow-2xl ${
                    popular
                      ? 'border-2 border-blue-500 shadow-xl scale-105 lg:scale-110 z-10'
                      : 'border-2 hover:border-blue-200'
                  }`}
                >
                  {/* Popular badge */}
                  {popular && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      <span>Most Popular</span>
                    </div>
                  )}

                  <CardHeader className="pb-8 pt-8">
                    {/* Tier icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                      popular
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                        : 'bg-gradient-to-br from-gray-400 to-gray-500'
                    }`}>
                      {popular ? (
                        <Star className="w-6 h-6 text-white fill-white" />
                      ) : (
                        <Zap className="w-6 h-6 text-white" />
                      )}
                    </div>

                    <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                      {tier.name}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="flex-1 pb-8">
                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-gray-900">
                          ${tier.price}
                        </span>
                        <span className="text-gray-500 text-lg">one-time</span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-blue-600">
                        {tier.credits} generation credits
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Credits never expire
                      </p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-4">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                              <Check className="w-3 h-3 text-green-600 stroke-[3]" />
                            </div>
                          </div>
                          <p className="text-base text-gray-700 leading-relaxed">{feature}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-4 pb-8">
                    <Button
                      onClick={() => handleCheckout(tier.priceId)}
                      className={`w-full h-12 text-base font-semibold transition-all ${
                        popular
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-600/30 hover:shadow-xl hover:scale-105'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                      }`}
                    >
                      {user ? `Buy ${tier.name}` : 'Sign In to Purchase'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Additional info section */}
          <div className="mt-20 text-center">
            <div className="inline-flex flex-col gap-4 p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-gray-200 max-w-3xl">
              <div className="flex items-center justify-center gap-2 text-gray-700 font-semibold">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span>What's Included in Every Plan</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Check className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-700">Access to all scenes</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Check className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-700">High-resolution exports</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-700">Commercial license</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ or CTA */}
          <div className="mt-20 text-center">
            <p className="text-gray-600 text-lg mb-4">
              Not sure which plan is right for you?
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold hover:underline"
            >
              Start with 30 free credits
              <Sparkles className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </ExternalLayout>
  );
}