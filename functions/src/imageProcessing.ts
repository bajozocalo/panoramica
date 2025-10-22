import sharp from 'sharp';
import { ImageAnnotatorClient } from '@google-cloud/vision';

let visionClient: ImageAnnotatorClient | null = null;

function getVisionClient(): ImageAnnotatorClient {
  if (!visionClient) {
    visionClient = new ImageAnnotatorClient();
  }
  return visionClient;
}

export function __setVisionClient(client: any) {
  visionClient = client;
}

export async function removeBackground(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // Use Cloud Vision to detect the main object
    const client = getVisionClient();
    const [result] = await (client as any).objectLocalization({
      image: { content: imageBuffer }
    });

    const objects = result.localizedObjectAnnotations || [];
    
    if (objects.length === 0) {
      // No object detected, return original with basic processing
      return await sharp(imageBuffer)
        .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toBuffer();
    }

    // Get the primary object (usually first/highest confidence)
    const mainObject = objects[0];
    const boundingPoly = mainObject.boundingPoly?.normalizedVertices || [];

    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 1024;
    const height = metadata.height || 1024;

    // Convert normalized coordinates to pixel coordinates
    const left = Math.floor(boundingPoly[0].x! * width);
    const top = Math.floor(boundingPoly[0].y! * height);
    const extractWidth = Math.floor((boundingPoly[2].x! - boundingPoly[0].x!) * width);
    const extractHeight = Math.floor((boundingPoly[2].y! - boundingPoly[0].y!) * height);

    // Extract and process the object
    const processed = await sharp(imageBuffer)
      .extract({ left, top, width: extractWidth, height: extractHeight })
      .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toBuffer();

    return processed;

  } catch (error) {
    console.error('Background removal error:', error);
    // Fallback: just resize and center
    return await sharp(imageBuffer)
      .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toBuffer();
  }
}

export async function enhanceProduct(imageBuffer: Buffer): Promise<Buffer> {
  return await sharp(imageBuffer)
    .sharpen()
    .normalise()
    .toBuffer();
}
