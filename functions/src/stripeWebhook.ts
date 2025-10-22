import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { getStripeClient, getCreditPackages } from './stripeService';

async function recordEvent(eventId: string): Promise<boolean> {
  const eventRef = admin.firestore().collection('stripe_events').doc(eventId);
  const doc = await eventRef.get();
  if (doc.exists) {
    console.log(`Event ${eventId} already processed.`);
    return false;
  }
  await eventRef.set({
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return true;
}

export async function handleStripeWebhook(
  req: functions.https.Request,
  res: functions.Response<any>
) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Missing Stripe webhook secret');
    res.status(500).send('Server configuration error');
    return;
  }

  const stripe = getStripeClient();
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    return;
  }

  const shouldProcess = await recordEvent(event.id);
  if (!shouldProcess) {
    res.json({ received: true, message: 'Event already processed.' });
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutComplete(session);
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdate(subscription);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionCanceled(subscription);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const priceId = session.line_items?.data[0].price?.id;

  if (!userId || !priceId) {
    console.error('Missing userId or priceId in session');
    return;
  }

  const creditPackages = await getCreditPackages();
  const creditPackage = creditPackages.find(p => p.priceId === priceId);

  if (!creditPackage) {
    console.error('Unknown price ID:', priceId);
    return;
  }

  const userRef = admin.firestore().collection('users').doc(userId);
  const userDoc = await userRef.get();
  const currentCredits = userDoc.data()?.credits || 0;

  const batch = admin.firestore().batch();
  const transactionRef = admin.firestore().collection('transactions').doc();

  batch.update(userRef, {
    credits: admin.firestore.FieldValue.increment(creditPackage.credits),
    lifetimeCredits: admin.firestore.FieldValue.increment(creditPackage.credits),
    plan: creditPackage.name.toLowerCase(),
    stripeCustomerId: session.customer,
    lastPurchaseAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  batch.set(transactionRef, {
    userId,
    type: 'purchase',
    amount: creditPackage.credits,
    balanceBefore: currentCredits,
    balanceAfter: currentCredits + creditPackage.credits,
    stripePaymentId: session.payment_intent as string,
    stripePriceId: priceId,
    packageName: creditPackage.name,
    description: `Purchased ${creditPackage.name} package - ${creditPackage.credits} credits`,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await batch.commit();
  console.log(`Added ${creditPackage.credits} credits to user ${userId}`);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  const priceId = subscription.items.data[0]?.price.id;
  const creditPackages = await getCreditPackages();
  const creditPackage = creditPackages.find(p => p.priceId === priceId);

  if (creditPackage) {
    await admin.firestore().collection('users').doc(userId).update({
      plan: creditPackage.name.toLowerCase(),
      subscriptionStatus: subscription.status,
      subscriptionId: subscription.id,
      subscriptionPeriodEnd: admin.firestore.Timestamp.fromDate(new Date(subscription.current_period_end * 1000)),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  await admin.firestore().collection('users').doc(userId).update({
    plan: 'free',
    subscriptionStatus: 'canceled',
    subscriptionId: null,
    subscriptionPeriodEnd: null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}