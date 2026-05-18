import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// Open-Meteo is free, no API key required
const OPEN_METEO = 'https://api.open-meteo.com/v1';
// Geocoding via nominatim (free, no key)
const NOMINATIM = 'https://nominatim.openstreetmap.org';

function weatherCodeToDesc(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain Showers';
  if (code <= 86) return 'Snow Showers';
  return 'Thunderstorm';
}

function weatherCodeToIcon(code: number): string {
  if (code === 0) return 'sun';
  if (code <= 3) return 'cloud';
  if (code <= 67) return 'cloud-rain';
  if (code <= 77) return 'cloud-snow';
  return 'cloud-lightning';
}

// GET /weather/current?lat=&lng=
router.get('/current', async (req: AuthRequest, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);

  if (isNaN(lat) || isNaN(lng))
    return res.status(400).json({ success: false, message: 'lat and lng are required' });

  try {
    const url = `${OPEN_METEO}/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility&wind_speed_unit=kmh`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Weather API error');
    const data = await resp.json() as any;
    const c = data.current;

    return res.json({
      success: true, message: 'OK',
      data: {
        temperature: Math.round(c.temperature_2m),
        feelsLike: Math.round(c.apparent_temperature),
        humidity: c.relative_humidity_2m,
        windSpeed: Math.round(c.wind_speed_10m),
        visibility: c.visibility ? Math.round(c.visibility / 1000) : null,
        description: weatherCodeToDesc(c.weather_code),
        icon: weatherCodeToIcon(c.weather_code),
        weatherCode: c.weather_code,
        updatedAt: c.time,
      }
    });
  } catch (err: any) {
    return res.status(502).json({ success: false, message: 'Failed to fetch weather data: ' + err.message });
  }
});

// GET /weather/forecast?lat=&lng=&days=7
router.get('/forecast', async (req: AuthRequest, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const days = Math.min(parseInt(req.query.days as string) || 7, 16);

  if (isNaN(lat) || isNaN(lng))
    return res.status(400).json({ success: false, message: 'lat and lng are required' });

  try {
    const url = `${OPEN_METEO}/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&hourly=temperature_2m,precipitation_probability&forecast_days=${days}&timezone=auto`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Weather API error');
    const data = await resp.json() as any;

    const daily = data.daily.time.map((t: string, i: number) => ({
      date: t,
      day: new Date(t).toLocaleDateString('en-ZW', { weekday: 'short' }),
      high: Math.round(data.daily.temperature_2m_max[i]),
      low: Math.round(data.daily.temperature_2m_min[i]),
      rainChance: data.daily.precipitation_probability_max[i],
      windSpeed: Math.round(data.daily.wind_speed_10m_max[i]),
      description: weatherCodeToDesc(data.daily.weather_code[i]),
      icon: weatherCodeToIcon(data.daily.weather_code[i]),
    }));

    const hourly = data.hourly.time.slice(0, 24).map((t: string, i: number) => ({
      time: new Date(t).toLocaleTimeString('en-ZW', { hour: '2-digit', minute: '2-digit', hour12: true }),
      temp: Math.round(data.hourly.temperature_2m[i]),
      rain: data.hourly.precipitation_probability[i],
    }));

    return res.json({ success: true, message: 'OK', data: { daily, hourly } });
  } catch (err: any) {
    return res.status(502).json({ success: false, message: 'Failed to fetch forecast: ' + err.message });
  }
});

// GET /weather/alerts
router.get('/alerts', async (_req: AuthRequest, res: Response) => {
  // Open-Meteo doesn't provide alerts; structure is ready for a paid provider
  return res.json({ success: true, message: 'OK', data: [] });
});

export default router;
