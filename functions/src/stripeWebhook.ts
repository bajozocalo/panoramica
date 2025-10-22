import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const CREDIT_PACKAGES = {
  'price_12345': { credits: 50, name: 'Starter' },
  'price_67890': { credits: 120, name: 'Pro' },
  'price_13579': { credits: 350, name: 'Business' }
};

export async function handleStripeWebhook(
  req: functions.https.Request,
  res: functions.Response<any>
) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    console.error('Missing Stripe environment variables');
    res.status(500).send('Server configuration error');
    return;
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16'
  });

  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown'}`);
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

  const creditPackage = CREDIT_PACKAGES[priceId as keyof typeof CREDIT_PACKAGES];

  if (!creditPackage) {
    console.error('Unknown price ID:', priceId);
    return;
  }

  // Get current user data
  const userRef = admin.firestore().collection('users').doc(userId);
  const userDoc = await userRef.get();
  const currentCredits = userDoc.data()?.credits || 0;

  const batch = admin.firestore().batch();
  const transactionRef = admin.firestore().collection('transactions').doc();

  // Update user credits and metadata
  batch.update(userRef, {
    credits: admin.firestore.FieldValue.increment(creditPackage.credits),
    lifetimeCredits: admin.firestore.FieldValue.increment(creditPackage.credits),
    plan: creditPackage.name.toLowerCase(),
    stripeCustomerId: session.customer,
    lastPurchaseAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Create purchase transaction record
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
  const creditPackage = CREDIT_PACKAGES[priceId as keyof typeof CREDIT_PACKAGES];

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