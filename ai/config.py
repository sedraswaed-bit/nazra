# إعدادات منصة نظرة - خدمات الذكاء الاصطناعي
# NAZRA Platform Configuration - AI Service
# 

import os

# ─── / Exchange Rate ───
EXCHANGE_RATE = 10000

# ─── / Data Paths ───
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, '..', 'backend', 'database', 'data', 'damascus_properties.csv')

# ─Flask / Flask Settings ───
FLASK_HOST = '0.0.0.0'
FLASK_PORT = 5001
FLASK_DEBUG = True

# ───  / Property Type Multipliers ───
PROPERTY_TYPE_MULTIPLIERS = {
    'Apartment': 1.0,
    'Duplex': 1.15,
    'Townhouse': 1.20,
    'House': 1.35,
    'Villa': 1.60,
}

# ─── / Condition Multipliers ───
CONDITION_MULTIPLIERS = {
    'Needs Renovation': 0.75,
    'Fair': 0.85,
    'Good': 1.0,
    'Like New': 1.10,
    'New': 1.15,
    'Excellent': 1.25,
}

# ─── / Location Base Prices per sqm ───
LOCATION_BASE_PRICES = {
    'Abu Rummaneh': 2731,
    'Al-Malki': 2680,
    'Al-Nakheel': 2651,
    'Al-Manara': 2534,
    'Al-Mezzeh': 2342,
    'Kafar Sousa': 2139,
    'Al-Shaalan': 2071,
    'Qudsaya': 1940,
    'Damar': 1938,
    'Al-Hamrah': 1871,
    'Qudsaya Suburb': 1830,
    'Old City': 1815,
    'Al-Qassaa': 1759,
    'Damar Project': 1737,
    'Bab Touma': 1731,
    'Barzeh': 1664,
    'Sahnaya': 1628,
    'Al-Qanawat': 1617,
    'Zamalka': 1534,
    'Darayya': 1529,
    'Harasta': 1487,
    'Shaghour': 1390,
    'Douma': 1359,
    'Al-Midan': 1326,
    'Irbin': 1295,
    'Arbin': 1253,
    'Saqba': 1241,
}

# ───/ Arabic Location Names ───
LOCATION_NAMES_AR = {
    'Abu Rummaneh': 'أبو رمانة',
    'Al-Malki': 'المالكي',
    'Al-Nakheel': 'النخيل',
    'Al-Manara': 'المنارة',
    'Al-Mezzeh': 'المزة',
    'Kafar Sousa': 'كفرسوسة',
    'Al-Shaalan': 'الشعلان',
    'Qudsaya': 'قدسيا',
    'Damar': 'الدمار',
    'Al-Hamrah': 'الحمراء',
    'Qudsaya Suburb': 'ضاحية قدسيا',
    'Old City': 'المدينة القديمة',
    'Al-Qassaa': 'القصاع',
    'Damar Project': 'مشروع الدمار',
    'Bab Touma': 'باب توما',
    'Barzeh': 'برزة',
    'Sahnaya': 'صحنايا',
    'Al-Qanawat': 'القنوات',
    'Zamalka': 'زملكا',
    'Darayya': 'داريا',
    'Harasta': 'حرستا',
    'Shaghour': 'الشاغور',
    'Douma': 'دوما',
    'Al-Midan': 'الميدان',
    'Irbin': 'عربين',
    'Arbin': 'عرطوز',
    'Saqba': 'سقبا',
}

# ─/ Arabic Property Type Names ───
PROPERTY_TYPE_NAMES_AR = {
    'Apartment': 'شقة',
    'Duplex': 'دوبلكس',
    'Townhouse': 'تاون هاوس',
    'House': 'منزل',
    'Villa': 'فيلا',
}

# ─── / Arabic Condition Names ───
CONDITION_NAMES_AR = {
    'Needs Renovation': 'يحتاج ترميم',
    'Fair': 'مقبول',
    'Good': 'جيد',
    'Like New': 'كالجديد',
    'New': 'جديد',
    'Excellent': 'ممتاز',
}

# ─── / Search Engine Settings ───
SEARCH_MAX_RESULTS = 50

# ─── / Price Engine Settings ───
KNN_NEIGHBORS = 10
SIMILAR_PRICE_RANGE = 0.30
MAX_RECOMMENDATIONS = 10

# ───/ Investment Analyzer Settings ───)
LOCATION_YIELD_RATES = {
    'Abu Rummaneh': 8.5,
    'Al-Malki': 8.2,
    'Al-Nakheel': 7.8,
    'Al-Manara': 7.5,
    'Al-Mezzeh': 7.2,
    'Kafar Sousa': 6.8,
    'Al-Shaalan': 6.5,
    'Qudsaya': 6.0,
    'Damar': 5.5,
    'Al-Hamrah': 5.8,
    'Qudsaya Suburb': 5.5,
    'Old City': 6.2,
    'Bab Touma': 6.5,
    'Barzeh': 5.0,
    'Al-Midan': 4.8,
}


LOCATION_APPRECIATION_RATES = {
    'Abu Rummaneh': 15,
    'Al-Malki': 14,
    'Al-Nakheel': 13,
    'Al-Manara': 12,
    'Al-Mezzeh': 12,
    'Kafar Sousa': 10,
    'Al-Shaalan': 10,
    'Qudsaya': 9,
    'Damar': 8,
    'Al-Hamrah': 9,
    'Qudsaya Suburb': 8,
    'Old City': 11,
    'Bab Touma': 10,
    'Barzeh': 7,
    'Al-Midan': 7,
}


LOCATION_RISK_LEVELS = {
    'Abu Rummaneh': 'low',
    'Al-Malki': 'low',
    'Al-Nakheel': 'low',
    'Al-Manara': 'low',
    'Al-Mezzeh': 'low',
    'Kafar Sousa': 'low',
    'Al-Shaalan': 'low',
    'Qudsaya': 'medium',
    'Damar': 'medium',
    'Old City': 'low',
    'Bab Touma': 'medium',
    'Barzeh': 'medium',
    'Al-Midan': 'medium',
}

# ─── ⚠️ جديد: إعدادات رؤى السوق / Market Insights Settings ───
MIN_DATA_FOR_TREND = 5

# فترة التوقع بالأشهر
FORECAST_MONTHS = 6

#
MIN_PROPERTIES_ACTIVE = 3

# تصنيفات السيولة
LIQUIDITY_THRESHOLDS = {
    'high': 20,      # أكثر من 20 عقار = سيولة عالية
    'medium': 10,    # 10-20 عقار = سيولة متوسطة
    'low': 0,        # أقل من 10 = سيولة منخفضة
}
