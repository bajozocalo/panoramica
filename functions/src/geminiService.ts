import { VertexAI } from '@google-cloud/vertexai';

// More descriptive and evocative scene templates
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

// Advanced prompt generation with more structure and few-shot examples
export async function generatePrompts(
  vertexAI: VertexAI,
  productType: string,
  scenes: string[],
  variationsPerScene: number,
  styles: string[] = [],
  moods: string[] = [],
  customPrompt?: string
): Promise<string[]> {
  
  const model = vertexAI.preview.getGenerativeModel({
    model: 'gemini-1.5-flash-002'
  });

  const sceneDescriptions = scenes.map(s => SCENE_TEMPLATES[s as keyof typeof SCENE_TEMPLATES] || s);
  const styleText = styles.length > 0 ? `Styles: ${styles.join(', ')}.` : '';
  const moodText = moods.length > 0 ? `Moods: ${moods.join(', ')}.` : '';

  const baseInstruction = `You are an expert AI prompt engineer for a product photography service. Your task is to generate a series of detailed, professional, and creative background prompts for compositing a product image.

  **CRITICAL RULES:**
  1.  **NEVER mention the product itself in the prompt.** The prompts are for the background/scene ONLY. The product image is composited in later.
  2.  The output MUST be a valid JSON array of objects. Each object must have two keys: "prompt" (string) and "negativePrompt" (string).
  3.  The "negativePrompt" should list elements to exclude to improve quality (e.g., "blurry, distorted, text, watermark, unrealistic, cartoonish").
  4.  Generate photorealistic, high-quality commercial photography prompts.
  5.  Incorporate all the specified details: scene, styles, moods, camera angles, and lighting.
  6.  Create diverse and interesting variations for each scene.
  `;

  const fewShotExamples = `
  **Example 1:**
  *   **Input:** Product Type: "Skincare Bottle", Scene: "elegant marble countertop", Variations: 2, Styles: "minimalist", Moods: "serene"
  *   **Output:**
    [
      {
        "prompt": "A minimalist composition of a pristine white marble countertop with delicate, soft grey veining. The scene is bathed in bright, diffused morning light from a nearby window, creating soft, gentle shadows. Shot from a 45-degree angle with a shallow depth of field.",
        "negativePrompt": "blurry, harsh lighting, cluttered, unrealistic, dark, watermark"
      },
      {
        "prompt": "An eye-level shot of a luxurious marble surface, with the texture of the stone subtly highlighted by soft, gallery-style lighting. The background is a clean, neutral wall, creating a serene and high-end atmosphere. The composition is clean and spacious.",
        "negativePrompt": "distorted, noisy, text, cartoonish, oversaturated, ugly"
      }
    ]

  **Example 2:**
  *   **Input:** Product Type: "Smartwatch", Scene: "modern office desk", Variations: 1, Styles: "techy, clean", Moods: "productive"
  *   **Output:**
    [
      {
        "prompt": "A clean and organized modern office desk with a sleek wireless keyboard and a small green succulent in a concrete pot. The desk surface is a light oak wood, and the background is a softly blurred office environment. The lighting is cool and professional, mimicking a modern workspace. Eye-level perspective.",
        "negativePrompt": "messy, cluttered, poor lighting, unprofessional, distracting elements, text"
      }
    ]
  `;

  const finalUserRequest = customPrompt
    ? `**User Request:**
      *   **Product Type:** "${productType}"
      *   **Custom Scene:** "${customPrompt}"
      *   **Variations:** ${variationsPerScene}
      *   **Details:** ${styleText} ${moodText}
      Generate a JSON array of ${variationsPerScene} objects based on this custom request.`
    : `**User Request:**
      *   **Product Type:** "${productType}"
      *   **Scenes:** ${sceneDescriptions.map(s => `"${s}"`).join(', ')}
      *   **Variations per Scene:** ${variationsPerScene}
      *   **Details:** ${styleText} ${moodText}
      Generate a JSON array of ${scenes.length * variationsPerScene} objects based on this request, creating ${variationsPerScene} variations for EACH scene.`;

  const fullPrompt = `${baseInstruction}\n${fewShotExamples}\n${finalUserRequest}`;

  try {
    const result = await model.generateContent(fullPrompt);
    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    const structuredPrompts = JSON.parse(jsonMatch ? jsonMatch[0] : '[]');

    if (!Array.isArray(structuredPrompts) || structuredPrompts.length === 0 || !structuredPrompts[0].prompt) {
      throw new Error('Invalid structured prompts generated');
    }

    // For now, we will only use the positive prompt for the image generation model.
    // The negative prompt is generated for future use.
    return structuredPrompts.map(p => p.prompt);

  } catch (error) {
    console.error('Gemini prompt generation error:', error);
    // Fallback to a simpler, more reliable prompt generation method
    return generateFallbackPrompts(productType, scenes, variationsPerScene, styles, moods, customPrompt);
  }
}

// ... (existing generatePrompts and fallback functions) ...

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
    return responseText.replace(/["`]/g, '').trim();

  } catch (error) {
    functions.logger.error('Gemini virtual model prompt generation error:', error);
    // Fallback to a simple prompt if Gemini fails
    return `A photorealistic image of a ${modelDesc.ethnicity} ${modelDesc.gender} model in a ${setting} setting, ${pose}, ${cameraAngle}.`;
  }
}
