// Force redeploy
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import sharp from 'sharp';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import cors from 'cors';

const corsHandler = cors({ origin: true });

admin.initializeApp();

// HTTP endpoint for quick health check
export const healthCheck = functions.https.onRequest((req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// User creation trigger - give free credits
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
    const batch = admin.firestore().batch();
    const userRef = admin.firestore().collection('users').doc(user.uid);
    const transactionRef = admin.firestore().collection('transactions').doc();
    const freeCredits = 30;
  
    const settingsRef = admin.firestore().collection('settings').doc('global');
    const settingsDoc = await settingsRef.get();
    const settingsData = settingsDoc.data();
  
    const freePlanLimits = settingsData?.plans?.free || {
      maxImagesPerGeneration: 3,
      maxGenerationsPerDay: 10
    };
  
    batch.set(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      credits: freeCredits,
      lifetimeCredits: freeCredits,
      totalGenerations: 0,
      totalImagesGenerated: 0,
      plan: 'free',
      planLimits: freePlanLimits,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      preferences: {
        emailNotifications: true
      },
      metadata: {
        onboardingCompleted: false
      }
    });
  
    batch.set(transactionRef, {
      userId: user.uid,
      type: 'signup',
      amount: freeCredits,
      balanceBefore: 0,
      balanceAfter: freeCredits,
      description: 'Welcome bonus credits',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  
    await batch.commit();
});

// Stripe webhook - lazy load to avoid timeout
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const { handleStripeWebhook } = await import('./stripeWebhook');
  await handleStripeWebhook(req, res);
});

// Stripe checkout - lazy load to avoid timeout
export const createStripeCheckoutSession = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { priceId } = data;
    const userId = context.auth.uid;
    try {
      const { getStripeClient } = await import('./stripeService');
      const stripeClient = getStripeClient();
      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/pricing`,
        metadata: { userId },
      });
      return { sessionId: session.id };
    } catch (error) {
      functions.logger.error('Stripe Checkout error:', error);
      throw new functions.https.HttpsError('internal', 'Failed to create Stripe Checkout session');
    }
  }
);

let globalSettings: admin.firestore.DocumentData | null = null;

// Image generation - lazy load heavy dependencies
export const generateProductPhotos = functions.runWith({ timeoutSeconds: 540, memory: '2GB' }).https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = context.auth.uid;
    const { imagePath, productType, scenes, styles, moods, numberOfVariations = 3, logoPath, customPrompt } = data;
    if (!imagePath) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required field: imagePath');
    }
    if (!productType || productType.trim() === '') {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required field: productType');
    }
    if (!customPrompt && (!scenes || !Array.isArray(scenes) || scenes.length === 0)) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required field: scenes or customPrompt');
    }
    try {
      if (!globalSettings) {
        const settingsRef = admin.firestore().collection('settings').doc('global');
        const settingsDoc = await settingsRef.get();
        globalSettings = settingsDoc.data();
      }
      if (!globalSettings) {
        throw new functions.https.HttpsError('internal', 'App settings not configured.');
      }
      const userRef = admin.firestore().collection('users').doc(userId);
      const userDoc = await userRef.get();
      const userData = userDoc.data();
      if (!userData) {
        throw new functions.https.HttpsError('not-found', 'User not found');
      }
      
      const costPerImage = customPrompt ? globalSettings.generation.costs.background : globalSettings.generation.costs.professional;
      const requiredCredits = (customPrompt ? 1 : scenes.length) * numberOfVariations * costPerImage;

      const availableCredits = userData.credits || 0;
      if (availableCredits < requiredCredits) {
        throw new functions.https.HttpsError('failed-precondition', `Insufficient credits. Need ${requiredCredits}, have ${availableCredits}`);
      }
      const { VertexAI } = await import('@google-cloud/vertexai');
      const { removeBackground } = await import('./imageProcessing');
      const { generatePrompts } = await import('./geminiService');
      const { generateImages } = await import('./imagenService');
      const PROJECT_ID = process.env.GCLOUD_PROJECT || 'panoramica-digital';
      const LOCATION = 'us-central1';
      const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
      const bucket = admin.storage().bucket();
      const originalFile = bucket.file(imagePath);
      const [imageBuffer] = await originalFile.download();
      functions.logger.info('Removing background and extracting product...');
      const extractedProduct = await removeBackground(imageBuffer);
      functions.logger.info('Generating scene/background prompts with Gemini...');
      const prompts = await generatePrompts(vertexAI, productType, scenes, numberOfVariations, styles, moods, customPrompt);
      functions.logger.info('Compositing product into generated scenes with Imagen...');
      const generatedImages = await generateImages(prompts, PROJECT_ID, LOCATION, extractedProduct, logoPath);
      functions.logger.info('Uploading generated images...');
      const timestamp = Date.now();
      const uploadPromises = generatedImages.map(async (imgBuffer, index) => {
        const filename = `generated/${userId}/${timestamp}_${index}.png`;
        const file = bucket.file(filename);
        await file.save(imgBuffer, { contentType: 'image/png', metadata: { metadata: { userId, generatedAt: new Date().toISOString(), prompt: prompts[index] } } });
        await file.makePublic();
        return { url: `https://storage.googleapis.com/${bucket.name}/${filename}`, prompt: prompts[index] };
      });
      const uploadedImages = await Promise.all(uploadPromises);
      const batch = admin.firestore().batch();
      const generationRef = admin.firestore().collection('generations').doc();
      const transactionRef = admin.firestore().collection('transactions').doc();
      const statsRef = admin.firestore().collection('usage_stats').doc(`${userId}_${new Date().toISOString().split('T')[0]}`);
      const processingTime = Date.now() - timestamp;
      batch.update(userRef, {
        credits: admin.firestore.FieldValue.increment(-requiredCredits),
        totalGenerations: admin.firestore.FieldValue.increment(1),
        totalImagesGenerated: admin.firestore.FieldValue.increment(uploadedImages.length),
        lastGenerationAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      batch.set(generationRef, {
        generationId: generationRef.id,
        userId,
        status: 'completed',
        productType,
        scenes,
        styles,
        moods,
        numberOfVariations,
        originalImage: { storagePath: imagePath },
        generatedImages: uploadedImages.map((img, idx) => ({ ...img, storagePath: img.url.replace(`https://storage.googleapis.com/${bucket.name}/`, ''), index: idx })),
        creditsUsed: requiredCredits,
        creditBalance: availableCredits - requiredCredits,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        processingTimeMs: processingTime
      });
      batch.set(transactionRef, {
        userId,
        type: 'deduction',
        amount: -requiredCredits,
        balanceBefore: availableCredits,
        balanceAfter: availableCredits - requiredCredits,
        generationId: generationRef.id,
        description: `Generated ${uploadedImages.length} images for ${scenes.join(', ')}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      batch.set(statsRef, {
        statId: statsRef.id,
        userId,
        date: new Date().toISOString().split('T')[0],
        generationsCount: admin.firestore.FieldValue.increment(1),
        imagesGenerated: admin.firestore.FieldValue.increment(uploadedImages.length),
        creditsUsed: admin.firestore.FieldValue.increment(requiredCredits),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      await batch.commit();
      functions.logger.info(`Successfully generated ${uploadedImages.length} images`);
      return { success: true, images: uploadedImages, creditsUsed: requiredCredits, creditsRemaining: availableCredits - requiredCredits };
    } catch (error) {
      functions.logger.error('Generation error:', error);
      throw new functions.https.HttpsError('internal', `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});

export const editProductPhoto = functions.runWith({ timeoutSeconds: 540, memory: '2GB' }).https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = context.auth.uid;
    const { imageUrl, prompt } = data;
    if (!imageUrl) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required field: imageUrl');
    }
    if (!prompt) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required field: prompt');
    }
    try {
      const settingsRef = admin.firestore().collection('settings').doc('global');
      const settingsDoc = await settingsRef.get();
      const settingsData = settingsDoc.data();
      if (!settingsData) {
        throw new functions.https.HttpsError('internal', 'App settings not configured.');
      }
      const userRef = admin.firestore().collection('users').doc(userId);
      const userDoc = await userRef.get();
      const userData = userDoc.data();
      if (!userData) {
        throw new functions.https.HttpsError('not-found', 'User not found');
      }
      const costPerImage = settingsData.generation.costs.edit;
      const requiredCredits = costPerImage;
      const availableCredits = userData.credits || 0;
      if (availableCredits < requiredCredits) {
        throw new functions.https.HttpsError('failed-precondition', `Insufficient credits. Need ${requiredCredits}, have ${availableCredits}`);
      }
      const { editImage } = await import('./imagenService');
      const PROJECT_ID = process.env.GCLOUD_PROJECT || 'panoramica-digital';
      const LOCATION = 'us-central1';
      const bucket = admin.storage().bucket();
      const [imageBuffer] = await bucket.file(imageUrl.replace(`https://storage.googleapis.com/${bucket.name}/`, '')).download();
      
      const editedImage = await editImage(prompt, PROJECT_ID, LOCATION, imageBuffer);

      const timestamp = Date.now();
      const filename = `generated/${userId}/${timestamp}_edited.png`;
      const file = bucket.file(filename);
      await file.save(editedImage, { contentType: 'image/png', metadata: { metadata: { userId, generatedAt: new Date().toISOString(), prompt: prompt } } });
      await file.makePublic();
      const uploadedImage = { url: `https://storage.googleapis.com/${bucket.name}/${filename}`, prompt: prompt };

      const batch = admin.firestore().batch();
      const generationRef = admin.firestore().collection('generations').doc();
      batch.update(userRef, {
        credits: admin.firestore.FieldValue.increment(-requiredCredits),
      });
      batch.set(generationRef, {
        userId,
        status: 'completed',
        prompt,
        generatedImages: [uploadedImage],
        creditsUsed: requiredCredits,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      await batch.commit();
      return { success: true, images: [uploadedImage] };
    } catch (error) {
      functions.logger.error('Edit error:', error);
      throw new functions.https.HttpsError('internal', `Edit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});


// Manual trigger to initialize app settings
export const initializeAppSettings = functions.https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
      try {
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) {
          res.status(401).send('Unauthorized');
          return;
        }
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        if (decodedToken.email !== process.env.ADMIN_EMAIL) {
          res.status(403).send('Permission Denied');
          return;
        }
        const settingsRef = admin.firestore().collection('settings').doc('global');
        const defaultSettings = {
          plans: {
            free: { name: 'Free', maxGenerationsPerDay: 10, maxImagesPerGeneration: 3 },
            starter: { name: 'Starter', price: 19, credits: 150, priceId: 'price_starter_monthly' },
            pro: { name: 'Pro', price: 49, credits: 500, priceId: 'price_pro_monthly' }
          },
          pricing: {
            tiers: [
              { name: 'Starter', priceId: 'price_19', price: 19, credits: 150, features: ['150 credits', 'Standard image quality', 'Email support'] },
              { name: 'Pro', priceId: 'price_49', price: 49, credits: 500, features: ['500 credits', 'High image quality', 'Priority email support'] },
            ]
          },
          generation: {
            costs: {
              basic: 1, // Gemini 2.5 Flash
              professional: 3, // Imagen
              background: 6, // From prompt
              edit: 3,
            }
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await settingsRef.set(defaultSettings, { merge: true });
        res.json({ data: { success: true, message: 'App settings initialized successfully.' } });
      } catch (error) {
        functions.logger.error('Error initializing settings:', error);
        res.status(500).json({ data: { success: false, error: 'Internal server error' } });
      }
    });
});

// Delete Generation
export const deleteGeneration = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { generationId } = data;
    const userId = context.auth.uid;
    if (!generationId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required field: generationId');
    }
    const db = admin.firestore();
    const bucket = admin.storage().bucket();
    const generationRef = db.collection('generations').doc(generationId);
    try {
      const doc = await generationRef.get();
      if (!doc.exists) {
        throw new functions.https.HttpsError('not-found', 'Generation not found');
      }
      const generationData = doc.data();
      if (generationData?.userId !== userId) {
        throw new functions.https.HttpsError('permission-denied', 'You do not have permission to delete this generation');
      }
      const deletePromises: Promise<any>[] = [];
      if (generationData.originalImage?.storagePath) {
        deletePromises.push(bucket.file(generationData.originalImage.storagePath).delete());
      }
      if (generationData.generatedImages) {
        generationData.generatedImages.forEach((image: any) => {
          if (image.storagePath) {
            deletePromises.push(bucket.file(image.storagePath).delete());
            const thumbName = `thumb_${path.basename(image.storagePath)}`;
            deletePromises.push(bucket.file(`generated_thumbnails/${thumbName}`).delete());
          }
        });
      }
      await Promise.all(deletePromises);
      await generationRef.delete();
      return { success: true, message: 'Generation deleted successfully' };
    } catch (error) {
      functions.logger.error('Error deleting generation:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError('internal', 'Failed to delete generation');
    }
});

// Thumbnail generation

export const generateThumbnail = functions.storage.object().onFinalize(async (object) => {

      const bucket = admin.storage().bucket(object.bucket);

      const filePath = object.name;

            const contentType = object.contentType;

            if (!filePath || !contentType || !contentType.startsWith('image/')) {

              return functions.logger.info('This is not an image.');

            }

            if (filePath.startsWith('generated_thumbnails/')) {

              return functions.logger.info('Already a thumbnail.');

            }

            const fileName = path.basename(filePath);

            const tempFilePath = path.join(os.tmpdir(), fileName);

            const metadata = { contentType: contentType };

            await bucket.file(filePath).download({ destination: tempFilePath });

            functions.logger.info('Image downloaded locally to', tempFilePath);

            const thumbFileName = `thumb_${fileName}`;

            const thumbFilePath = path.join(os.tmpdir(), thumbFileName);

            await sharp(tempFilePath).resize(200, 200).toFile(thumbFilePath);

            const thumbUploadPath = `generated_thumbnails/${thumbFileName}`;

            await bucket.upload(thumbFilePath, { destination: thumbUploadPath, metadata: metadata });

            return fs.unlinkSync(tempFilePath);
});

export const generateWithVirtualModel = functions.runWith({ timeoutSeconds: 540, memory: '2GB' }).https.onCall(async (data, context) => {

    if (!context.auth) {

      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');

    }

    const userId = context.auth.uid;

    const { imageUrl, prompt } = data;

    if (!imageUrl || !prompt) {

      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: imageUrl or prompt');

    }



    try {

      const userRef = admin.firestore().collection('users').doc(userId);

      const userDoc = await userRef.get();

      const userData = userDoc.data();

      if (!userData) {

        throw new functions.https.HttpsError('not-found', 'User not found');

      }



      // TODO: Add credit check for virtual models



      const { generateWithVirtualModel: generateFn } = await import('./imagenService');

      const PROJECT_ID = process.env.GCLOUD_PROJECT || 'panoramica-digital';

      const LOCATION = 'us-central1';

      const bucket = admin.storage().bucket();



      const [imageBuffer] = await bucket.file(imageUrl.replace(`https://storage.googleapis.com/${bucket.name}/`, '')).download();



      const editedImage = await generateFn(prompt, imageBuffer, PROJECT_ID, LOCATION);



      const timestamp = Date.now();

      const filename = `generated/${userId}/${timestamp}_virtual_model.png`;

      const file = bucket.file(filename);

      await file.save(editedImage, { contentType: 'image/png' });

      await file.makePublic();

      const uploadedImage = { url: `https://storage.googleapis.com/${bucket.name}/${filename}` };



      // TODO: Add transaction record for credit deduction



      return { success: true, image: uploadedImage };

    } catch (error) {

      functions.logger.error('Virtual Model Generation error:', error);

      throw new functions.https.HttpsError('internal', `Virtual Model Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

    }

});





export const magicRetouch = functions.runWith({ timeoutSeconds: 540, memory: '2GB' }).https.onCall(async (data, context) => {



    if (!context.auth) {



      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');



    }



    const userId = context.auth.uid;



    const { imageUrl, maskUrl, prompt } = data;



    if (!imageUrl || !maskUrl || !prompt) {



      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: imageUrl, maskUrl, or prompt');



    }







    try {



      const userRef = admin.firestore().collection('users').doc(userId);



      const userDoc = await userRef.get();



      const userData = userDoc.data();



      if (!userData) {



        throw new functions.https.HttpsError('not-found', 'User not found');



      }







      // TODO: Add credit check for magic retouch



      



      const { magicRetouch: retouchFn } = await import('./imagenService');



      const PROJECT_ID = process.env.GCLOUD_PROJECT || 'panoramica-digital';



      const LOCATION = 'us-central1';



      const bucket = admin.storage().bucket();







      const [imageBuffer] = await bucket.file(imageUrl.replace(`https://storage.googleapis.com/${bucket.name}/`, '')).download();



      const [maskBuffer] = await bucket.file(maskUrl.replace(`https://storage.googleapis.com/${bucket.name}/`, '')).download();







      const editedImage = await retouchFn(prompt, PROJECT_ID, LOCATION, imageBuffer, maskBuffer);







      const timestamp = Date.now();



      const filename = `generated/${userId}/${timestamp}_retouched.png`;



      const file = bucket.file(filename);



      await file.save(editedImage, { contentType: 'image/png' });



      await file.makePublic();



      const uploadedImage = { url: `https://storage.googleapis.com/${bucket.name}/${filename}` };







      // TODO: Add transaction record for credit deduction







      return { success: true, image: uploadedImage };



    } catch (error) {



      functions.logger.error('Magic Retouch error:', error);



      throw new functions.https.HttpsError('internal', `Magic Retouch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);



    }



});
