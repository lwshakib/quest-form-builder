import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { TEMPLATES } from './lib/templates';

dotenv.config();

const NEBIUS_API_KEY = process.env.NEBIUS_API_KEY;
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'template-backgrounds');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generateImage(template: any) {
  let styleSpecifics = "";
  if (template.id === 't-shirt-signup') styleSpecifics = "a stylish boutique t-shirt shop interior, neatly folded colorful t-shirts on wooden shelves, professional lighting";
  else if (template.id === 'contact-info') styleSpecifics = "a modern office desk with a succulent, a clean notebook, and a sleek pen, warm natural light";
  else if (template.id === 'rsvp' || template.id === 'party-invite') styleSpecifics = "elegant party decorations, soft bokeh lights, celebratory atmosphere without people";
  else if (template.id === 'time-off-request' || template.id === 'find-a-time') styleSpecifics = "a peaceful vacation scene, tropical beach or a cozy mountain cabin, tranquil mood";
  else if (template.id === 'order-form' || template.id === 'work-request') styleSpecifics = "organized workspace, architectural tools, or high-end craft supplies on a clean table";
  else if (template.id === 'event-registration') styleSpecifics = "a professional conference hall lobby, modern architecture, sleek registration desk area";

  const prompt = `Premium high-quality professional photographic background for a form about ${template.title}. Scene: ${styleSpecifics || template.description}. Style: Minimalist, cinematic, 16:9 aspect ratio. STRICTLY NO TEXT, NO LETTERS, NO NUMBERS, NO WORDS, NO SIGNAGE, NO LOGOS, NO WRITING, NO CHARACTERS. Clean artistic composition, ultra-high resolution.`;
  
  console.log(`[GENERATOR] Running for: "${template.title}"`);

  try {
    const response = await fetch(
      "https://api.tokenfactory.nebius.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${NEBIUS_API_KEY}`,
        },
        body: JSON.stringify({
          model: "black-forest-labs/flux-schnell",
          response_format: "b64_json",
          response_extension: "png",
          width: 1024,
          height: 576,
          num_inference_steps: 4,
          seed: -1,
          prompt,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[ERROR] API failed for ${template.id}:`, errorData.error?.message || response.statusText);
      return;
    }

    const data = await response.json() as any;
    const base64Image = data.data?.[0]?.b64_json;

    if (!base64Image) {
      console.error(`[ERROR] No image in response for ${template.id}`);
      return;
    }

    const buffer = Buffer.from(base64Image, 'base64');
    const fileName = `${template.id}.jpg`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    
    fs.writeFileSync(filePath, buffer);
    console.log(`[SUCCESS] Saved ${fileName}`);
  } catch (error) {
    console.error(`[ERROR] Failed to generate image for ${template.id}:`, error);
  }
}

async function main() {
  if (!NEBIUS_API_KEY) {
    console.error("[ERROR] Missing NEBIUS_API_KEY in .env");
    process.exit(1);
  }

  const targetIds = process.argv.slice(2);
  const templatesToGenerate = targetIds.length > 0 
    ? TEMPLATES.filter(t => targetIds.includes(t.id))
    : TEMPLATES;

  console.log(`[START] Generating images for ${templatesToGenerate.length} templates...`);
  
  for (const template of templatesToGenerate) {
    await generateImage(template);
  }
  
  console.log("[FINISH] All template images generated successfully.");
}

main();
