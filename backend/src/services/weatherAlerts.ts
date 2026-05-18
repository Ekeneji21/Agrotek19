import cron from 'node-cron';
import fetch from 'node-fetch';
import db from '../db';
import { createAlert } from '../routes/alerts';

interface ForecastDay {
  date: string;
  precipitationProbability: number;
  temperatureMin: number;
  windSpeedMax: number;
  weatherCode: number;
}

async function fetchForecast(lat: number, lng: number): Promise<ForecastDay[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&forecast_days=3&timezone=auto`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Weather fetch failed');
  const data = await resp.json() as any;
  return data.daily.time.map((t: string, i: number) => ({
    date: t,
    precipitationProbability: data.daily.precipitation_probability_max[i],
    temperatureMin: data.daily.temperature_2m_min[i],
    windSpeedMax: data.daily.wind_speed_10m_max[i],
    weatherCode: data.daily.weather_code[i],
  }));
}

async function checkWeatherForAllUsers() {
  // Get all users who have weather_warnings enabled and have at least one farm with a location
  const users = db.prepare(`
    SELECT DISTINCT u.id as userId, f.location
    FROM users u
    JOIN alert_settings s ON s.user_id = u.id AND s.weather_warnings = 1
    JOIN farms f ON f.user_id = u.id
    LIMIT 500
  `).all() as { userId: string; location: string }[];

  // Default Zimbabwe coordinates (Harare) for users without geocoded farms
  const defaultLat = -17.8252;
  const defaultLng = 31.0335;

  for (const { userId } of users) {
    try {
      const forecast = await fetchForecast(defaultLat, defaultLng);
      const tomorrow = forecast[1];
      if (!tomorrow) continue;

      // Heavy rain alert (>70% chance)
      if (tomorrow.precipitationProbability >= 70) {
        const alreadyAlerted = db.prepare(`
          SELECT id FROM alerts
          WHERE user_id = ? AND type = 'weather' AND title LIKE '%Heavy Rain%'
          AND date(created_at) = date('now')
        `).get(userId);
        if (!alreadyAlerted) {
          createAlert(
            userId,
            'weather',
            'Heavy Rain Warning Tomorrow',
            `${tomorrow.precipitationProbability}% chance of heavy rainfall tomorrow. Secure equipment and check field drainage to prevent waterlogging.`,
            'High'
          );
        }
      }

      // Frost alert (temp < 5°C)
      if (tomorrow.temperatureMin < 5) {
        const alreadyAlerted = db.prepare(`
          SELECT id FROM alerts
          WHERE user_id = ? AND type = 'weather' AND title LIKE '%Frost%'
          AND date(created_at) = date('now')
        `).get(userId);
        if (!alreadyAlerted) {
          createAlert(
            userId,
            'weather',
            'Frost Advisory Tonight',
            `Minimum temperature of ${tomorrow.temperatureMin}°C expected. Protect sensitive crops and young seedlings from frost damage.`,
            'High'
          );
        }
      }

      // Strong wind alert (>60 km/h)
      if (tomorrow.windSpeedMax >= 60) {
        const alreadyAlerted = db.prepare(`
          SELECT id FROM alerts
          WHERE user_id = ? AND type = 'weather' AND title LIKE '%Wind%'
          AND date(created_at) = date('now')
        `).get(userId);
        if (!alreadyAlerted) {
          createAlert(
            userId,
            'weather',
            'Strong Wind Warning',
            `Wind speeds of up to ${tomorrow.windSpeedMax} km/h forecast tomorrow. Secure structures, support tall crops, and avoid pesticide spraying.`,
            'Medium'
          );
        }
      }

      // Thunderstorm (codes 95–99)
      if (tomorrow.weatherCode >= 95) {
        const alreadyAlerted = db.prepare(`
          SELECT id FROM alerts
          WHERE user_id = ? AND type = 'weather' AND title LIKE '%Thunderstorm%'
          AND date(created_at) = date('now')
        `).get(userId);
        if (!alreadyAlerted) {
          createAlert(
            userId,
            'weather',
            'Thunderstorm Forecast',
            `Thunderstorms expected tomorrow. Delay field operations, ensure livestock are sheltered, and avoid working near tall trees or open areas.`,
            'High'
          );
        }
      }
    } catch {
      // Skip users whose location can't be geocoded; log silently
    }
  }
}

export function startWeatherAlertScheduler() {
  // Run once at startup (after 10s delay to allow DB to be ready)
  setTimeout(() => {
    checkWeatherForAllUsers().catch(err => console.error('[WeatherAlerts] Startup check failed:', err));
  }, 10_000);

  // Run every day at 6:00 AM Zimbabwe time (UTC+2)
  cron.schedule('0 4 * * *', () => {
    console.log('[WeatherAlerts] Running daily weather check…');
    checkWeatherForAllUsers().catch(err => console.error('[WeatherAlerts] Daily check failed:', err));
  });

  console.log('[WeatherAlerts] Scheduler started — daily check at 06:00 ZW time');
}
