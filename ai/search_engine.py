# محرك البحث الذكي - منصة نظرة
# Smart Search Engine Module - NAZRA Platform
#
# 
#
# Improvements: boolean feature columns, advanced Arabic keyword extraction,
# enhanced relevance scoring with feature bonuses, compound query support

import re
import logging
from config import (
    SEARCH_MAX_RESULTS,
    LOCATION_NAMES_AR,
    PROPERTY_TYPE_NAMES_AR,
    CONDITION_NAMES_AR,
)

# إعداد السجلات / Logging setup
logger = logging.getLogger(__name__)


# ─── خريطة الكلمات المفتاحية للميزات (عربي ↔ إنجليزي ↔ عمود منطقي) ───
# Feature keyword mapping: Arabic keywords → English feature name → boolean column
FEATURE_KEYWORDS_MAP = {
    # English name: { 'arabic': [Arabic keywords], 'column': boolean column name }
    'Parking': {
        'arabic': ['موقف', 'مرآب', 'باركينغ', 'كراج', 'موقف سيارات', 'باركنغ'],
        'column': 'parking',
    },
    'Elevator': {
        'arabic': ['مصعد', 'اسانسير', 'مصاعد', 'أسانسير'],
        'column': 'elevator',
    },
    'Balcony': {
        'arabic': ['شرفة', 'بلكونة', 'بلكون', 'شرفات'],
        'column': 'balcony',
    },
    'Garden': {
        'arabic': ['حديقة', 'بستان', 'حدائق', 'حديقة خاصة'],
        'column': 'garden',
    },
    'Pool': {
        'arabic': ['مسبح', 'سباحة', 'مسبح خاص', 'مسابح'],
        'column': 'pool',
    },
    'Furnished': {
        'arabic': ['مفروش', 'مفروشة', 'فرش', 'مفروشة بالكامل'],
        'column': 'furnished',
    },
    'Heating': {
        'arabic': ['تدفئة', 'دفاية', 'مدفأة', 'تدفئة مركزية', 'دفايات'],
        'column': 'heating',
    },
    'Security': {
        'arabic': ['أمن', 'حارس', 'أمان', 'حراسة', 'حارس أمن', 'أمني'],
        'column': 'security',
    },
    'AC': {
        'arabic': ['مكيف', 'تكييف', 'مكيفات', 'تكييف مركزي'],
        'column': None,  # لا يوجد عمود منطقي مخصص / No dedicated boolean column
    },
    'Solar': {
        'arabic': ['طاقة شمسية', 'شمسي', 'سولار', 'لوحات شمسية'],
        'column': None,
    },
}

# / Feature display names in Arabic
FEATURE_NAMES_AR = {
    'Parking': 'موقف سيارات',
    'Elevator': 'مصعد',
    'Balcony': 'شرفة',
    'Garden': 'حديقة',
    'Pool': 'مسبح',
    'Furnished': 'مفروش',
    'Heating': 'تدفئة',
    'Security': 'أمن',
    'AC': 'تكييف',
    'Solar': 'طاقة شمسية',
}

# ─── / Arabic connectors to strip ───
ARABIC_CONNECTORS = {
    'في', 'من', 'على', 'إلى', 'عن', 'مع', 'و', 'أو', 'ال', 'هذا',
    'هذه', 'ذلك', 'تلك', 'لل', 'بـ', 'التي', 'الذي', 'الذين',
    'اللواتي', 'اللائي', 'اللذين', 'ذات', 'ذو', 'ذي',
    'لا', 'لم', 'لن', 'قد', 'ما', 'إن', 'أن', 'كان', 'ليس',
    'بين', 'حتى', 'عند', 'فوق', 'تحت', 'أمام', 'خلف',
    'عبر', 'دون', 'ضد', 'نحو', 'بعد', 'قبل',
    'وفي', 'ومن', 'وعلى', 'وإلى', 'ومع',
}

# ─── / English stop words ───
ENGLISH_STOP_WORDS = {
    'in', 'the', 'a', 'an', 'for', 'with', 'and', 'or', 'of', 'to',
    'is', 'at', 'by', 'on', 'it', 'this', 'that', 'from', 'but',
    'not', 'has', 'have', 'was', 'are', 'be', 'been', 'being',
}


class SmartSearchEngine:
    """
  
    Smart search engine class for properties

    
    Supports Arabic and English search with match reason tracking

    """

    def __init__(self, data_loader):
        """
        تهيئة محرك البحث
        Initialize the search engine

        Args:
            data_loader: كائن تحميل البيانات / DataLoader instance
        """
        self.data_loader = data_loader

        # بناء فهرس البحث / Build search index
        self._location_index = {}
        self._type_index = {}
        self._feature_index = {}
        self._condition_index = {}
        self._arabic_location_map = {}
        self._arabic_type_map = {}
        self._arabic_condition_map = {}

        # فهرس الكلمات المفتاحية للميزات / Feature keyword index
        # يربط كل كلمة مفتاحية عربية/إنجليزية باسم الميزة الإنجليزي
        self._feature_keyword_to_name = {}
        self._build_feature_keyword_index()

        # بناء الفهارس بعد تحميل البيانات / Build indexes after data is loaded
        self._build_indexes()

    def _build_feature_keyword_index(self):
        """
        بناء فهرس الكلمات المفتاحية للميزات
        Build feature keyword index for fast lookup

        يربط كل كلمة مفتاحية (عربية أو إنجليزية صغيرة) باسم الميزة الإنجليزي
        Maps each keyword (Arabic or lowercase English) to the English feature name
        """
        self._feature_keyword_to_name = {}

        for feat_name, feat_data in FEATURE_KEYWORDS_MAP.items():
            # الاسم الإنجليزي بالأحرف الصغيرة / English name lowercase
            self._feature_keyword_to_name[feat_name.lower()] = feat_name

            # الكلمات المفتاحية العربية / Arabic keywords
            for ar_kw in feat_data.get('arabic', []):
                self._feature_keyword_to_name[ar_kw] = feat_name

        logger.info(
            f"تم بناء فهرس كلمات الميزات: {len(self._feature_keyword_to_name)} كلمة مفتاحية"
        )
        logger.info(
            f"Feature keyword index built: {len(self._feature_keyword_to_name)} keywords"
        )

    def _build_indexes(self):
        """
        بناء فهارس البحث لتسريع عمليات البحث
        Build search indexes for faster search operations
        """
        df = self.data_loader.df
        if df is None:
            return

        # فهرس المناطق / Location index
        for loc in df['location'].unique():
            loc_lower = loc.lower()
            self._location_index[loc_lower] = loc

        # فهرس أنواع العقارات / Property type index
        for ptype in df['property_type'].unique():
            self._type_index[ptype.lower()] = ptype

        # فهرس الميزات / Feature index
        all_features = set()
        for features_list in df['features_list']:
            if isinstance(features_list, list):
                for f in features_list:
                    all_features.add(f.lower())
        self._feature_index = {f: f for f in all_features}

        # فهرس الحالات / Condition index
        for cond in df['condition'].unique():
            self._condition_index[cond.lower()] = cond

        # خريطة الأسماء العربية للمناطق / Arabic location names map
        for eng, ar in LOCATION_NAMES_AR.items():
            self._arabic_location_map[ar] = eng

        # خريطة الأسماء العربية لأنواع العقارات / Arabic type names map
        for eng, ar in PROPERTY_TYPE_NAMES_AR.items():
            self._arabic_type_map[ar] = eng

        # خريطة الأسماء العربية للحالات / Arabic condition names map
        for eng, ar in CONDITION_NAMES_AR.items():
            self._arabic_condition_map[ar] = eng

        logger.info("تم بناء فهارس البحث بنجاح")
        logger.info("Search indexes built successfully")

    # ═══════════════════════════════════════════════════════════════
    # تقسيم النص واستخراج الكلمات المفتاحية
    # Tokenization and keyword extraction
    # ═══════════════════════════════════════════════════════════════

    def _tokenize(self, query):
        """
        تقسيم استعلام البحث إلى كلمات مفتاحية (عربي وإنجليزي)
        مع دعم الكلمات المركبة العربية مثل "موقف سيارات" و "طاقة شمسية"

        Tokenize search query into keywords (Arabic and English)
        with support for Arabic compound words

        Args:
            query: نص البحث / Search text

        Returns:
            list: قائمة الكلمات المفتاحية / List of keywords
        """
        if not query:
            return []

        # تحويل إلى نص صغير / Convert to lowercase
        query = str(query).lower().strip()

        # إزالة الرموز الخاصة مع الحفاظ على الحروف العربية والإنجليزية والأرقام
        # Remove special characters while keeping Arabic, English letters, and digits
        query = re.sub(r'[^\w\s\u0600-\u06FF]', ' ', query)

        # ─── استخراج الكلمات المركبة أولاً / Extract compound words first ───
        compound_tokens = []
        remaining_query = query

        # ترتيب الكلمات المركبة من الأطول للأقصر لضمان المطابقة الأفضل
        # Sort compound keywords from longest to shortest for best matching
        compound_keywords = []
        for feat_name, feat_data in FEATURE_KEYWORDS_MAP.items():
            for ar_kw in feat_data.get('arabic', []):
                if ' ' in ar_kw:  # كلمة مركبة / compound keyword
                    compound_keywords.append((ar_kw, feat_name))
        # إضافة كلمات مركبة من أسماء المناطق / Add compound location names
        for eng, ar in LOCATION_NAMES_AR.items():
            if ' ' in ar:
                compound_keywords.append((ar, eng))

        # ترتيب حسب الطول التنازلي / Sort by length descending
        compound_keywords.sort(key=lambda x: len(x[0]), reverse=True)

        for compound, resolved in compound_keywords:
            if compound in remaining_query:
                compound_tokens.append((compound, resolved))
                # إزالة الكلمة المركبة من الاستعلام المتبقي
                # Remove compound word from remaining query
                remaining_query = remaining_query.replace(compound, ' ', 1)

        # ─── تقسيم الاستعلام المتبقي / Tokenize remaining query ───
        raw_tokens = remaining_query.split()

        # ─── إزالة كلمات الوصل / Remove stop words ───
        all_stop_words = ARABIC_CONNECTORS | ENGLISH_STOP_WORDS

        # بادئات عربية شائعة يجب إزالتها من بداية الكلمات
        # Common Arabic prefixes to strip from beginning of words
        # ملاحظة: نزيل فقط "و" (حرف العطف) كحرف منفصل لأن بقية الحروف
        # (ف، ب، ل، ك، س) قد تكون جزءاً من الكلمة الأصلية مثل "فيلا"
        # Note: only strip "و" (conjunction) as single char because other chars
        # (ف, ب, ل, ك, س) can be part of actual words like "فيلا"
        ARABIC_PREFIXES = ('وال', 'فال', 'بال', 'لل', 'كال', 'و')

        filtered_tokens = []
        for t in raw_tokens:
            stripped = t

            # إزالة البادئات العربية / Strip Arabic prefixes
            # نحاول من الأطول للأقصر لتجنب إزالة جزء خاطئ
            # Try longest prefix first to avoid removing wrong part
            for prefix in sorted(ARABIC_PREFIXES, key=len, reverse=True):
                if stripped.startswith(prefix) and len(stripped) > len(prefix) + 1:
                    candidate = stripped[len(prefix):]
                    # لا نزيل البادئة إذا كانت الكلمة الأصلية معروفة
                    # Don't strip prefix if the original word is a known keyword
                    if stripped in self._feature_keyword_to_name:
                        break
                    # لا نزيل "و" إذا كانت الكلمة الناتجة قصيرة جداً أو تبدو ناقصة
                    # Don't strip "و" if the remaining word seems too short or incomplete
                    if prefix == 'و' and len(candidate) < 2:
                        break
                    stripped = candidate
                    break

            # إزالة "ال" التعريف من بداية الكلمة العربية
            # Strip Arabic definite article "ال"
            if stripped.startswith('ال') and len(stripped) > 3:
                candidate = stripped[2:]
                # لا نزيل "ال" إذا كانت الكلمة الأصلية معروفة
                # Don't strip if original is a known keyword
                if stripped not in self._feature_keyword_to_name:
                    stripped = candidate

            if stripped not in all_stop_words and len(stripped) > 1:
                filtered_tokens.append(stripped)

        # ─── دمج الكلمات المركبة مع الكلمات المفردة ───
        # Combine compound tokens with simple tokens
        final_tokens = []
        for compound_text, _ in compound_tokens:
            final_tokens.append(compound_text)
        final_tokens.extend(filtered_tokens)

        return final_tokens

    def _extract_features_from_query(self, tokens):
        """
        استخراج الميزات من كلمات البحث المفتاحية
        Extract feature names from search tokens

        Args:
            tokens: قائمة الكلمات المفتاحية / List of keywords

        Returns:
            list: قائمة بأسماء الميزات الإنجليزية / List of English feature names
        """
        detected_features = []

        for token in tokens:
            # البحث المباشر في فهرس الكلمات المفتاحية
            # Direct lookup in keyword index
            token_lower = token.lower()

            if token_lower in self._feature_keyword_to_name:
                feat_name = self._feature_keyword_to_name[token_lower]
                if feat_name not in detected_features:
                    detected_features.append(feat_name)
                continue

            # البحث الجزئي في الكلمات المفتاحية العربية
            # Partial match in Arabic keywords
            for kw, feat_name in self._feature_keyword_to_name.items():
                # فقط للمفاتيح العربية (تحتوي على أحرف عربية)
                # Only for Arabic keys (contain Arabic characters)
                if any('\u0600' <= c <= '\u06FF' for c in kw):
                    if token in kw or kw in token:
                        if feat_name not in detected_features:
                            detected_features.append(feat_name)
                        break

        return detected_features

    # ═══════════════════════════════════════════════════════════════
    # حل الكلمات المفتاحية (Resolution methods)
    # ═══════════════════════════════════════════════════════════════

    def _resolve_location(self, token):
        """
        حل اسم المنطقة من الكلمة المفتاحية (عربي أو إنجليزي)
        Resolve location name from keyword (Arabic or English)

        Args:
            token: كلمة مفتاحية / Keyword

        Returns:
            str or None: اسم المنطقة بالإنجليزية / Location name in English
        """
        token_lower = token.lower()

        # البحث المباشر في الفهرس الإنجليزي / Direct search in English index
        if token_lower in self._location_index:
            return self._location_index[token_lower]

        # البحث في الأسماء العربية / Search in Arabic names
        if token in self._arabic_location_map:
            return self._arabic_location_map[token]

        # البحث الجزئي في الفهرس الإنجليزي / Partial search in English index
        for loc_key, loc_val in self._location_index.items():
            if token_lower in loc_key or loc_key in token_lower:
                return loc_val

        # البحث الجزئي في الأسماء العربية / Partial search in Arabic names
        for ar_name, eng_name in self._arabic_location_map.items():
            if token in ar_name or ar_name in token:
                return eng_name

        return None

    def _resolve_type(self, token):
        """
        حل نوع العقار من الكلمة المفتاحية (عربي أو إنجليزي)
        Resolve property type from keyword (Arabic or English)

        Args:
            token: كلمة مفتاحية / Keyword

        Returns:
            str or None: نوع العقار / Property type
        """
        token_lower = token.lower()

        # البحث المباشر / Direct search
        if token_lower in self._type_index:
            return self._type_index[token_lower]

        # البحث في الأسماء العربية / Search in Arabic names
        if token in self._arabic_type_map:
            return self._arabic_type_map[token]

        # مطابقة جزئية / Partial matching
        for type_key, type_val in self._type_index.items():
            if token_lower in type_key or type_key in token_lower:
                return type_val

        return None

    def _resolve_condition(self, token):
        """
        حل حالة العقار من الكلمة المفتاحية (عربي أو إنجليزي)
        Resolve property condition from keyword (Arabic or English)

        Args:
            token: كلمة مفتاحية / Keyword

        Returns:
            str or None: حالة العقار / Property condition
        """
        token_lower = token.lower()

        if token_lower in self._condition_index:
            return self._condition_index[token_lower]

        if token in self._arabic_condition_map:
            return self._arabic_condition_map[token]

        for cond_key, cond_val in self._condition_index.items():
            if token_lower in cond_key or cond_key in token_lower:
                return cond_val

        return None

    # ═══════════════════════════════════════════════════════════════
    # فحص تطابق الميزات / Feature match checking
    # ═══════════════════════════════════════════════════════════════

    def _property_has_feature(self, property_data, feature_name):
        """
        فحص ما إذا كان العقار يملك ميزة معينة
        يبحث في كل من features_list والأعمدة المنطقية

        Check if a property has a specific feature.
        Searches both features_list and boolean columns.

        Args:
            property_data: بيانات العقار / Property data dict
            feature_name: اسم الميزة الإنجليزي / English feature name (e.g. 'Parking')

        Returns:
            bool: هل يملك الميزة / Whether the property has the feature
        """
        feature_lower = feature_name.lower()

        # 1) فحص في features_list (قائمة نصية) / Check in features_list
        features_list = property_data.get('features_list', [])
        if isinstance(features_list, list):
            for f in features_list:
                if isinstance(f, str) and feature_lower in f.lower():
                    return True

        # 2) فحص في عمود features النصي / Check in text features column
        features_text = str(property_data.get('features', '')).lower()
        if features_text and feature_lower in features_text:
            return True

        # 3) فحص في العمود المنطقي المقابل / Check in corresponding boolean column
        feat_data = FEATURE_KEYWORDS_MAP.get(feature_name, {})
        bool_column = feat_data.get('column')
        if bool_column:
            val = property_data.get(bool_column)
            # التعامل مع قيم منطقية أو نصية / Handle boolean or string values
            if val is True or val == 1 or val == '1' or val == 'true':
                return True
            if isinstance(val, str) and val.lower() in ('true', 'yes', '1'):
                return True

        return False

    # ═══════════════════════════════════════════════════════════════
    # حساب درجة التطابق / Relevance scoring
    # ═══════════════════════════════════════════════════════════════

    def _score_property(self, property_data, tokens):
        """
        حساب درجة تطابق العقار مع كلمات البحث
        يشمل مكافآت تطابق الميزات (مثل مصعد → elevator=True)

        Calculate property relevance score against search tokens.
        Includes feature match bonuses (e.g., "مصعد" → elevator=True gets bonus).

        Args:
            property_data: بيانات العقار / Property data dict
            tokens: كلمات البحث / Search tokens

        Returns:
            tuple: (الدرجة, قائمة الأسباب) / (score, list of reasons)
        """
        score = 0.0
        reasons = []

        # استخراج الميزات المطلوبة من الاستعلام / Extract requested features from query
        query_features = self._extract_features_from_query(tokens)

        for token in tokens:
            token_lower = token.lower()

            # ─── تطابق المنطقة (وزن عالي) / Location match (high weight) ───
            resolved_loc = self._resolve_location(token)
            if resolved_loc and property_data.get('location') == resolved_loc:
                score += 30.0
                reasons.append(
                    f"تطابق المنطقة: {resolved_loc} / Location match: {resolved_loc}"
                )

            # ─── تطابق نوع العقار (وزن عالي) / Type match (high weight) ───
            resolved_type = self._resolve_type(token)
            if resolved_type and property_data.get('property_type') == resolved_type:
                score += 25.0
                reasons.append(
                    f"تطابق النوع: {resolved_type} / Type match: {resolved_type}"
                )

            # ─── تطابق الحالة / Condition match ───
            resolved_cond = self._resolve_condition(token)
            if resolved_cond and property_data.get('condition') == resolved_cond:
                score += 15.0
                reasons.append(
                    f"تطابق الحالة: {resolved_cond} / Condition match: {resolved_cond}"
                )

            # ─── تطابق العنوان / Title match ───
            title = str(property_data.get('title', '')).lower()
            if token_lower in title:
                score += 20.0
                reasons.append("تطابق العنوان / Title match")

            # ─── تطابق الوصف / Description match ───
            description = str(property_data.get('description', '')).lower()
            if token_lower in description:
                score += 10.0
                reasons.append("تطابق الوصف / Description match")

            # ─── تطابق الميزات (features_list + أعمدة منطقية) ───
            # Feature match (features_list + boolean columns)
            features_list = property_data.get('features_list', [])
            if isinstance(features_list, list):
                for feature in features_list:
                    if isinstance(feature, str) and token_lower in feature.lower():
                        score += 12.0
                        reasons.append(
                            f"تطابق الميزة: {feature} / Feature match: {feature}"
                        )
                        break  # تطابق واحد فقط لكل كلمة / Only one match per token

            # ─── تطابق جزئي مع المنطقة / Partial location match ───
            location = str(property_data.get('location', '')).lower()
            if token_lower in location or location in token_lower:
                if not resolved_loc:  # لم يتم احتسابها سابقاً / Not already counted
                    score += 15.0
                    reasons.append("تطابق جزئي مع المنطقة / Partial location match")

            # ─── مطابقة إضافية للأرقام / Additional numeric matching ───
            try:
                num = int(token)
                # تطابق عدد الغرف / Bedroom match
                if property_data.get('bedrooms') == num:
                    score += 15.0
                    reasons.append(
                        f"تطابق عدد الغرف: {num} / Bedroom match: {num}"
                    )
                # تطابق عدد الحمامات / Bathroom match
                if property_data.get('bathrooms') == num:
                    score += 10.0
                    reasons.append(
                        f"تطابق عدد الحمامات: {num} / Bathroom match: {num}"
                    )
            except ValueError:
                pass

        # ─── مكافأة تطابق الميزات / Feature match bonus ───
        # إذا كان الاستعلام يطلب ميزات، نعطي درجة إضافية لكل ميزة متوفرة
        # If the query requests features, give bonus score for each matching feature
        if query_features:
            for feat_name in query_features:
                if self._property_has_feature(property_data, feat_name):
                    score += 18.0
                    feat_ar = FEATURE_NAMES_AR.get(feat_name, feat_name)
                    reasons.append(
                        f"ميزة متوفرة: {feat_ar} ({feat_name}) / Feature available: {feat_name}"
                    )
                else:
                    # خصم بسيط للميزة غير المتوفرة / Small penalty for missing feature
                    score -= 3.0

        return score, reasons

    # ═══════════════════════════════════════════════════════════════
    # تطبيق الفلاتر / Filter application
    # ═══════════════════════════════════════════════════════════════

    def _apply_filters(self, properties, filters):
        """
        تطبيق فلاتر البحث على قائمة العقارات
        يدعم فلاتر الميزات عبر features_list والأعمدة المنطقية

        Apply search filters to property list.
        Supports feature filters via features_list AND boolean columns.

        Args:
            properties: قائمة العقارات / List of properties
            filters: الفلاتر / Filters dict

        Returns:
            list: العقارات المفلترة / Filtered properties
        """
        filtered = list(properties)

        # فلتر أقل سعر / Min price filter
        if 'price_min' in filters and filters['price_min'] is not None:
            price_min = float(filters['price_min'])
            filtered = [p for p in filtered if p.get('price', 0) >= price_min]

        # فلتر أعلى سعر / Max price filter
        if 'price_max' in filters and filters['price_max'] is not None:
            price_max = float(filters['price_max'])
            filtered = [p for p in filtered if p.get('price', 0) <= price_max]

        # فلتر المنطقة (يمكن أن يكون نص أو قائمة) / Location filter (string or list)
        if 'location' in filters and filters['location'] is not None:
            loc_filter = filters['location']
            if isinstance(loc_filter, list):
                filtered = [p for p in filtered if p.get('location') in loc_filter]
            else:
                loc_str = str(loc_filter)
                # البحث الجزئي أيضاً / Also partial match
                filtered = [
                    p for p in filtered
                    if p.get('location', '').lower() == loc_str.lower()
                    or loc_str.lower() in p.get('location', '').lower()
                ]

        # فلتر نوع العقار (يمكن أن يكون نص أو قائمة) / Type filter (string or list)
        if 'property_type' in filters and filters['property_type'] is not None:
            type_filter = filters['property_type']
            if isinstance(type_filter, list):
                filtered = [p for p in filtered if p.get('property_type') in type_filter]
            else:
                filtered = [
                    p for p in filtered
                    if p.get('property_type', '') == str(type_filter)
                ]

        # فلتر الحالة / Condition filter
        if 'condition' in filters and filters['condition'] is not None:
            filtered = [
                p for p in filtered
                if p.get('condition', '') == str(filters['condition'])
            ]

        # فلتر عدد الغرف / Bedrooms filter
        if 'bedrooms' in filters and filters['bedrooms'] is not None:
            bedrooms = int(filters['bedrooms'])
            filtered = [p for p in filtered if p.get('bedrooms', 0) >= bedrooms]

        # فلتر عدد الحمامات / Bathrooms filter
        if 'bathrooms' in filters and filters['bathrooms'] is not None:
            bathrooms = int(filters['bathrooms'])
            filtered = [p for p in filtered if p.get('bathrooms', 0) >= bathrooms]

        # فلتر أقل مساحة / Min area filter
        if 'area_min' in filters and filters['area_min'] is not None:
            area_min = float(filters['area_min'])
            filtered = [p for p in filtered if p.get('area_sqm', 0) >= area_min]

        # فلتر أعلى مساحة / Max area filter
        if 'area_max' in filters and filters['area_max'] is not None:
            area_max = float(filters['area_max'])
            filtered = [p for p in filtered if p.get('area_sqm', 0) <= area_max]

        # ─── فلتر الميزات (محسّن) / Features filter (enhanced) ───
        # يدعم الميزات عبر features_list والأعمدة المنطقية
        # Supports features via features_list AND boolean columns
        if 'features' in filters and filters['features'] is not None:
            required_features = filters['features']
            if isinstance(required_features, str):
                required_features = [f.strip() for f in required_features.split(',')]
            if isinstance(required_features, list):
                for feat in required_features:
                    feat_lower = feat.lower()

                    # تحديد اسم الميزة الإنجليزي / Determine English feature name
                    feat_name = self._feature_keyword_to_name.get(
                        feat_lower, feat
                    )

                    # إذا كانت الكلمة عربية قد لا تكون في الفهرس مباشرة
                    # If Arabic word might not be in index directly, try partial match
                    if feat_name == feat:
                        for kw, fn in self._feature_keyword_to_name.items():
                            if any('\u0600' <= c <= '\u06FF' for c in kw):
                                if feat in kw or kw in feat:
                                    feat_name = fn
                                    break

                    # الآن فلترة باستخدام _property_has_feature
                    # Filter using _property_has_feature
                    final_feat_name = feat_name
                    filtered = [
                        p for p in filtered
                        if self._property_has_feature(p, final_feat_name)
                    ]

        return filtered

    # ═══════════════════════════════════════════════════════════════
    # البحث الرئيسي / Main search method
    # ═══════════════════════════════════════════════════════════════

    def search(self, query='', filters=None, limit=None):
        """
        البحث الذكي عن العقارات
        Smart search for properties

        Args:
            query: نص البحث (عربي أو إنجليزي) / Search text (Arabic or English)
                يدعم الاستعلامات المركبة مثل:
                "شقة مفروشة مع مصعد وموقف في المزة"
                "فيلا مع مسبح وحديقة في المالكي"
            filters: فلاتر البحث / Search filters dict with keys:
                - price_min: أقل سعر (دولار) / Min price (USD)
                - price_max: أعلى سعر (دولار) / Max price (USD)
                - location: المنطقة / Location
                - property_type: نوع العقار / Property type
                - condition: حالة العقار / Property condition
                - bedrooms: عدد الغرف / Number of bedrooms
                - bathrooms: عدد الحمامات / Number of bathrooms
                - area_min: أقل مساحة / Min area
                - area_max: أعلى مساحة / Max area
                - features: قائمة الميزات / List of feature names
                  (يمكن أن تكون أسماء إنجليزية مثل ['Elevator', 'Parking']
                   أو عربية مثل ['مصعد', 'موقف سيارات']
                   يتم البحث في features_list والأعمدة المنطقية)
            limit: عدد النتائج الأقصى / Maximum number of results

        Returns:
            list: قائمة العقارات مع درجات التطابق / Properties with relevance scores
        """
        if filters is None:
            filters = {}

        if limit is None:
            limit = SEARCH_MAX_RESULTS

        # تحميل البيانات إذا لم تكن محملة / Load data if not loaded
        if self.data_loader.df is None:
            self.data_loader.load_data()

        properties = self.data_loader.properties

        # تقسيم الاستعلام / Tokenize query
        tokens = self._tokenize(query) if query else []

        # حل الكلمات المفتاحية لمعرفة المناطق والأنواع والميزات المحتملة
        # Resolve keywords for potential locations, types, and features
        resolved_locations = set()
        resolved_types = set()
        resolved_features = []

        for token in tokens:
            loc = self._resolve_location(token)
            if loc:
                resolved_locations.add(loc)
            typ = self._resolve_type(token)
            if typ:
                resolved_types.add(typ)

        # استخراج الميزات من الاستعلام / Extract features from query
        resolved_features = self._extract_features_from_query(tokens)

        # دمج الفلاتر المستخلصة من الاستعلام مع الفلاتر الممررة
        # Merge query-extracted filters with passed filters
        effective_filters = dict(filters)

        # إذا تم تحديد منطقة من الاستعلام ولم تكن في الفلاتر
        # If location resolved from query and not in filters
        if resolved_locations and 'location' not in effective_filters:
            effective_filters['location'] = list(resolved_locations)

        # إذا تم تحديد نوع من الاستعلام ولم يكن في الفلاتر
        # If type resolved from query and not in filters
        if resolved_types and 'property_type' not in effective_filters:
            effective_filters['property_type'] = list(resolved_types)

        # ملاحظة: الميزات المستخلصة من الاستعلام لا تُضاف كفلاتر صارمة
        # بل تُستخدم في حساب درجة التطابق فقط (_score_property)
        # هذا يعطي نتائج أفضل للمستخدم - يرى العقارات المطابقة مرتبة حسب الميزات
        #
        # Note: query-extracted features are NOT added as hard filters.
        # They are used for relevance scoring only (_score_property).
        # This gives better UX - users see matching properties ranked by features.
        # Features explicitly passed in filters dict ARE applied as hard filters.
        #
        # مثال: "شقة مفروشة مع مصعد في المزة" → لا تُفلتر بالميزات بل تُرتب حسبها
        # Example: "furnished apartment with elevator in Mezzeh" → ranked by features, not filtered

        # تطبيق الفلاتر / Apply filters
        filtered = self._apply_filters(properties, effective_filters)

        # حساب درجات التطابق / Calculate relevance scores
        results = []
        for prop in filtered:
            if tokens:
                score, reasons = self._score_property(prop, tokens)
                if score > 0:
                    results.append({
                        'property': prop,
                        'score': round(score, 2),
                        'reasons': reasons,
                    })
            else:
                # بدون استعلام، نعرض النتائج المفلترة فقط
                # Without query, show filtered results only
                results.append({
                    'property': prop,
                    'score': 0.0,
                    'reasons': [],
                })

        # ترتيب حسب درجة التطابق / Sort by relevance score
        results.sort(key=lambda x: x['score'], reverse=True)

        # تحديد عدد النتائج / Limit results
        results = results[:limit]

        return results

    # ═══════════════════════════════════════════════════════════════
    # اقتراحات البحث / Search suggestions
    # ═══════════════════════════════════════════════════════════════

    def get_suggestions(self, query, limit=10):
        """
        الحصول على اقتراحات البحث التلقائية (إكمال تلقائي)
        Get auto-complete search suggestions

        Args:
            query: نص البحث الجزئي / Partial search text
            limit: عدد الاقتراحات الأقصى / Max suggestions

        Returns:
            list: قائمة الاقتراحات / List of suggestions
        """
        if not query or len(query.strip()) < 2:
            return []

        query_lower = query.strip().lower()
        suggestions = []

        # اقتراحات المناطق / Location suggestions
        for loc_eng, loc_ar in LOCATION_NAMES_AR.items():
            if (query_lower in loc_eng.lower() or
                    query_lower in loc_ar or
                    loc_eng.lower().startswith(query_lower) or
                    loc_ar.startswith(query_lower)):
                suggestions.append({
                    'type': 'location',
                    'value': loc_eng,
                    'label_ar': loc_ar,
                    'label_en': loc_eng,
                })

        # اقتراحات أنواع العقارات / Property type suggestions
        for type_eng, type_ar in PROPERTY_TYPE_NAMES_AR.items():
            if (query_lower in type_eng.lower() or
                    query_lower in type_ar or
                    type_eng.lower().startswith(query_lower) or
                    type_ar.startswith(query_lower)):
                suggestions.append({
                    'type': 'property_type',
                    'value': type_eng,
                    'label_ar': type_ar,
                    'label_en': type_eng,
                })

        # اقتراحات الحالات / Condition suggestions
        for cond_eng, cond_ar in CONDITION_NAMES_AR.items():
            if (query_lower in cond_eng.lower() or
                    query_lower in cond_ar or
                    cond_eng.lower().startswith(query_lower) or
                    cond_ar.startswith(query_lower)):
                suggestions.append({
                    'type': 'condition',
                    'value': cond_eng,
                    'label_ar': cond_ar,
                    'label_en': cond_eng,
                })

        # ─── اقتراحات الميزات / Feature suggestions ───
        for feat_name, feat_data in FEATURE_KEYWORDS_MAP.items():
            feat_ar = FEATURE_NAMES_AR.get(feat_name, feat_name)
            all_keywords = [feat_name.lower(), feat_ar] + feat_data.get('arabic', [])

            matched = False
            for kw in all_keywords:
                if (query_lower in kw or
                        kw.startswith(query_lower) or
                        query_lower in kw):
                    matched = True
                    break

            if matched:
                suggestions.append({
                    'type': 'feature',
                    'value': feat_name,
                    'label_ar': feat_ar,
                    'label_en': feat_name,
                })

        # إزالة التكرارات وترتيب النتائج / Deduplicate and limit
        seen = set()
        unique_suggestions = []
        for s in suggestions:
            key = f"{s['type']}:{s['value']}"
            if key not in seen:
                seen.add(key)
                unique_suggestions.append(s)

        return unique_suggestions[:limit]
