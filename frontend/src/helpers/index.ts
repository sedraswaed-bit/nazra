

import { PropertyType, PropertyStatus } from '../types';

// ========== سعر الصرف - Exchange rate ==========
const EXCHANGE_RATE = 10000; // ليرة سورية للدولار - SYP per USD

// ========== تنسيق السعر - Format price ==========
export function formatPrice(price: number): string {
  if (price >= 1000000000) {
    const billions = price / 1000000000;
    return billions % 1 === 0 
      ? `${billions} مليار ل.س` 
      : `${billions.toFixed(2)} مليار ل.س`;
  }
  if (price >= 1000000) {
    const millions = price / 1000000;
    return millions % 1 === 0 
      ? `${millions} مليون ل.س` 
      : `${millions.toFixed(1)} مليون ل.س`;
  }
  return `${price.toLocaleString('ar-SY')} ل.س`;
}

// ========== تنسيق السعر المختصر - Format price short ==========
export function formatPriceShort(price: number): string {
  if (price >= 1000000000) {
    return `${(price / 1000000000).toFixed(1)} مليار`;
  }
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(0)} مليون`;
  }
  return `${(price / 1000).toFixed(0)} ألف`;
}

// ========== تحويل السعر للدولار - Convert to USD ==========
export function priceToUsd(price: number): string {
  const usd = price / EXCHANGE_RATE;
  if (usd >= 1000) {
    return `$${(usd / 1000).toFixed(1)}K`;
  }
  return `$${usd.toFixed(0)}`;
}

// ========== تنسيق السعر بالمتر - Format price per sqm ==========
export function formatPricePerSqm(price: number, area: number): string {
  if (area <= 0) return '-';
  const perSqm = price / area;
  if (perSqm >= 1000000) {
    return `${(perSqm / 1000000).toFixed(1)}M ل.س/م²`;
  }
  return `${(perSqm / 1000).toFixed(0)}K ل.س/م²`;
}

// ========== تنسيق المساحة - Format area ==========
export function formatArea(area: number): string {
  return `${area} م²`;
}

// ========== أسماء أنواع العقارات - Property type names ==========
// ⚠️ تم التعديل: الآن المفاتيح عربي لأن القاعدة بيانات تخزن بالعربي
export const propertyTypeNames: Record<PropertyType, string> = {
  'شقة': 'شقة',
  'فيلا': 'فيلا',
  'منزل': 'منزل',
  'أرض': 'أرض',
  'مكتب': 'مكتب',
  'محل تجاري': 'محل تجاري',
};

// خريطة التحويل من إنجليزي لعربي - English to Arabic type mapping
export const englishToArabicType: Record<string, PropertyType> = {
  apartment: 'شقة',
  villa: 'فيلا',
  house: 'منزل',
  land: 'أرض',
  office: 'مكتب',
  shop: 'محل تجاري',
};

// خريطة التحويل من عربي لإنجليزي - Arabic to English type mapping
export const arabicToEnglishType: Record<string, PropertyTypeEN> = {
  'شقة': 'apartment',
  'فيلا': 'villa',
  'منزل': 'house',
  'أرض': 'land',
  'مكتب': 'office',
  'محل تجاري': 'shop',
};

// ========== أسماء حالة العقار - Property status names ==========
export const propertyStatusNames: Record<PropertyStatus, string> = {
  pending: 'بانتظار المراجعة',
  approved: 'معتمد',
  rejected: 'مرفوض',
  sold: 'مباع',
};

// ========== ألوان حالة العقار - Property status colors ==========
export const propertyStatusColors: Record<PropertyStatus, string> = {
  pending: 'badge-orange',
  approved: 'badge-green',
  rejected: 'badge-red',
  sold: 'badge-blue',
};

// ========== المدن - Cities ==========
export const cities = [
  'دمشق',
  'حلب',
  'حمص',
  'حماة',
  'اللاذقية',
  'طرطوس',
  'دير الزور',
  'الحسكة',
];

// ========== أحياء دمشق - Damascus neighborhoods ==========
export const neighborhoods: Record<string, string[]> = {
  'دمشق': [
    'المزة', 'كفرسوسة', 'المالكي', 'أبو رمانة', 'الشعلان',
    'باب توما', 'دمر', 'برزة', 'الميدان', 'الشاغور',
    'الحجر الأسود', 'قدسيا', 'الست', 'شارع بغداد',
    'القدم', 'دارية', 'حرستا',
  ],
  'حلب': ['السليمانية', 'الشعار', 'العزيزية', 'الجميلية'],
  'حمص': ['الوردة', 'النزهة', 'المستشفيات', 'الحميدية'],
  'حماة': ['الصابونية', 'المدينة', 'الحمراء'],
  'اللاذقية': ['الزراعة', 'الرمل', 'المشروع'],
  'طرطوس': ['الساحلة', 'البحرة', 'الكورنيش'],
};

// ========== نطاقات السعر - Price ranges ==========
export const priceRanges = [
  { label: 'أقل من 200 مليون', min: 0, max: 200000000 },
  { label: '200 - 500 مليون', min: 200000000, max: 500000000 },
  { label: '500 مليون - 1 مليار', min: 500000000, max: 1000000000 },
  { label: '1 - 2 مليار', min: 1000000000, max: 2000000000 },
  { label: 'أكثر من 2 مليار', min: 2000000000, max: Infinity },
];

// ========== الاتجاهات - Directions ==========
export const directions = ['شرقي', 'غربي', 'شمالي', 'جنوبي'];

// ========== تنسيق التاريخ - Format date ==========
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسبوع`;
  return date.toLocaleDateString('ar-SY');
}

// ========== تنسيق الأرقام - Format numbers ==========
export function formatNumber(num: number): string {
  return num.toLocaleString('ar-SY');
}

// ========== حساب القرض - Loan calculator ==========
export function calculateLoan(
  principal: number,     // المبلغ - Principal amount
  annualRate: number,    // نسبة الفائدة السنوية - Annual interest rate %
  years: number          // عدد السنوات - Loan term in years
): { monthly: number; total: number; interest: number } {
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;

  if (monthlyRate === 0) {
    const monthly = principal / months;
    return { monthly, total: principal, interest: 0 };
  }

  const monthly = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) 
                  / (Math.pow(1 + monthlyRate, months) - 1);
  const total = monthly * months;
  const interest = total - principal;

  return { monthly: Math.round(monthly), total: Math.round(total), interest: Math.round(interest) };
}

// ========== تأكيد صلاحية - Check permission ==========
export function canDo(action: string, userRole?: string): boolean {
  const permissions: Record<string, string[]> = {
    add_property: ['owner', 'admin'],
    edit_property: ['owner', 'admin'],
    delete_property: ['owner', 'admin'],
    favorite: ['user', 'owner', 'admin'],
    review: ['user', 'owner', 'admin'],
    contact_owner: ['user', 'owner', 'admin'],
    message: ['user', 'owner', 'admin'],
    manage_users: ['admin'],
    approve_property: ['admin'],
    reject_property: ['admin'],
    view_dashboard: ['owner', 'admin'],
    admin_dashboard: ['admin'],
    owner_dashboard: ['owner'],
  };

  if (!userRole) return false;
  return permissions[action]?.includes(userRole) ?? false;
}

// ========== أيقونات المميزات - Feature icons mapping ==========
export const featureLabels: Record<string, string> = {
  furnished: 'مفروش',
  parking: 'موقف سيارات',
  elevator: 'مصعد',
  balcony: 'شرفة',
  garden: 'حديقة',
  pool: 'مسبح',
};
