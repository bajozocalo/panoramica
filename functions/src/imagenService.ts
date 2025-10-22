import { PredictionServiceClient } from '@google-cloud/aiplatform';
import { helpers } from '@google-cloud/aiplatform';
import * as admin from 'firebase-admin';
import sharp from 'sharp';

export async function generateImages(
  prompts: string[],
  projectId: string,
  location: string = 'us-central1',
  productImageBuffer?: Buffer,
  logoPath?: string
): Promise<Buffer[]> {
  const clientOptions = {
    apiEndpoint: `${location}-aiplatform.googleapis.com`,
  };

  const predictionServiceClient = new PredictionServiceClient(clientOptions);

  const modelName = productImageBuffer
    ? 'imagegeneration@006'
    : 'imagen-3.0-generate-001';

  const endpoint = `projects/${projectId}/locations/${location}/publishers/google/models/${modelName}`;

  let logoBuffer: Buffer | null = null;
  if (logoPath) {
    try {
      const bucket = admin.storage().bucket();
      const [fileBuffer] = await bucket.file(logoPath).download();
      logoBuffer = fileBuffer;
    } catch (error) {
      console.error('Error downloading logo:', error);
      // Continue without logo if download fails
    }
  }

  const generationPromises = prompts.map(async (prompt) => {
    let instanceValue;

    if (productImageBuffer) {
      const productImageBase64 = productImageBuffer.toString('base64');
      const editRequest = {
        prompt: prompt,
        image: { bytesBase64Encoded: productImageBase64 },
        editMode: 'inpaint-insert',
        maskMode: 'background'
      };
      instanceValue = helpers.toValue(editRequest);
    } else {
      const promptText = { prompt: prompt };
      instanceValue = helpers.toValue(promptText);
    }

    const parameters = helpers.toValue({
      sampleCount: 1,
      aspectRatio: "1:1",
      guidanceScale: 15,
      numInferenceSteps: 40
    });

    const request = {
      endpoint: endpoint,
      instances: [instanceValue],
      parameters: parameters,
    };

    try {
      const [response] = await predictionServiceClient.predict(request as any);
      const predictions = response.predictions;

      if (predictions && predictions.length > 0) {
        const imageBytesBase64 = (predictions[0] as any).structValue.fields.bytesBase64Encoded.stringValue;
        let imageBuffer: Buffer = Buffer.from(imageBytesBase64, 'base64');

        if (logoBuffer) {
          const image = sharp(imageBuffer);
          const metadata = await image.metadata();
          const imageWidth = metadata.width || 1024;
          const imageHeight = metadata.height || 1024;

          const logo = sharp(logoBuffer);
          const logoMetadata = await logo.metadata();
          const logoWidth = logoMetadata.width || 100;
          const logoHeight = logoMetadata.height || 100;

          const resizedLogoWidth = Math.floor(imageWidth * 0.15);
          const resizedLogoHeight = Math.floor((resizedLogoWidth / logoWidth) * logoHeight);

          const resizedLogoBuffer = await logo.resize(resizedLogoWidth, resizedLogoHeight).toBuffer();

          const margin = Math.floor(imageWidth * 0.02);

          imageBuffer = await image.composite([
            {
              input: resizedLogoBuffer,
              gravity: 'southeast',
              top: imageHeight - resizedLogoHeight - margin,
              left: imageWidth - resizedLogoWidth - margin,
            },
          ]).toBuffer() as Buffer;
        }

        return imageBuffer;
      } else {
        throw new Error('No predictions received.');
      }
    } catch (error) {
      console.error(`Error generating image for prompt: ${prompt}`, error);
      throw error;
    }
  });

  return await Promise.all(generationPromises);
}

export async function editImage(
  prompt: string,
  projectId: string,
  location: string = 'us-central1',
  imageBuffer: Buffer
): Promise<Buffer> {
  const clientOptions = {
    apiEndpoint: `${location}-aiplatform.googleapis.com`,
  };

  const predictionServiceClient = new PredictionServiceClient(clientOptions);

  const modelName = 'imagegeneration@006';
  const endpoint = `projects/${projectId}/locations/${location}/publishers/google/models/${modelName}`;

  const imageBase64 = imageBuffer.toString('base64');

  const editRequest = {
    prompt: prompt,
    image: { bytesBase64Encoded: imageBase64 },
    editMode: 'product-image',
  };

  const instanceValue = helpers.toValue(editRequest);

  const parameters = helpers.toValue({
    sampleCount: 1,
    aspectRatio: "1:1",
    guidanceScale: 15,
    numInferenceSteps: 40
  });

  const request = {
    endpoint: endpoint,
    instances: [instanceValue],
    parameters: parameters,
  };

  try {
    const [response] = await predictionServiceClient.predict(request as any);
    const predictions = response.predictions;

    if (predictions && predictions.length > 0) {
      const imageBytesBase64 = (predictions[0] as any).structValue.fields.bytesBase64Encoded.stringValue;
      return Buffer.from(imageBytesBase64, 'base64');
    } else {
      throw new Error('No predictions received.');
    }
  } catch (error) {
    console.error(`Error editing image for prompt: ${prompt}`, error);
    throw error;
  }
}