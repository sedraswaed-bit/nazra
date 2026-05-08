
// ========== نوع العقار - Property Type ==========
export interface Property {
  id: number;
  owner_id: number;
  title: string;
  description: string;
  price: number;
  type: PropertyType;
  city: string;
  neighborhood: string;
  address?: string;
  area: number;
  rooms: number;
  bathrooms: number;
  floor?: number;
  direction?: string;
  year_built?: number;
  furnished: boolean;
  parking: boolean;
  elevator: boolean;
  balcony: boolean;
  garden: boolean;
  pool: boolean;
  latitude?: number;
  longitude?: number;
  images: string[];
  status: PropertyStatus;
  views_count: number;
  ai_price_estimate?: number;
  ai_confidence?: number;
  ai_explanation?: string;
  featured: boolean;
  owner?: User;
  reviews?: Review[];
  reviews_count?: number;
  average_rating?: number;
  created_at: string;
  updated_at: string;
}

// أنواع العقارات - Property types enum
// ⚠️ مهم: القاعدة بيانات بتخزن الأنواع بالعربي، فلازم نستخدم العربي هنا
export type PropertyType = 'شقة' | 'فيلا' | 'منزل' | 'أرض' | 'مكتب' | 'محل تجاري';

// أنواع إنجليزية (للتوافق مع الكود القديم) - English types for backward compat
export type PropertyTypeEN = 'apartment' | 'villa' | 'house' | 'land' | 'office' | 'shop';

// حالة العقار - Property status
export type PropertyStatus = 'pending' | 'approved' | 'rejected' | 'sold';

// ========== نوع المستخدم - User Type ==========
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  is_verified: boolean;
  city?: string;
  neighborhood?: string;
  properties_count?: number;
  average_rating?: number;
  created_at: string;
}

// صلاحيات المستخدم - User roles
export type UserRole = 'user' | 'owner' | 'admin';

// ========== نوع التقييم - Review Type ==========
export interface Review {
  id: number;
  user_id: number;
  property_id: number;
  rating: number;
  comment?: string;
  user?: User;
  created_at: string;
}

// ========== نوع الرسالة - Message Type ==========
export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  property_id?: number;
  subject?: string;
  body: string;
  is_read: boolean;
  parent_id?: number;
  sender?: User;
  receiver?: User;
  property?: Property;
  replies?: Message[];
  created_at: string;
}

// ========== نوع البحث - Search Type ==========
export interface SearchFilters {
  search?: string;
  city?: string;
  neighborhood?: string;
  type?: PropertyType;
  price_min?: number;
  price_max?: number;
  area_min?: number;
  area_max?: number;
  rooms?: number;
  furnished?: boolean;
  parking?: boolean;
  elevator?: boolean;
  balcony?: boolean;
  garden?: boolean;
  pool?: boolean;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
}

// ========== نوع توقع السعر - Price Estimate ==========
export interface PriceEstimate {
  estimated_price: number;
  price_range: {
    min: number;
    max: number;
  };
  confidence: number;
  explanation: string;
  price_per_sqm: number;
  price_usd: number;
  exchange_rate: number;
  currency: string;
}

// ========== نوع التوصية - Recommendation ==========
export interface AIRecommendation {
  property: Property;
  similarity_score: number;
  reason: string;
}

// ========== نوع البحث الذكي - Smart Search ==========
export interface SmartSearchResult {
  query: string;
  interpreted: {
    type?: string;  // عربي أو إنجليزي
    neighborhood?: string;  // عربي
    features?: string[] | Record<string, boolean>;  // مصفوفة أو كائن
    rooms?: number;
    condition?: string;
    max_price?: number;
  };
  description: string;
  results: Property[];
  count: number;
}

// ========== نوع اتجاه الأسعار - Price Trends ==========
export interface PriceTrend {
  period: string;
  avg_price: number;
  avg_price_per_sqm?: number;
  index?: number;
}

// ========== نوع المقارنة - Comparison ==========
export interface ComparisonData {
  properties: Property[];
  comparison_fields: Record<string, string>;
}

// ========== نوع إحصائيات لوحة التحكم - Dashboard Stats ==========
export interface AdminDashboardStats {
  total_users: number;
  total_owners: number;
  total_properties: number;
  pending_properties: number;
  approved_properties: number;
  rejected_properties: number;
  sold_properties: number;
  total_reviews: number;
  total_messages: number;
  total_views: number;
}

export interface OwnerDashboardStats {
  total_properties: number;
  approved_properties: number;
  pending_properties: number;
  total_views: number;
  total_reviews: number;
  average_rating: number;
  unread_messages: number;
}

// ========== أنواع عامة - Generic types ==========
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}
