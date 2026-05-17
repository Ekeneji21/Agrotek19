import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// Hardcoded Zimbabwe 2024/2025 commodity prices (updated periodically)
const ZIM_PRICES = [
  { commodity: 'Maize', unit: 'tonne', gmb_price: 280, market_price: 320, trend: 'stable', note: 'GMB floor USD 280/t. Demand high pre-planting.' },
  { commodity: 'Tobacco (Flue-cured)', unit: 'kg', gmb_price: null, market_price: 3.10, trend: 'up', note: 'TIMB auction avg USD 3.10/kg. Grade A fetches USD 3.50/kg.' },
  { commodity: 'Cotton (Seed)', unit: 'kg', gmb_price: null, market_price: 0.52, trend: 'stable', note: 'Cottco buying price USD 0.52/kg seed cotton.' },
  { commodity: 'Soybean', unit: 'tonne', gmb_price: 480, market_price: 510, trend: 'up', note: 'Strong demand from oil processors. GMB USD 480/t.' },
  { commodity: 'Wheat', unit: 'tonne', gmb_price: 390, market_price: 415, trend: 'stable', note: 'GMB USD 390/t. Flour millers paying up to USD 420/t.' },
  { commodity: 'Groundnuts (shelled)', unit: 'tonne', gmb_price: null, market_price: 650, trend: 'up', note: 'Export demand pushing prices. USD 350/t unshelled.' },
  { commodity: 'Sunflower', unit: 'tonne', gmb_price: null, market_price: 550, trend: 'stable', note: 'National Foods buying at USD 550/t.' },
  { commodity: 'Sorghum', unit: 'tonne', gmb_price: 220, market_price: 240, trend: 'stable', note: 'GMB floor USD 220/t. Drought-tolerant, low input cost.' },
  { commodity: 'Paprika (dried)', unit: 'kg', gmb_price: null, market_price: 3.20, trend: 'up', note: 'Export grades USD 2.50-4.00/kg. CFI and exporters buying.' },
  { commodity: 'Tomatoes', unit: 'kg', gmb_price: null, market_price: 0.55, trend: 'volatile', note: 'Mbare Musika wholesale USD 0.30-0.80/kg. Seasonal swings.' },
  { commodity: 'Onions', unit: 'kg', gmb_price: null, market_price: 0.65, trend: 'stable', note: 'Wholesale USD 0.50-0.80/kg at Mbare Musika.' },
  { commodity: 'Sugarcane', unit: 'tonne', gmb_price: null, market_price: 38, trend: 'stable', note: 'Hippo Valley/Triangle paying USD 35-42/t fresh cane.' },
  { commodity: 'Macadamia (in-shell)', unit: 'kg', gmb_price: null, market_price: 3.80, trend: 'up', note: 'Export market USD 3.00-4.50/kg in-shell. Strong growth.' },
  { commodity: 'Barley (malting)', unit: 'tonne', gmb_price: null, market_price: 375, trend: 'stable', note: 'Delta Beverages contract USD 350-400/t. Must meet quality specs.' },
];

// GET /market/prices
router.get('/prices', (_req: AuthRequest, res: Response) => {
  const updated_at = new Date().toISOString();
  return res.json({
    success: true,
    message: 'OK',
    data: {
      prices: ZIM_PRICES,
      updated_at,
      source: 'Zimbabwe 2024/2025 season — GMB, TIMB, Cottco, Mbare Musika market rates',
    }
  });
});

export default router;
