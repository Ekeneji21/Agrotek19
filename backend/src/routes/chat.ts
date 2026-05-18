import { Router, Response } from 'express';
import Groq from 'groq-sdk';
import db from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const SYSTEM_PROMPT = `You are AgriBot, an expert AI agronomist for Zimbabwe. You help smallholder and commercial farmers with:
- Crop planning and agronomy (maize, tobacco, cotton, soybean, wheat, horticulture)
- Pest and disease identification and management
- Soil health and fertilizer recommendations (use bag pricing: fertilizer is USD 38/50kg bag in Zimbabwe)
- Zimbabwe agro-ecological regions I-V and weather patterns
- Zimbabwe input costs: SeedCo maize seed USD 32/10kg, Karate insecticide USD 10/L, Dithane USD 22/500g, Roundup USD 6/L
- Market prices: GMB maize USD 280/t, TIMB tobacco avg USD 3.10/kg, Cottco cotton USD 0.52/kg, soybean USD 480/t
- Government programs: Pfumvudza/Intwasa, Command Agriculture, Agritex extension
- Irrigation, conservation agriculture, climate-smart farming

When recommending any chemical, fertilizer, or seed:
1. Name the specific product and brand (Zimbabwe brands: ZimFert, Windmill, SeedCo, Agritex, AgroChem Zim)
2. State the price and pack size
3. Say "Check our Marketplace — this may be available" if it's a common product
4. Mention nearest agri-input dealer type: "Available at Agritex depots, agro-dealers in [region], or GMB/ZimFert stockists"

Keep answers concise and practical. Use bullet points.`;

function getMarketplaceMatches(reply: string): any[] {
  try {
    const products = db.prepare('SELECT id, name, category, price_usd, unit, seller FROM products WHERE stock > 0').all() as any[];
    const replyLower = reply.toLowerCase();
    return products.filter(p => {
      const name = p.name.toLowerCase();
      // Check if key words from product name appear in the AI reply
      const words = name.split(/\s+/).filter((w: string) => w.length > 4);
      return words.some((w: string) => replyLower.includes(w));
    }).slice(0, 3);
  } catch {
    return [];
  }
}

// POST /chat
router.post('/', async (req: AuthRequest, res: Response) => {
  const { message, history } = req.body;
  if (!message?.trim()) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }
  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ success: false, message: 'AI chat not configured. Add GROQ_API_KEY to .env' });
  }

  const messages: any[] = [{ role: 'system', content: SYSTEM_PROMPT }];
  if (Array.isArray(history)) {
    for (const h of history.slice(-8)) {
      if (h.role && h.content) messages.push({ role: h.role, content: h.content });
    }
  }
  messages.push({ role: 'user', content: message.trim() });

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages,
      temperature: 0.5,
      max_tokens: 800,
    });
    const reply = completion.choices[0]?.message?.content ?? 'Sorry, I could not generate a response. Please try again.';
    const marketplaceItems = getMarketplaceMatches(reply);
    return res.json({ success: true, message: 'OK', data: { reply, marketplaceItems } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Chat failed' });
  }
});

export default router;
