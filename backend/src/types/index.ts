export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string;
  location: string;
  account_type: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Farm {
  id: string;
  user_id: string;
  name: string;
  location: string;
  size_ha: number;
  crops: string; // JSON array
  irrigation_type: string;
  health_pct: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiseaseScan {
  id: string;
  user_id: string;
  image_path: string;
  crop: string;
  disease: string;
  confidence: number;
  severity: string;
  treatment: string;
  scanned_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  read: number; // 0 | 1
  created_at: string;
}

export interface AlertSettings {
  id: string;
  user_id: string;
  disease_alerts: number;
  weather_warnings: number;
  market_updates: number;
  advisory_messages: number;
  weekly_reports: number;
}

export interface Agronomist {
  id: string;
  name: string;
  specialty: string;
  location: string;
  rating: number;
  review_count: number;
  available: number;
  avatar_url: string | null;
  bio: string;
  phone: string;
  email: string;
}

export interface AdvisoryTip {
  id: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
}

export interface Consultation {
  id: string;
  user_id: string;
  agronomist_id: string;
  message: string;
  status: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price_usd: number;
  unit: string;
  rating: number;
  review_count: number;
  seller: string;
  image_url: string | null;
  stock: number;
}

export interface Order {
  id: string;
  user_id: string;
  items: string; // JSON
  total_usd: number;
  status: string;
  created_at: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
}
