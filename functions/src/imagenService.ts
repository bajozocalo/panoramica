import { PredictionServiceClient } from '@google-cloud/aiplatform';
import { helpers } from '@google-cloud/aiplatform';
import * as functions from 'firebase-functions';

export async function generateImages(
  prompts: string[],
  projectId: string,
  location: string,
  extractedProduct: Buffer,
  logoPath?: string
): Promise<Buffer[]> {
  const clientOptions = {
    apiEndpoint: `${location}-aiplatform.googleapis.com`,
  };
  const predictionServiceClient = new PredictionServiceClient(clientOptions);
  const modelName = 'imagegeneration@006';
  const endpoint = `projects/${projectId}/locations/${location}/publishers/google/models/${modelName}`;

  const generationPromises = prompts.map(async (prompt) => {
    const request = {
      endpoint,
      instances: [helpers.toValue({
        prompt,
        image: { bytesBase64Encoded: extractedProduct.toString('base64') }
      })],
      parameters: helpers.toValue({ sampleCount: 1 }),
    };

    const [response] = await predictionServiceClient.predict(request as any);
    const predictions = response.predictions;
    if (!predictions || predictions.length === 0) {
      throw new Error('No predictions returned from Imagen');
    }
    const imageBase64 = (predictions[0] as any).structValue.fields.bytesBase64Encoded.stringValue;
    return Buffer.from(imageBase64, 'base64');
  });

  return Promise.all(generationPromises);
}

export async function editImage(
  prompt: string,
  projectId: string,
  location: string,
  imageBuffer: Buffer
): Promise<Buffer> {
  const clientOptions = {
    apiEndpoint: `${location}-aiplatform.googleapis.com`,
  };
  const predictionServiceClient = new PredictionServiceClient(clientOptions);
  const modelName = 'imagegeneration@006';
  const endpoint = `projects/${projectId}/locations/${location}/publishers/google/models/${modelName}`;

  const request = {
    endpoint,
    instances: [helpers.toValue({
      prompt,
      image: { bytesBase64Encoded: imageBuffer.toString('base64') },
      editMode: 'outpaint'
    })],
    parameters: helpers.toValue({ sampleCount: 1 }),
  };

  const [response] = await predictionServiceClient.predict(request as any);
  const predictions = response.predictions;
  if (!predictions || predictions.length === 0) {
    throw new Error('No predictions returned from Imagen');
  }
  const imageBase64 = (predictions[0] as any).structValue.fields.bytesBase64Encoded.stringValue;
  return Buffer.from(imageBase64, 'base64');
}

export async function magicRetouch(
  prompt: string,
  projectId: string,
  location: string,
  imageBuffer: Buffer,
  maskBuffer: Buffer
): Promise<Buffer> {
  const clientOptions = {
    apiEndpoint: `${location}-aiplatform.googleapis.com`,
  };
  const predictionServiceClient = new PredictionServiceClient(clientOptions);
  const modelName = 'imagegeneration@006';
  const endpoint = `projects/${projectId}/locations/${location}/publishers/google/models/${modelName}`;

  const request = {
    endpoint,
    instances: [helpers.toValue({
      prompt,
      image: { bytesBase64Encoded: imageBuffer.toString('base64') },
      mask: { image: { bytesBase64Encoded: maskBuffer.toString('base64') } },
      editMode: 'inpaint-insert'
    })],
    parameters: helpers.toValue({ sampleCount: 1 }),
  };

  const [response] = await predictionServiceClient.predict(request as any);
  const predictions = response.predictions;
  if (!predictions || predictions.length === 0) {
    throw new Error('No predictions returned from Imagen');
  }
  const imageBase64 = (predictions[0] as any).structValue.fields.bytesBase64Encoded.stringValue;
  return Buffer.from(imageBase64, 'base64');
}

export async function generateWithVirtualModel(
  prompt: string,
  productImageBuffer: Buffer,
  productType: string, // e.g., "t-shirt", "hat", "watch"
  projectId: string,
  location: string = 'us-central1'
): Promise<Buffer> {
  const clientOptions = {
    apiEndpoint: `${location}-aiplatform.googleapis.com`,
  };
  const predictionServiceClient = new PredictionServiceClient(clientOptions);
  const modelName = 'imagegeneration@006'; // Use a model that supports inpainting
  const endpoint = `projects/${projectId}/locations/${location}/publishers/google/models/${modelName}`;

  // === Step 1: Generate the "Mannequin" Image ===
  functions.logger.info('Step 1: Generating virtual model image...');
  const modelGenerationRequest = {
    endpoint,
    instances: [helpers.toValue({ prompt })],
    parameters: helpers.toValue({ sampleCount: 1, aspectRatio: "9:16" }),
  };

  const [modelResponse] = await predictionServiceClient.predict(modelGenerationRequest as any);
  const modelPredictions = modelResponse.predictions;
  if (!modelPredictions || modelPredictions.length === 0) {
    throw new Error('Failed to generate virtual model.');
  }
  const modelImageBase64 = (modelPredictions[0] as any).structValue.fields.bytesBase64Encoded.stringValue;
  functions.logger.info('Step 1 complete.');

  // === Step 2: Generate a Mask for the Placeholder Item ===
  functions.logger.info('Step 2: Generating mask for the placeholder item...');
  const maskGenerationPrompt = `Based on the image, create a precise, solid, black and white mask of the ${productType}. The ${productType} area should be white, and everything else should be black.`;
  
  const maskGenerationRequest = {
    endpoint,
    instances: [helpers.toValue({
      prompt: maskGenerationPrompt,
      image: { bytesBase64Encoded: modelImageBase64 },
      editMode: 'mask-generate',
    })],
    parameters: helpers.toValue({ sampleCount: 1 }),
  };

  const [maskResponse] = await predictionServiceClient.predict(maskGenerationRequest as any);
  const maskPredictions = maskResponse.predictions;
  if (!maskPredictions || maskPredictions.length === 0) {
    throw new Error('Failed to generate mask for inpainting.');
  }
  const maskImageBase64 = (maskPredictions[0] as any).structValue.fields.bytesBase64Encoded.stringValue;
  functions.logger.info('Step 2 complete.');

  // === Step 3: Inpaint the User's Product onto the Model ===
  functions.logger.info("Step 3: Inpainting user's product onto the model...");
  const productImageBase64 = productImageBuffer.toString('base64');
  const inpaintingPrompt = `A photorealistic, high-resolution image of a product integrated onto the model.`;

  const inpaintingRequest = {
    endpoint,
    instances: [helpers.toValue({
      prompt: inpaintingPrompt,
      image: { bytesBase64Encoded: productImageBase64 }, // The product image
      mask: { image: { bytesBase64Encoded: maskImageBase64 } }, // The generated mask
      editMode: 'inpaint-insert',
      baseImage: { bytesBase64Encoded: modelImageBase64 }, // The model image
    })],
    parameters: helpers.toValue({ sampleCount: 1 }),
  };

  const [inpaintingResponse] = await predictionServiceClient.predict(inpaintingRequest as any);
  const inpaintingPredictions = inpaintingResponse.predictions;
  if (!inpaintingPredictions || inpaintingPredictions.length === 0) {
    throw new Error('Failed to inpaint the product onto the model.');
  }
  const finalImageBase64 = (inpaintingPredictions[0] as any).structValue.fields.bytesBase64Encoded.stringValue;
  const finalImageBuffer = Buffer.from(finalImageBase64, 'base64');
  functions.logger.info('Step 3 complete. Virtual model generation successful.');

  return finalImageBuffer;
}