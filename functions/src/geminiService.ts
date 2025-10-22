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

// Fallback function remains similar but can be simplified
function generateFallbackPrompts(
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
