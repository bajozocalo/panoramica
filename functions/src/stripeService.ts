import Stripe from 'stripe';
import * as functions from 'firebase-functions';

let stripe: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripe) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new functions.https.HttpsError('internal', 'Stripe secret key not configured.');
    }
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    });
  }
  return stripe;
}

export interface CreditPackage {
  priceId: string;
  name: string;
  credits: number;
}

let creditPackages: CreditPackage[] | null = null;

export async function getCreditPackages(): Promise<CreditPackage[]> {
  if (creditPackages) {
    return creditPackages;
  }

  const stripeClient = getStripeClient();
  const prices = await stripeClient.prices.list({
    active: true,
    expand: ['data.product'],
  });

  const packages: CreditPackage[] = [];
  for (const price of prices.data) {
    const product = price.product;
    if (typeof product === 'object' && product !== null && !product.deleted) {
      if ('metadata' in product && product.metadata.credits) {
        packages.push({
          priceId: price.id,
          name: product.name,
          credits: parseInt(product.metadata.credits, 10),
        });
      }
    }
  }

  creditPackages = packages;
  return creditPackages;
}
