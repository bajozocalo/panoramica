# Panoramica - AI Product Photo Studio

Welcome to Panoramica, an AI-powered product photo studio that helps e-commerce businesses, marketers, and designers create stunning, professional-grade product images in minutes. Upload a product photo, and Panoramica will generate multiple variations in different scenes, eliminating the need for expensive photoshoots.

This project is a monorepo containing the Next.js frontend and Firebase Functions backend.

## Features

- **AI-Powered Image Generation:** Upload a product photo and generate multiple variations in different scenes using Google's Gemini and Imagen models.
- **User Authentication:** Secure user accounts with Firebase Authentication.
- **Credit System:** Users receive free credits on signup and can purchase more to generate images.
- **Stripe Integration:** Secure and seamless payment processing with Stripe Checkout.
- **Cloud Storage:** Store and manage user-generated images in Firebase Cloud Storage.

## Technologies Used

- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** Firebase Cloud Functions, TypeScript
- **Database:** Firestore
- **AI & Machine Learning:** Google Cloud Vertex AI (Gemini, Imagen)
- **Payments:** Stripe

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or later)
- [npm](https://www.npmjs.com/)
- [Firebase CLI](https://firebase.google.com/docs/cli) (`npm install -g firebase-tools`)
- A Firebase project with the Blaze plan enabled.
- A Stripe account for payment processing.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-repository/panoramica.git
    cd panoramica
    ```

2.  **Install frontend dependencies:**
    ```bash
    cd web
    npm install
    ```

3.  **Install backend dependencies:**
    ```bash
    cd ../functions
    npm install
    ```

4.  **Set up Firebase:**
    - Log in to the Firebase CLI:
      ```bash
      firebase login
      ```
    - Associate the project with your Firebase project:
      ```bash
      firebase use --add
      ```
      Select your Firebase project from the list.

5.  **Configure Environment Variables:**

    - **Frontend:**
      In the `/web` directory, copy the example environment file:
      ```bash
      cp .env.local.example .env.local
      ```
      Update `.env.local` with your Firebase project's web app configuration and your Stripe publishable key. You can find your Firebase config in the Firebase console under Project Settings.

    - **Backend (Functions):**
      Set the Stripe secret key and webhook secret using the Firebase CLI. These are stored securely in the Firebase environment configuration.
      ```bash
      firebase functions:config:set stripe.secret_key="your_stripe_secret_key"
      firebase functions:config:set stripe.webhook_secret="your_stripe_webhook_secret"
      ```
      To use these variables in the local emulator, fetch the configuration:
      ```bash
      firebase functions:config:get > .runtimeconfig.json
      ```

## Development

To run the application locally, you'll need to run the frontend and the Firebase emulators in separate terminals.

1.  **Start the Firebase Emulators:**
    From the root directory, start the emulators for Functions, Firestore, and Storage.
    ```bash
    firebase emulators:start
    ```

2.  **Start the Frontend Development Server:**
    In a new terminal, navigate to the `/web` directory and run the Next.js development server.
    ```bash
    cd web
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## Testing

- **Frontend (Jest):**
  Navigate to the `/web` directory and run the tests.
  ```bash
  cd web
  npm test
  ```

- **Backend (Mocha):**
  Navigate to the `/functions` directory and run the tests.
  ```bash
  cd functions
  npm test
  ```

## Deployment

This application is configured for deployment using Firebase.

1.  **Login to Firebase:**
    ```bash
    firebase login
    ```

2.  **Ensure Stripe Environment Variables are Set:**
    If you haven't already, set your Stripe API keys for the production functions environment.
    ```bash
    firebase functions:config:set stripe.secret_key="your_stripe_secret_key"
    firebase functions:config:set stripe.webhook_secret="your_stripe_webhook_secret"
    ```

3.  **Deploy:**
    Run the following command from the root of the project. The Firebase CLI will automatically build and deploy your Next.js app and your functions.
    ```bash
    firebase deploy
    ```
    After deployment, Firebase will provide you with the URL to your live application.