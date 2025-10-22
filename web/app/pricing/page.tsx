'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ExternalLayout from '@/components/ui/ExternalLayout';
import { Check } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  const { t } = useTranslation();
  const plans = t('pricing.plans', { returnObjects: true }) as any[];

  return (
    <ExternalLayout>
      <main className="flex-1">
        <section className="w-full py-20 md:py-32">
          <div className="w-full max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">{t('pricing.title')}</h1>
            <p className="text-lg text-gray-600">{t('pricing.subtitle')}</p>
          </div>
        </section>

        <section className="w-full pb-20 md:pb-32">
          <div className="w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card key={plan.name} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="text-4xl font-bold mb-2">{plan.price}</div>
                  {plan.priceUnit && <p className="text-gray-500 mb-6">{plan.priceUnit}</p>}
                  <ul className="space-y-4">
                    {plan.features.map((feature: string) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <div className="p-6">
                  <Link href="/auth/signup">
                    <Button className="w-full">{plan.cta}</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </ExternalLayout>
  );
}
