import { VertexAI } from '@google-cloud/vertexai';
import * as functions from 'firebase-functions';

const SCENE_TEMPLATES = {
  'modern-kitchen': 'A sleek, modern kitchen with marble countertops and professional-grade stainless steel appliances, bathed in bright, natural morning light from a large window.',
  'outdoor-picnic': 'A vibrant outdoor picnic on a lush green lawn, with a classic checkered blanket and soft, dappled sunlight filtering through nearby trees.',
  'cozy-bedroom': 'A cozy and inviting bedroom with plush, neutral-toned bedding, warm ambient light from a bedside lamp, and a soft-focus background.',
  'white-seamless': 'A clean, professional studio setting with a pure white seamless paper background, illuminated by perfectly diffused, shadowless light.',
  'gradient-modern': 'A minimalist and modern backdrop featuring a smooth, elegant gradient from deep indigo to soft lavender, with a clean, professional aesthetic.',
  'in-hand': 'A lifestyle shot showing the product held in a person\'s hand to demonstrate scale, with a natural, out-of-focus background like a bustling cafe or a serene park.',
  'flat-lay': 'A carefully arranged flat-lay composition on a textured, neutral surface like rustic wood or slate, shot from directly overhead with soft, natural shadows.',
  'office-desk': 'A sophisticated and organized office desk with a sleek laptop, a small succulent plant, and other modern accessories, with soft, indirect lighting.',
  'marble-countertop': 'An elegant, luxurious marble countertop with subtle, beautiful veining, lit by soft, diffused light that highlights the stone\'s texture.',
  'gym': 'A bright, modern gym with high-end workout equipment blurred in the background, creating an energetic and motivational atmosphere.',
  'cafe': 'The rich, warm interior of a cozy cafe, with a polished wooden table in the foreground and the ambient charm of the cafe softly blurred in the background.',
  'natural-stone': 'A rugged, natural stone surface with earthy textures and tones, creating a grounded and organic feel, with dramatic side-lighting.',
};

export function generateFallbackPrompts(
  productType: string,
  scenes: string[],
  variationsPerScene: number,
  styles: string[],
  moods: string[],
  customPrompt?: string
): string[] {
  const angles = ['45-degree angle shot', 'overhead flat-lay', 'eye-level perspective', 'slightly elevated view'];
  const lighting = ['soft studio lighting', 'bright natural window light', 'professional softbox lighting', 'golden hour sunlight'];
  
  const prompts: string[] = [];
  const scenesToProcess = customPrompt ? [customPrompt] : scenes.map(s => SCENE_TEMPLATES[s as keyof typeof SCENE_TEMPLATES] || s);
  const numVariations = customPrompt ? variationsPerScene : scenes.length * variationsPerScene;

  for (let i = 0; i < numVariations; i++) {
    const scene = scenesToProcess[customPrompt ? 0 : Math.floor(i / variationsPerScene)];
    const angle = angles[i % angles.length];
    const light = lighting[i % lighting.length];
    const styleText = styles.length > 0 ? styles.join(', ') : 'photorealistic';
    const moodText = moods.length > 0 ? moods.join(', ') : 'professional';

    prompts.push(
      `${scene}, ${styleText}, ${moodText}. Professional product photography background. ${angle}, ${light}, shallow depth of field.`
    );
  }

  return prompts;
}

export async function generateVirtualModelPrompt(
  vertexAI: VertexAI,
  modelDesc: { gender: string; ethnicity: string; },
  pose: string,
  cameraAngle: string,
  setting: string,
  productType: string
): Promise<string> {
  const model = vertexAI.preview.getGenerativeModel({
    model: 'gemini-1.5-flash-002'
  });

  const baseInstruction = `You are an expert AI prompt engineer for a fashion and product photography service. Your task is to generate a single, detailed, and photorealistic prompt for generating an image of a virtual model.

  **CRITICAL RULES:**
  1.  The prompt must describe a model wearing a generic, plain, solid-colored version of the product type. For example, if the product is a "printed t-shirt", describe the model wearing a "plain white t-shirt". This is a placeholder for a later inpainting step.
  2.  The output MUST be a single string, not JSON.
  3.  The prompt must be highly detailed, including lighting, camera settings (like aperture and shutter speed), and overall mood.
  4.  Incorporate all the requested characteristics for the model, pose, and setting.
  `;

  const fewShotExamples = `
  **Example 1:**
  *   **Input:** Model: "Latina female", Pose: "standing", Camera: "full body shot", Setting: "professional studio", Product Type: "dress"
  *   **Output:**
    "Full body shot of a confident Latina model standing in a professional photography studio with a clean, light-grey seamless background. The model is wearing a simple, plain, form-fitting white dress as a placeholder. Lighting is a three-point setup with a soft key light, fill light, and a subtle backlight creating a gentle rim light. Photorealistic, editorial style. Shot on a DSLR with a 85mm f/1.8 lens, tack sharp focus on the model."

  **Example 2:**
  *   **Input:** Model: "Afro-Latino male", Pose: "walking", Camera: "street style shot", Setting: "outdoor urban city", Product Type: "jacket"
  *   **Output:**
    "Dynamic street style photo of an Afro-Latino male model walking confidently across a slightly blurred city street. The model is wearing a plain, solid black bomber jacket as a placeholder. The scene is captured during the golden hour, with warm, directional sunlight creating long shadows. Shot with a 35mm lens, f/2.8, capturing a sense of motion. The background features classic urban architecture."
  `;

  const finalUserRequest = `
  **User Request:**
  *   **Model:** "${modelDesc.ethnicity} ${modelDesc.gender}"
  *   **Pose:** "${pose}"
  *   **Camera:** "${cameraAngle}"
  *   **Setting:** "${setting}"
  *   **Product Type:** "${productType}"
  Generate a single prompt string based on this request.`;

  const fullPrompt = `${baseInstruction}\n${fewShotExamples}\n${finalUserRequest}`;

  try {
    const result = await model.generateContent(fullPrompt);
    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error('No prompt generated');
    }
    // Clean up the response, removing potential markdown or quotes
    return responseText.replace(/["\`]/g, '').trim();

  } catch (error) {
    functions.logger.error('Gemini virtual model prompt generation error:', error);
    // Fallback to a simple prompt if Gemini fails
    return `A photorealistic image of a ${modelDesc.ethnicity} ${modelDesc.gender} model in a ${setting} setting, ${pose}, ${cameraAngle}.`;
  }
}
