# Stripe Integration Guide

This document outlines the necessary steps to configure Stripe for the Panoramica application. The integration is designed to be flexible, allowing you to manage credit packages directly from your Stripe dashboard without requiring code changes.

## Overview

The integration uses Stripe Checkout for one-time purchases and Stripe Webhooks to update user credit balances and subscription statuses in Firestore.

- **Products & Prices**: Credit packages are managed as Products in Stripe. The number of credits is stored in the product's metadata.
- **Webhooks**: A webhook endpoint listens for events from Stripe to automatically update user data upon successful payments or subscription changes.
- **Idempotency**: The webhook handler is idempotent, meaning it safely processes each event only once, preventing issues like duplicate credit grants.

---

## 1. Configure Environment Variables

You must set the following environment variables in your Firebase project. You can do this using the Firebase CLI:

```bash
firebase functions:config:set stripe.secret_key="sk_test_..."
firebase functions:config:set stripe.webhook_secret="whsec_..."
```

- `STRIPE_SECRET_KEY`: Your Stripe secret API key. Found in the Stripe Dashboard under **Developers > API keys**.
- `STRIPE_WEBHOOK_SECRET`: Your webhook's signing secret. You'll get this when you create the webhook endpoint (see step 3).

---

## 2. Create Products and Prices in Stripe

The application dynamically fetches credit packages from your Stripe account. For this to work correctly, you must configure them as follows:

1.  **Navigate to the Products Dashboard** in Stripe.
2.  **Create a new Product** for each credit package you want to offer (e.g., "Starter Pack", "Pro Pack").
3.  **Add Metadata**: This is the most critical step. For each product, go to the **Additional options** section and add a metadata field:
    -   **Key**: `credits`
    -   **Value**: The number of credits this package provides (e.g., `150`).
4.  **Create a Price**: After creating the product, create a price for it. The application will automatically fetch all active prices associated with your products. You can have multiple prices (e.g., in different currencies) for the same product.

---

## 3. Set Up Webhooks

Stripe needs to send events to your application to notify it of purchases and subscription updates.

1.  **Navigate to the Webhooks Dashboard** in Stripe.
2.  **Add a new endpoint**.
3.  **Endpoint URL**: The URL for your webhook is based on your Firebase project ID and region:
    `https://<your-firebase-project-region>-<your-firebase-project-id>.cloudfunctions.net/stripeWebhook`
4.  **Listen for Events**: Click **+ Select events** and add the following events:
    -   `checkout.session.completed`
    -   `customer.subscription.created`
    -   `customer.subscription.updated`
    -   `customer.subscription.deleted`
5.  **Create the endpoint**. Once created, Stripe will reveal the **Signing secret**. Copy this value and set it as your `STRIPE_WEBHOOK_SECRET` environment variable as described in step 1.

After completing these steps, your Stripe integration will be fully configured and operational.
