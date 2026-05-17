import { Router, Response } from 'express';
import Groq from 'groq-sdk';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const SYSTEM_PROMPT = `You are AgriBot, an expert AI agronomist for Zimbabwe. You help smallholder and commercial farmers in Zimbabwe with:
- Crop planning and agronomy (maize, tobacco, cotton, soybean, wheat, horticulture, etc.)
- Pest and disease identification and management
- Soil health, fertilizer recommendations
- Zimbabwe weather patterns and agro-ecological regions (I-V)
- Zimbabwe-specific input costs (ZimFert, SeedCo, Windmill, Agritex brands)
- Market prices: GMB maize USD 280/t, TIMB tobacco avg USD 3.10/kg, Cottco cotton USD 0.52/kg, soybean USD 480/t
- Government programs: Pfumvudza/Intwasa, Command Agriculture, Agritex extension services
- Irrigation, conservation agriculture, climate-smart farming

Keep answers concise and practical. Use bullet points. Always give specific, actionable advice relevant to Zimbabwe conditions. If you don't know something specific to Zimbabwe, say so.`;

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
    return res.json({ success: true, message: 'OK', data: { reply } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Chat failed' });
  }
});

export default router;
