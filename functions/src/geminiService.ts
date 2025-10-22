import { VertexAI } from '@google-cloud/vertexai';

const SCENE_TEMPLATES = {
  'modern-kitchen': 'modern minimalist kitchen counter with natural lighting, marble countertop',
  'outdoor-picnic': 'outdoor picnic setting with grass and sunlight, natural environment',
  'cozy-bedroom': 'cozy bedroom with soft bedding and warm lighting',
  'white-seamless': 'pure white seamless background, professional studio lighting',
  'gradient-modern': 'modern gradient background, blue to purple, clean and professional',
  'in-hand': 'held in hand showing scale, natural skin tone, lifestyle photo',
  'flat-lay': 'flat lay on textured surface, overhead view, natural shadows',
  'office-desk': 'modern office desk with a laptop and a plant',
  'marble-countertop': 'elegant marble countertop with soft, diffused lighting',
  'gym': 'brightly lit gym with workout equipment in the background',
  'cafe': 'cozy cafe with a wooden table and a blurred background of the cafe interior',
  'natural-stone': 'natural stone surface with a textured, earthy feel',
};

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
  const styleText = styles.length > 0 ? `Styles: ${styles.join(', ')}` : '';
  const moodText = moods.length > 0 ? `Moods: ${moods.join(', ')}` : '';

  const prompt = customPrompt
    ? `You are an expert product photographer creating background/scene descriptions for product compositing.
      IMPORTANT: The actual product image will be provided separately. Your prompts should ONLY describe the BACKGROUND/SCENE, NOT the product itself.
      Product Type: ${productType}
      User's custom prompt: "${customPrompt}"
      ${styleText}
      ${moodText}
      Generate ${variationsPerScene} background scene prompts based on the user's custom prompt.
      Requirements for each prompt:
      - Describe ONLY the background/environment, NOT the product
      - The product will be placed INTO this scene
      - Photorealistic, professional commercial photography style
      - Detailed lighting description
      - Incorporate the requested styles and moods.
      - Professional color grading and atmosphere
      - Keep under 120 characters per prompt
      Return ONLY a JSON array of ${variationsPerScene} prompt strings, no other text.`
    : `You are an expert product photographer creating background/scene descriptions for product compositing.
      IMPORTANT: The actual product image will be provided separately. Your prompts should ONLY describe the BACKGROUND/SCENE, NOT the product itself.
      Product Type: ${productType}
      Scenes: ${sceneDescriptions.join(', ')}
      ${styleText}
      ${moodText}
      Generate ${variationsPerScene} background scene prompts for EACH scene.
      Requirements for each prompt:
      - Describe ONLY the background/environment, NOT the product
      - The product will be placed INTO this scene
      - Photorealistic, professional commercial photography style
      - Specific camera angle perspective for the scene (e.g., 45-degree angle, overhead, eye-level)
      - Detailed lighting description (soft box, natural light, studio lighting, golden hour)
      - Scene should complement ${productType} without explicitly mentioning it
      - Incorporate the requested styles and moods.
      - Professional color grading and atmosphere
      - Keep under 120 characters per prompt
      Return ONLY a JSON array of ${scenes.length * variationsPerScene} prompt strings, no other text.`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    
    // Extract JSON from response (handling markdown code blocks)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    const prompts = JSON.parse(jsonMatch ? jsonMatch[0] : '[]');

    if (!Array.isArray(prompts) || prompts.length === 0) {
      throw new Error('Invalid prompts generated');
    }

    return prompts;

  } catch (error) {
    console.error('Gemini prompt generation error:', error);
    // Fallback to template-based prompts
    return generateFallbackPrompts(productType, scenes, variationsPerScene, styles, moods, customPrompt);
  }
}

function generateFallbackPrompts(
  productType: string,
  scenes: string[],
  variationsPerScene: number,
  styles: string[],
  moods: string[],
  customPrompt?: string
): string[] {
  const angles = ['from 45-degree angle', 'from overhead perspective', 'at eye-level', 'from slightly elevated view'];
  const lighting = ['soft studio lighting', 'natural window light', 'professional soft box lighting', 'golden hour sunlight'];
  
  const prompts: string[] = [];

  if (customPrompt) {
    for (let i = 0; i < variationsPerScene; i++) {
      const angle = angles[i % angles.length];
      const light = lighting[i % lighting.length];
      const styleText = styles.length > 0 ? styles.join(', ') : 'photorealistic';
      const moodText = moods.length > 0 ? moods.join(', ') : 'professional';
      prompts.push(
        `${customPrompt} ${angle}, ${light}, ${styleText}, ${moodText} photography background, shallow depth of field`
      );
    }
    return prompts;
  }

  scenes.forEach(scene => {
    const sceneDesc = SCENE_TEMPLATES[scene as keyof typeof SCENE_TEMPLATES] || scene;

    for (let i = 0; i < variationsPerScene; i++) {
      const angle = angles[i % angles.length];
      const light = lighting[i % lighting.length];
      const styleText = styles.length > 0 ? styles.join(', ') : 'photorealistic';
      const moodText = moods.length > 0 ? moods.join(', ') : 'professional';

      prompts.push(
        `${sceneDesc} ${angle}, ${light}, ${styleText}, ${moodText} photography background, shallow depth of field`
      );
    }
  });

  return prompts;
}
