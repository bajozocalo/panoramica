'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ExternalLayout from '@/components/ui/ExternalLayout';
import { Check } from 'lucide-react';
import Link from 'next/link';

const pricing = {
  es: {
    free: {
      name: 'Gratis',
      price: '$0',
      priceUnit: null,
      features: ['30 créditos gratis', 'Removedor de fondos', 'Funciones básicas de edición'],
      cta: 'Comienza Gratis',
    },
    pro: {
      name: 'Pro',
      price: '$199',
      priceUnit: 'MXN / mes',
      features: ['500 créditos', 'Fondos con IA', 'Retoque Mágico', 'Soporte prioritario'],
      cta: 'Elige Pro',
    },
    max: {
      name: 'Max',
      price: '$499',
      priceUnit: 'MXN / mes',
      features: ['2000 créditos', 'Modelos Virtuales con IA', 'Todas las funciones Pro', 'Soporte premium'],
      cta: 'Elige Max',
    },
  },
  pt: {
    free: {
      name: 'Grátis',
      price: 'R$0',
      priceUnit: null,
      features: ['30 créditos grátis', 'Removedor de fundo', 'Funções básicas de edição'],
      cta: 'Comece Grátis',
    },
    pro: {
      name: 'Pro',
      price: 'R$99',
      priceUnit: 'BRL / mês',
      features: ['500 créditos', 'Fundos com IA', 'Retoque Mágico', 'Suporte prioritário'],
      cta: 'Escolha Pro',
    },
    max: {
      name: 'Max',
      price: 'R$249',
      priceUnit: 'BRL / mês',
      features: ['2000 créditos', 'Modelos Virtuais com IA', 'Todos os recursos Pro', 'Suporte premium'],
      cta: 'Escolha Max',
    },
  },
};

export default function PricingPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language.startsWith('pt') ? 'pt' : 'es';
  const plans = pricing[lang];

  return (
    <ExternalLayout>
      <main className="flex-1">
        <section className="w-full py-20 md:py-32">
          <div className="w-full max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Planes y Precios</h1>
            <p className="text-lg text-gray-600">Elige el plan que mejor se adapte a tus necesidades.</p>
          </div>
        </section>

        <section className="w-full pb-20 md:pb-32">
          <div className="w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.values(plans).map((plan) => (
              <Card key={plan.name} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="text-4xl font-bold mb-2">{plan.price}</div>
                  {plan.priceUnit && <p className="text-gray-500 mb-6">{plan.priceUnit}</p>}
                  <ul className="space-y-4">
                    {plan.features.map((feature) => (
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