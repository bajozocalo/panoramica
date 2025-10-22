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

  if (loading) {
    return (
      <ExternalLayout>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Skeleton className="h-10 w-64 mx-auto" />
            <Skeleton className="h-6 w-96 mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-1 gap-8 mt-12 md:grid-cols-3">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </ExternalLayout>
    )
  }

  return (
    <ExternalLayout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
            Pricing
          </h1>
          <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
            Choose the plan that&apos;s right for you.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 mt-12 md:grid-cols-3">
          {tiers.map((tier) => (
            <Card key={tier.name} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tier.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-4xl font-extrabold text-gray-900 dark:text-white">
                  ${tier.price}
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {tier.credits} credits
                </p>
                <ul className="mt-6 space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg
                          className="w-6 h-6 text-green-500"
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </div>
                      <p className="ml-3 text-base text-gray-500 dark:text-gray-400">{feature}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleCheckout(tier.priceId)}
                  className="w-full"
                >
                  Buy {tier.name}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </ExternalLayout>
  );
}