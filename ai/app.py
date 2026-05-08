"""
AI Service - NAZRA Smart Real Estate Platform

Price prediction with explainability, smart NLP search,
recommendation engine, price trend analysis, and market insights.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import re
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
from datetime import datetime
import logging

from data_loader import DataLoader

# ========== Logging Setup ==========
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# ========== Paths ==========
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, 'model')
DATA_DIR = os.path.join(BASE_DIR, 'data')

# ========== Globals ==========
price_model = None
data_loader = None

EXCHANGE_RATE = 10000


# Not for translation - just for display


def init_services():
    """Initialize all AI services - تهيئة جميع خدمات الذكاء الاصطناعي"""
    global data_loader, price_model

    logger.info("جاري تهيئة خدمات الذكاء الاصطناعي...")
    logger.info("Initializing AI services...")

    # Initialize DataLoader
    data_loader = DataLoader()

    # Load data
    if not data_loader.load_data():
        logger.error("فشل تحميل البيانات!")
        logger.error("Failed to load data!")
        return False

    # Try to load saved model
    if load_saved_model():
        logger.info("تم تحميل النموذج المحفوظ بنجاح")
        logger.info("Saved model loaded successfully")
    else:
        logger.info("لا يوجد نموذج محفوظ، جاري التدريب...")
        logger.info("No saved model found, training new one...")
        train_model()

    # Print stats
    stats = data_loader.get_stats()
    logger.info(f"Data stats: {stats}")

    return True


def train_model():
    """Train the price prediction model - تدريب نموذج التنبؤ بالأسعار"""
    global price_model

    if data_loader is None or data_loader.df is None or len(data_loader.df) == 0:
        logger.error("لا توجد بيانات للتدريب!")
        return False

    try:
        logger.info("جاري تدريب النموذج...")
        logger.info("Training model...")

        # Prepare features
        X, y = data_loader.prepare_features()
        if X is None or y is None:
            logger.error("فشل إعداد المميزات!")
            return False

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        logger.info(f"Training set: {X_train.shape[0]} records")
        logger.info(f"Test set: {X_test.shape[0]} records")

        # Train Gradient Boosting
        price_model = GradientBoostingRegressor(
            n_estimators=200,
            max_depth=5,
            learning_rate=0.1,
            min_samples_split=5,
            min_samples_leaf=3,
            subsample=0.8,
            random_state=42
        )
        price_model.fit(X_train, y_train)

        # Evaluate
        y_pred = price_model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)

        avg_price = y_test.mean()
        mae_pct = (mae / avg_price) * 100 if avg_price > 0 else 0

        logger.info("=" * 50)
        logger.info("تم تدريب النموذج بنجاح!")
        logger.info(f"MAE: ${mae:,.0f} ({mae_pct:.1f}%)")
        logger.info(f"R2 Score: {r2:.4f}")
        logger.info(f"Average price in test: ${avg_price:,.0f}")
        logger.info("=" * 50)

        # Save model & encoders
        os.makedirs(MODEL_DIR, exist_ok=True)
        model_path = os.path.join(MODEL_DIR, 'price_model.joblib')
        joblib.dump(price_model, model_path)
        logger.info(f"Model saved: {model_path}")

        data_loader.save_encoders(MODEL_DIR)

        # Feature importance
        feature_names = data_loader.FEATURE_COLS
        importances = price_model.feature_importances_
        logger.info("Feature importances:")
        for name, imp in sorted(zip(feature_names, importances), key=lambda x: -x[1]):
            logger.info(f"  {name}: {imp:.4f}")

        return True

    except Exception as e:
        logger.error(f"Error training model: {e}")
        import traceback
        traceback.print_exc()
        return False


def load_saved_model():
    """Load saved model and encoders"""
    global price_model

    try:
        model_path = os.path.join(MODEL_DIR, 'price_model.joblib')
        if not os.path.exists(model_path):
            return False

        price_model = joblib.load(model_path)
        data_loader.load_encoders(MODEL_DIR)

        logger.info("Saved model loaded successfully")
        return True
    except Exception as e:
        logger.warning(f"Could not load saved model: {e}")
        return False


def get_explanation(data, predicted_price, confidence, location='', ptype=''):
    """Generate Arabic explanation for prediction - تفسير التوقع بالعربي"""
    reasons = []

    # Location explanation
    loc = location or data.get('location', '')
    if loc:
        reasons.append(f"العقار في منطقة {loc}")

    # Type explanation
    prop_type = ptype or data.get('property_type', '')
    if prop_type:
        reasons.append(f"نوع العقار: {prop_type}")

    # Area
    area = data.get('area_sqm', 0)
    try:
        area = float(area)
    except (ValueError, TypeError):
        area = 0
    if area and area > 0:
        ppsm = predicted_price / area
        reasons.append(f"سعر المتر المقدر: ${ppsm:,.0f}")

    # Condition
    cond = data.get('condition', '')
    cond_effect = {
        'جديد': 'حالة جديدة ترفع القيمة',
        'ممتاز': 'حالة ممتازة ترفع القيمة',
        'كالجديد': 'حالة كالجديد',
        'جيد': 'حالة جيدة',
        'مقبول': 'حالة مقبولة',
        'يحتاج ترميم': 'يحتاج ترميم مما يخفض القيمة',
    }
    if cond in cond_effect:
        reasons.append(cond_effect[cond])

    # Area class
    area_class = data.get('area_class', '')
    if area_class:
        reasons.append(f"تصنيف المنطقة: {area_class}")

    # Features
    features = data.get('features', '')
    if features:
        feat_list = [f.strip() for f in str(features).split(',') if f.strip()]
        if feat_list:
            reasons.append(f"المميزات: {', '.join(feat_list[:4])}")

    # Confidence
    if confidence >= 80:
        reasons.append("توقع عالي الثقة بناءً على بيانات كافية")
    elif confidence >= 60:
        reasons.append("توقع متوسط الثقة")
    else:
        reasons.append("توقع منخفض الثقة - يُنصح بالتحقق")

    return " | ".join(reasons)


def _compute_confidence(df, location, property_type, area_sqm):
    """
    Confidence calculation based on data density and consistency.
    يحسب مستوى الثقة بناءً على كثافة البيانات واتساقها.
    """
    base_confidence = 50

    if df is None or len(df) == 0:
        return base_confidence

    # ✅ البحث بالعربي مباشرة في البيانات العربية
    similar_loc_type = df[
        (df['location'] == location) &
        (df['property_type'] == property_type)
    ]
    count_loc_type = len(similar_loc_type)

    similar_loc = df[df['location'] == location]
    count_loc = len(similar_loc)

    similar_type = df[df['property_type'] == property_type]
    count_type = len(similar_type)

    # Data density score (0-30 points)
    if count_loc_type >= 20:
        density_score = 30
    elif count_loc_type >= 10:
        density_score = 25
    elif count_loc_type >= 5:
        density_score = 20
    elif count_loc_type >= 2:
        density_score = 12
    elif count_loc >= 5:
        density_score = 10
    elif count_type >= 5:
        density_score = 8
    else:
        density_score = 3

    # Price consistency score (0-20 points)
    consistency_score = 0
    if count_loc_type >= 3 and 'price_per_sqm_usd' in similar_loc_type.columns:
        price_std = similar_loc_type['price_per_sqm_usd'].std()
        price_mean = similar_loc_type['price_per_sqm_usd'].mean()
        if price_mean > 0:
            cv = price_std / price_mean
            if cv < 0.15:
                consistency_score = 20
            elif cv < 0.25:
                consistency_score = 15
            elif cv < 0.40:
                consistency_score = 10
            else:
                consistency_score = 5
    elif count_loc >= 3 and 'price_per_sqm_usd' in similar_loc.columns:
        price_std = similar_loc['price_per_sqm_usd'].std()
        price_mean = similar_loc['price_per_sqm_usd'].mean()
        if price_mean > 0:
            cv = price_std / price_mean
            if cv < 0.25:
                consistency_score = 12
            elif cv < 0.40:
                consistency_score = 8
            else:
                consistency_score = 4

    # Model quality bonus
    model_bonus = 10

    confidence = base_confidence + density_score + consistency_score + model_bonus
    return min(95, max(30, confidence))


def _find_comparable_properties(df, location, property_type, area_sqm, bedrooms, top_n=3):
    """
    Find comparable properties from the dataset.
    يبحث عن عقارات مشابهة من البيانات.
    """
    if df is None or len(df) == 0:
        return []

    # ✅ البحث بالعربي مباشرة
    candidates = df[
        (df['location'] == location) &
        (df['property_type'] == property_type)
    ].copy()

    if len(candidates) < 3:
        candidates = df[df['property_type'] == property_type].copy()

    if len(candidates) < 2:
        candidates = df.copy()

    if len(candidates) == 0:
        return []

    candidates['area_diff'] = abs(candidates['area_sqm'] - area_sqm)
    candidates['bedroom_diff'] = abs(candidates['bedrooms'] - bedrooms)

    max_area_diff = candidates['area_diff'].max() or 1
    max_bed_diff = candidates['bedroom_diff'].max() or 1

    candidates['similarity'] = (
        1 - (candidates['area_diff'] / max_area_diff) * 0.6 -
        (candidates['bedroom_diff'] / max_bed_diff) * 0.4
    )

    candidates = candidates.sort_values('similarity', ascending=False)

    comparables = []
    for _, row in candidates.head(top_n).iterrows():
        comparables.append({
            'id': int(row.get('id', 0)),
            'location': row.get('location', ''),
            'property_type': row.get('property_type', ''),
            'area_sqm': int(row.get('area_sqm', 0)),
            'bedrooms': int(row.get('bedrooms', 0)),
            'bathrooms': int(row.get('bathrooms', 0)),
            'price_usd': int(row.get('price_usd', 0)),
            'price_per_sqm_usd': int(row.get('price_per_sqm_usd', 0)),
            'condition': row.get('condition', ''),
            'similarity_score': round(float(row.get('similarity', 0)), 2),
        })

    return comparables


# ========== API Endpoints ==========

@app.route('/health', methods=['GET'])
def health_check():
    """Health check - فحص حالة الخدمة"""
    stats = data_loader.get_stats() if data_loader else {}
    return jsonify({
        'status': 'healthy',
        'service': 'NAZRA AI Service',
        'version': '4.0',
        'model_loaded': price_model is not None,
        'data_records': stats.get('total_records', 0),
        'locations': stats.get('locations', 0),
        'property_types': stats.get('property_types', 0),
        'timestamp': datetime.now().isoformat(),
    })


@app.route('/estimate', methods=['POST'])
def estimate_price():
    """
    Estimate property price - توقع سعر العقار
    ✅ يستقبل أسماء عربية ويتعامل معها مباشرة (بدون ترجمة)
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # ✅ استقبال البيانات العربية مباشرة
        location = data.get('location', 'المزة')
        property_type = data.get('property_type', 'شقة')
        condition = data.get('condition', 'جيد')
        floor = str(data.get('floor', 'أول'))
        ownership_type = data.get('ownership_type', 'طابو أخضر')
        area_class = data.get('area_class', 'متوسطة')
        area_sqm = float(data.get('area_sqm', 100))
        bedrooms = int(data.get('bedrooms', 2))
        bathrooms = int(data.get('bathrooms', 1))
        features = data.get('features', '')

        logger.info(f"estimate: location='{location}', type='{property_type}', condition='{condition}'")

        predicted_price = None
        confidence = 50

        # Model prediction
        if price_model is not None and data_loader is not None:
            try:
                # ✅ ترميز القيم العربية مباشرة بالـ LabelEncoder
                loc_enc = data_loader.safe_encode('location', location)
                type_enc = data_loader.safe_encode('property_type', property_type)
                cond_enc = data_loader.safe_encode('condition', condition)
                flr_enc = data_loader.safe_encode('floor', floor)
                own_enc = data_loader.safe_encode('ownership_type', ownership_type)
                cls_enc = data_loader.safe_encode('area_class', area_class)

                # ✅ حساب avg_ppsm من البيانات العربية
                avg_ppsm = 1000
                if data_loader.df is not None and len(data_loader.df) > 0:
                    loc_data = data_loader.df[data_loader.df['location'] == location]
                    if len(loc_data) > 0 and 'price_per_sqm_usd' in loc_data.columns:
                        avg_ppsm = loc_data['price_per_sqm_usd'].mean()
                    else:
                        avg_ppsm = data_loader.df['price_per_sqm_usd'].mean()

                input_features = [[
                    loc_enc, type_enc, cond_enc, flr_enc,
                    own_enc, cls_enc,
                    area_sqm, bedrooms, bathrooms, avg_ppsm
                ]]

                predicted_price = float(price_model.predict(input_features)[0])

                # ✅ حساب الثقة بناءً على البيانات العربية
                confidence = _compute_confidence(
                    data_loader.df, location, property_type, area_sqm
                )

            except Exception as e:
                logger.error(f"Model prediction error: {e}")
                import traceback
                traceback.print_exc()
                predicted_price = None

        # Fallback estimation
        if predicted_price is None:
            if data_loader is not None and data_loader.df is not None and len(data_loader.df) > 0:
                loc_data = data_loader.df[data_loader.df['location'] == location]
                if len(loc_data) > 0 and 'price_per_sqm_usd' in loc_data.columns:
                    avg_ppsm = loc_data['price_per_sqm_usd'].mean()
                else:
                    avg_ppsm = data_loader.df['price_per_sqm_usd'].mean()
                predicted_price = avg_ppsm * area_sqm
            else:
                avg_ppsm = 1000
                predicted_price = 1000 * area_sqm
            confidence = 55

        # Ensure reasonable price
        predicted_price = max(5000, predicted_price)
        predicted_price = int(predicted_price)

        # Price per sqm breakdown
        price_per_sqm_usd = round(predicted_price / area_sqm, 2) if area_sqm > 0 else 0
        price_per_sqm_syp = int(price_per_sqm_usd * EXCHANGE_RATE) if price_per_sqm_usd else 0

        # Price range (confidence-adjusted spread)
        spread = 0.15 if confidence >= 75 else (0.20 if confidence >= 55 else 0.30)
        price_range = {
            'min': int(predicted_price * (1 - spread)),
            'max': int(predicted_price * (1 + spread)),
        }

        # SYP conversion
        price_syp = predicted_price * EXCHANGE_RATE

        # ✅ Find comparable properties (بالعربي)
        comparable_properties = _find_comparable_properties(
            data_loader.df if data_loader else None,
            location, property_type, area_sqm, bedrooms, top_n=3
        )

        # Explanation - بالعربي
        explanation = get_explanation(
            data, predicted_price, confidence,
            location=location,
            ptype=property_type
        )

        # Price breakdown
        price_breakdown = {
            'base_price_per_sqm_usd': round(avg_ppsm, 2) if 'avg_ppsm' in dir() else 0,
            'area_sqm': area_sqm,
            'calculated_total_usd': predicted_price,
            'location_premium': round(((avg_ppsm / (data_loader.df['price_per_sqm_usd'].mean() if data_loader and data_loader.df is not None and len(data_loader.df) > 0 else 1)) - 1) * 100, 1) if data_loader and data_loader.df is not None and len(data_loader.df) > 0 and avg_ppsm > 0 else 0,
        }

        return jsonify({
            'estimated_price_usd': predicted_price,
            'estimated_price_syp': price_syp,
            'price_range_usd': price_range,
            'price_per_sqm_usd': price_per_sqm_usd,
            'price_per_sqm_syp': price_per_sqm_syp,
            'price_breakdown': price_breakdown,
            'confidence': confidence,
            'explanation': explanation,
            'comparable_properties': comparable_properties,
            'exchange_rate': EXCHANGE_RATE,
            'currency': 'USD',
        })

    except Exception as e:
        logger.error(f"Estimation error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Estimation error: {str(e)}'}), 500


@app.route('/search', methods=['POST'])
def smart_search():
    """
    Smart NLP search - البحث الذكي باللغة الطبيعية
    ✅ يبحث بالعربي في البيانات العربية مباشرة
    """
    try:
        data = request.get_json()
        query = data.get('query', '').strip()

        if not query:
            return jsonify({'error': 'Empty query'}), 400

        # أنواع العقارات بالعربي
        type_keywords = {
            'شقة': ['شقة', 'شقق', 'اپارتمان', 'apartment'],
            'منزل': ['منزل', 'منازل', 'house'],
            'بيت': ['بيت', 'بيوت', 'بيت عربي', 'بيت قديم'],
            'فيلا': ['فيلا', 'فلل', 'villa'],
            'محل تجاري': ['محل', 'محلات', 'متجري', 'shop', 'store', 'محل تجاري'],
            'مكتب': ['مكتب', 'مكاتب', 'office'],
            'أرض': ['أرض', 'أراضي', 'land'],
            'دوبلكس': ['دوبلكس', 'دوكسيات', 'duplex'],
        }

 
        location_keywords = {}
        if data_loader and data_loader.df is not None and len(data_loader.df) > 0:
            for loc in data_loader.df['location'].unique():
                location_keywords[loc] = [loc]

       
        feature_keywords = {
            'مصعد': ['مصعد', 'اسانسير', 'أسانسير', 'elevator', 'lift'],
            'مكيف': ['مكيف', 'تكييف', 'ac', 'مكيفات', 'تكييف مركزي'],
            'حارس أمن': ['حارس', 'أمن', 'security', 'حراسة', 'أمني', 'حماية'],
            'موقف سيارات': ['موقف', 'مرآب', 'باركينغ', 'كراج', 'parking', 'garage', 'موقف سيارات'],
            'حديقة': ['حديقة', 'بستان', 'garden', 'حديقة خاصة'],
            'مفروش': ['مفروش', 'مفروشة', 'فرش', 'furnished', 'شقة مفروشة'],
            'تدفئة': ['تدفئة', 'دفاية', 'heating', 'تدفئة مركزية', 'مدفأ', 'مدفأة'],
            'شرفة': ['شرفة', 'بلكونة', 'بلكون', 'balcony', 'تراس'],
            'مسبح': ['مسبح', 'سباحة', 'pool', 'مسبح خاص'],
            'طاقة شمسية': ['طاقة شمسية', 'شمسي', 'solar', 'سولار'],
            'بلكونة': ['بلكونة', 'شرفة', 'balcony'],
            'بئر مياه خاص': ['بئر مياه', 'بئر'],
            'إطلالة مفتوحة': ['إطلالة', 'إطلالة مفتوحة'],
            'غاز مركزي': ['غاز مركزي'],
            'إنترنت': ['إنترنت', 'انترنت', 'wifi'],
            'أبواب حديدية': ['أبواب حديدية'],
            'شبابيك دبل غلاس': ['دبل غلاس', 'شبابيك دبل'],
            'تدفئة مركزية': ['تدفئة مركزية'],
            'حارس أمن': ['حارس أمن', 'حارس'],
            'قرب مدرسة': ['قرب مدرسة', 'قريب من مدرسة'],
            'قرب مستشفى': ['قرب مستشفى', 'قريب من مستشفى'],
        }

        # حالات العقار بالعربي
        condition_keywords = {
            'جديد': ['جديد', 'جديدة', 'new'],
            'ممتاز': ['ممتاز', 'ممتازة', 'excellent'],
            'كالجديد': ['كالجديد', 'زي الجديد', 'like new'],
            'يحتاج ترميم': ['يحتاج ترميم', 'ترميم', 'خربان', 'needs renovation'],
        }

        # Parse query
        detected_type = None
        detected_location = None
        detected_features = []
        detected_condition = None
        detected_rooms = None
        max_price_usd = None

        for ptype, keywords in type_keywords.items():
            for kw in keywords:
                if kw in query:
                    detected_type = ptype
                    break

        for loc, keywords in location_keywords.items():
            for kw in keywords:
                if kw in query:
                    detected_location = loc
                    break

        for feat_ar, keywords in feature_keywords.items():
            for kw in keywords:
                if kw in query:
                    if feat_ar not in detected_features:
                        detected_features.append(feat_ar)

        for cond, keywords in condition_keywords.items():
            for kw in keywords:
                if kw in query:
                    detected_condition = cond
                    break

        # Extract rooms
        room_match = re.search(r'(\d+)\s*(?:غرف|غرفة|غرفه)', query)
        if room_match:
            detected_rooms = int(room_match.group(1))

        # Extract max price
        price_million_match = re.search(r'(?:أقل من|تحت|حتى|اقصى)\s*(\d+)\s*(?:مليون)', query)
        if price_million_match:
            max_price_syp = int(price_million_match.group(1)) * 1000000
            max_price_usd = max_price_syp / EXCHANGE_RATE

        price_usd_match = re.search(r'(?:أقل من|تحت|حتى|اقصى)?\s*(\d+)\s*(?:ألف|k|K)\s*(?:دولار|\$|USD)', query)
        if max_price_usd is None and price_usd_match:
            max_price_usd = int(price_usd_match.group(1)) * 1000

        # Search in data
        results = []
        if data_loader and data_loader.df is not None and len(data_loader.df) > 0:
            df = data_loader.df
            mask = pd.Series([True] * len(df))

            # ✅ search arbic
            if detected_type:
                mask &= (df['property_type'] == detected_type)

            if detected_location:
                mask &= (df['location'] == detected_location)

            if detected_condition:
                mask &= (df['condition'] == detected_condition)

            if detected_rooms:
                mask &= (df['bedrooms'] >= detected_rooms)

            if max_price_usd:
                mask &= (df['price_usd'] <= max_price_usd)

            # ✅ features 
            for feat in detected_features:
                if 'features' in df.columns:
                    mask &= df['features'].str.contains(feat, na=False, case=False)

            filtered = df[mask]

            if len(filtered) > 0:
                for _, row in filtered.head(20).iterrows():
                    features_text = str(row.get('features', ''))
                    features_set = set(f.strip() for f in features_text.split(',') if f.strip())

                    has_parking = any(k in features_set for k in ['موقف سيارات', 'مرآب', 'Parking', 'موقف'])
                    has_elevator = any(k in features_set for k in ['مصعد', 'Elevator', 'اسانسير'])
                    has_balcony = any(k in features_set for k in ['شرفة', 'بلكونة', 'Balcony', 'بلكون'])
                    has_garden = any(k in features_set for k in ['حديقة', 'Garden', 'بستان'])
                    has_pool = any(k in features_set for k in ['مسبح', 'Pool', 'سباحة'])
                    has_furnished = any(k in features_set for k in ['مفروش', 'مفروشة', 'Furnished', 'شقة مفروشة'])
                    has_heating = any(k in features_set for k in ['تدفئة', 'Heating', 'تدفئة مركزية', 'دفاية'])
                    has_security = any(k in features_set for k in ['حارس أمن', 'Security', 'أمن', 'حارس'])

                    image_idx = (int(row.get('id', 1)) - 1) % 10 + 1

                    property_obj = {
                        'id': int(row.get('id', 0)),
                        'title': row.get('title', f'{row.get("property_type", "")} في {row.get("location", "")}'),
                        'description': row.get('description', ''),
                        'price': int(row.get('price_usd', 0) * EXCHANGE_RATE),
                        'type': row.get('property_type', ''),
                        'city': 'دمشق',
                        'neighborhood': row.get('location', ''),
                        'area': int(row.get('area_sqm', 0)),
                        'rooms': int(row.get('bedrooms', 0)),
                        'bathrooms': int(row.get('bathrooms', 0)),
                        'floor': row.get('floor', None),
                        'furnished': has_furnished,
                        'parking': has_parking,
                        'elevator': has_elevator,
                        'balcony': has_balcony,
                        'garden': has_garden,
                        'pool': has_pool,
                        'heating': has_heating,
                        'security': has_security,
                        'latitude': row.get('latitude', None),
                        'longitude': row.get('longitude', None),
                        'images': [f'/images/properties/property{image_idx}.jpg'],
                        'status': 'approved',
                        'views_count': 0,
                        'featured': False,
                        'created_at': str(row.get('date_posted', '')),
                        'updated_at': str(row.get('date_posted', '')),
                    }

                    results.append(property_obj)

        # Build description
        desc_parts = []
        if detected_type:
            desc_parts.append(f"نوع: {detected_type}")
        if detected_location:
            desc_parts.append(f"منطقة: {detected_location}")
        if detected_features:
            desc_parts.append(f"مميزات: {', '.join(detected_features)}")
        if detected_condition:
            desc_parts.append(f"حالة: {detected_condition}")
        if detected_rooms:
            desc_parts.append(f"غرف: {detected_rooms}+")

        return jsonify({
            'query': query,
            'interpreted': {
                'type': detected_type,
                'neighborhood': detected_location,
                'features': detected_features,
                'condition': detected_condition,
                'rooms': detected_rooms,
                'max_price': max_price_usd,
            },
            'description': ' | '.join(desc_parts) if desc_parts else 'بحث عام',
            'results': results,
            'count': len(results),
        })

    except Exception as e:
        logger.error(f"Search error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Search error: {str(e)}'}), 500


@app.route('/recommend', methods=['POST'])
def recommend():
    """Get recommendations"""
    try:
        data = request.get_json() or {}
        property_id = data.get('property_id')
        preferences = data.get('preferences', {})

        results = []

        if data_loader and data_loader.df is not None and len(data_loader.df) > 0:
            df = data_loader.df

            if property_id:
                target_rows = df[df['id'] == property_id]
                if len(target_rows) > 0:
                    target = target_rows.iloc[0]
                    similar = df[
                        (df['property_type'] == target['property_type']) &
                        (df['location'] == target['location']) &
                        (df['id'] != property_id)
                    ].copy()

                    if len(similar) > 0:
                        similar['similarity'] = 1 - abs(
                            similar['price_usd'] - target['price_usd']
                        ) / (target['price_usd'] + 1)
                        similar = similar.sort_values('similarity', ascending=False)
                        results = similar.head(6).to_dict('records')

            elif preferences:
                mask = pd.Series([True] * len(df))

                if preferences.get('property_type'):
                    mask &= (df['property_type'] == preferences['property_type'])
                if preferences.get('location'):
                    mask &= (df['location'] == preferences['location'])
                if preferences.get('price_max'):
                    mask &= (df['price_usd'] <= preferences['price_max'])
                if preferences.get('bedrooms'):
                    mask &= (df['bedrooms'] >= preferences['bedrooms'])

                filtered = df[mask]
                if len(filtered) > 0:
                    results = filtered.sample(min(6, len(filtered))).to_dict('records')

            if not results and len(df) > 0:
                results = df.sample(min(6, len(df))).to_dict('records')

        return jsonify({
            'recommendations': results,
            'count': len(results),
            'based_on': 'property' if property_id else (
                'preferences' if preferences else 'general'
            ),
        })

    except Exception as e:
        return jsonify({
            'error': f'Recommendation error: {str(e)}',
            'recommendations': [],
        }), 500


@app.route('/trends', methods=['GET'])
def price_trends():
    """Price trends - اتجاهات الأسعار"""
    try:
        ptype = request.args.get('type')
        location = request.args.get('location')

        trends_data = []
        stats = {}
        by_location = {}
        by_type = {}

        if data_loader and data_loader.df is not None and len(data_loader.df) > 0:
            filtered = data_loader.df.copy()
            if ptype:
                filtered = filtered[filtered['property_type'] == ptype]
            if location:
                filtered = filtered[filtered['location'] == location]

            if 'date_posted' in filtered.columns and len(filtered) > 0:
                try:
                    f_copy = filtered.copy()
                    f_copy['date'] = pd.to_datetime(f_copy['date_posted'], errors='coerce')
                    f_copy = f_copy.dropna(subset=['date'])
                    f_copy['month'] = f_copy['date'].dt.to_period('M')

                    monthly = f_copy.groupby('month').agg({
                        'price_usd': 'mean',
                        'price_per_sqm_usd': 'mean',
                        'id': 'count'
                    }).reset_index()

                    for _, row in monthly.iterrows():
                        trends_data.append({
                            'period': str(row['month']),
                            'avg_price_usd': int(row['price_usd']),
                            'avg_price_per_sqm_usd': int(row['price_per_sqm_usd']),
                            'count': int(row['id']),
                        })
                except Exception:
                    pass

            df = data_loader.df
            stats = {
                'total_properties': len(df),
                'avg_price_usd': int(df['price_usd'].mean()),
                'min_price_usd': int(df['price_usd'].min()),
                'max_price_usd': int(df['price_usd'].max()),
                'median_price_usd': int(df['price_usd'].median()),
                'avg_area_sqm': int(df['area_sqm'].mean()),
            }

            for loc in df['location'].unique():
                loc_data = df[df['location'] == loc]
                by_location[loc] = {
                    'avg_price_usd': int(loc_data['price_usd'].mean()),
                    'avg_price_per_sqm_usd': int(loc_data['price_per_sqm_usd'].mean()),
                    'count': len(loc_data),
                }

            for t in df['property_type'].unique():
                t_data = df[df['property_type'] == t]
                by_type[t] = {
                    'avg_price_usd': int(t_data['price_usd'].mean()),
                    'avg_price_per_sqm_usd': int(t_data['price_per_sqm_usd'].mean()),
                    'count': len(t_data),
                }

        return jsonify({
            'trends': trends_data,
            'stats': stats,
            'by_location': by_location,
            'by_type': by_type,
        })

    except Exception as e:
        return jsonify({'error': f'Trends error: {str(e)}'}), 500


@app.route('/market-insights', methods=['GET'])
def market_insights():
    """Market insights - رؤى السوق"""
    try:
        insights = {}

        if data_loader and data_loader.df is not None and len(data_loader.df) > 0:
            df = data_loader.df

            # Top locations by average price
            location_stats = []
            for loc in df['location'].unique():
                loc_data = df[df['location'] == loc]
                location_stats.append({
                    'location': loc,
                    'avg_price_usd': int(loc_data['price_usd'].mean()),
                    'avg_price_per_sqm_usd': int(loc_data['price_per_sqm_usd'].mean()),
                    'count': len(loc_data),
                })
            location_stats.sort(key=lambda x: x['avg_price_per_sqm_usd'], reverse=True)

            insights = {
                'total_properties': len(df),
                'avg_price_usd': int(df['price_usd'].mean()),
                'location_stats': location_stats[:15],
                'price_range': {
                    'min': int(df['price_usd'].min()),
                    'max': int(df['price_usd'].max()),
                }
            }

        return jsonify(insights)

    except Exception as e:
        return jsonify({'error': f'Market insights error: {str(e)}'}), 500


@app.route('/retrain', methods=['POST'])
def retrain_model():
    """Retrain model - إعادة تدريب النموذج"""
    try:
        data_loader.load_data()
        train_model()
        return jsonify({
            'message': 'Model retrained successfully',
            'data_records': len(data_loader.df) if data_loader and data_loader.df is not None else 0,
            'model_loaded': price_model is not None,
        })
    except Exception as e:
        return jsonify({'error': f'Retrain error: {str(e)}'}), 500


if __name__ == '__main__':
    print("=" * 50)
    print("NAZRA AI Service v4.0 (Arabic Data)")
    print("=" * 50)

    init_services()

    print(f"  Data: {len(data_loader.df) if data_loader and data_loader.df is not None else 0} records")
    print(f"  Model: {'loaded' if price_model else 'NOT loaded'}")
    print("=" * 50)

    app.run(host='0.0.0.0', port=5001, debug=True)
