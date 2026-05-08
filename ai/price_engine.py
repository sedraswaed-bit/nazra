
# Price Prediction and Analysis Engine - NAZRA Platform

import logging
import numpy as np
from config import (
    EXCHANGE_RATE,
    KNN_NEIGHBORS,
    SIMILAR_PRICE_RANGE,
    MAX_RECOMMENDATIONS,
    PROPERTY_TYPE_MULTIPLIERS,
    CONDITION_MULTIPLIERS,
    LOCATION_BASE_PRICES,
    LOCATION_NAMES_AR,
    PROPERTY_TYPE_NAMES_AR,
    CONDITION_NAMES_AR,
)

# / Logging setup
logger = logging.getLogger(__name__)


class PriceEngine:
    """
    
    Price prediction and analysis engine class
    Uses k-nearest neighbors approach for price prediction
    """

    def __init__(self, data_loader):
        """
       
        Initialize the price engine

        Args:
            data_loader: كائن تحميل البيانات / DataLoader instance
        """
        self.data_loader = data_loader

    def predict_price(self, location, area_sqm, bedrooms, bathrooms,
                      property_type, condition):
        """
        Predict property price based on its characteristics


        Uses k-nearest neighbors: find similar properties in dataset,
        then calculate weighted average of their prices with type and condition multipliers

        Args:
            location: المنطقة / Location name
            area_sqm: المساحة بالمتر المربع / Area in square meters
            bedrooms: عدد الغرف / Number of bedrooms
            bathrooms: عدد الحمامات / Number of bathrooms
            property_type: نوع العقار / Property type
            condition: حالة العقار / Property condition

        Returns:
            dict: نتيجة التوقع / Prediction result
        """
        # تحميل البيانات إذا لم تكن محملة / Load data if not loaded
        if self.data_loader.df is None:
            self.data_loader.load_data()

        df = self.data_loader.df

        # التحقق من صحة المدخلات / Validate inputs
        area_sqm = float(area_sqm) if area_sqm else 100.0
        bedrooms = int(bedrooms) if bedrooms else 2
        bathrooms = int(bathrooms) if bathrooms else 1
        property_type = property_type or 'Apartment'
        condition = condition or 'Good'

        # ─── البحث عن عقارات مشابهة / Find similar properties ───

        # العقارات في نفس المنطقة / Properties in same location
        same_location = df[df['location'] == location]

        if same_location.empty:
            # إذا لم يتم العثور على عقارات في نفس المنطقة، نوسع البحث
            # If no properties in same location, broaden search
            same_location = df.copy()
            location_weight = 0.5  # وزن أقل للمنطقة / Lower weight for location
        else:
            location_weight = 1.0

        # حساب المسافة بين العقار المطلوب وكل عقار في البيانات
        # Calculate distance between requested property and each property
        distances = []
        for idx, row in same_location.iterrows():
            # مسافة طبيعية للمساحة / Normalized distance for area
            area_diff = abs(row['area_sqm'] - area_sqm) / max(area_sqm, 1)

            # مسافة طبيعية لعدد الغرف / Normalized distance for bedrooms
            bedroom_diff = abs(row['bedrooms'] - bedrooms) / max(bedrooms, 1)

            # مسافة طبيعية لعدد الحمامات / Normalized distance for bathrooms
            bathroom_diff = abs(row['bathrooms'] - bathrooms) / max(bathrooms, 1)

            # مكافأة تطابق النوع / Type match bonus
            type_match = 0.0 if row['property_type'] == property_type else 0.5

            # مكافأة تطابق الحالة / Condition match bonus
            condition_match = 0.0 if row['condition'] == condition else 0.3

            # المسافة الإجمالية / Total distance
            total_distance = (
                    area_diff * 0.4 +        # المساحة الوزن الأكبر / Area highest weight
                    bedroom_diff * 0.25 +     # الغرف / Bedrooms
                    bathroom_diff * 0.15 +    # الحمامات / Bathrooms
                    type_match * 0.15 +       # النوع / Type
                    condition_match * 0.05    # الحالة / Condition
            )

            # تطبيق وزن المنطقة / Apply location weight
            total_distance = total_distance / location_weight

            distances.append({
                'idx': idx,
                'distance': total_distance,
                'price': row['price'],
                'price_per_sqm': row['price_per_sqm'],
                'property_type': row['property_type'],
                'condition': row['condition'],
                'area_sqm': row['area_sqm'],
                'bedrooms': row['bedrooms'],
                'bathrooms': row['bathrooms'],
            })

        # ترتيب حسب المسافة / Sort by distance
        distances.sort(key=lambda x: x['distance'])

        # أخذ أقرب K جيران / Take K nearest neighbors
        k = min(KNN_NEIGHBORS, len(distances))
        nearest = distances[:k]

        if not nearest:
            # لا توجد بيانات كافية / Not enough data
            # استخدام السعر الأساسي للمنطقة / Use base location price
            base_price_per_sqm = LOCATION_BASE_PRICES.get(location, 1500)
            estimated_price_usd = base_price_per_sqm * area_sqm
            confidence = 'low'
            similar_count = 0
        else:
            # ─── حساب المتوسط المرجح / Calculate weighted average ───
            total_weight = 0.0
            weighted_price_per_sqm = 0.0

            for neighbor in nearest:
                # الوزن يتناسب عكسياً مع المسافة / Weight inversely proportional to distance
                weight = 1.0 / (neighbor['distance'] + 0.01)
                total_weight += weight
                weighted_price_per_sqm += weight * neighbor['price_per_sqm']

            avg_price_per_sqm = weighted_price_per_sqm / total_weight if total_weight > 0 else 0

            # ─── تطبيق المضاعفات / Apply multipliers ───
            type_multiplier = PROPERTY_TYPE_MULTIPLIERS.get(property_type, 1.0)
            condition_multiplier = CONDITION_MULTIPLIERS.get(condition, 1.0)

            # حساب السعر المتوقع / Calculate estimated price
            estimated_price_usd = avg_price_per_sqm * area_sqm * type_multiplier * condition_multiplier

            similar_count = len(nearest)

            # تحديد مستوى الثقة / Determine confidence level
            avg_distance = sum(n['distance'] for n in nearest) / len(nearest)
            if len(nearest) >= 5 and avg_distance < 0.3:
                confidence = 'high'
            elif len(nearest) >= 3 and avg_distance < 0.5:
                confidence = 'medium'
            else:
                confidence = 'low'

        # حساب السعر بالليرة السورية / Calculate price in SYP
        estimated_price_syp = round(estimated_price_usd * EXCHANGE_RATE, 0)

        # متوسط السعر لكل متر مربع / Average price per sqm
        if nearest:
            final_avg_price_per_sqm = round(avg_price_per_sqm, 2)
            final_avg_price_per_sqm_syp = round(avg_price_per_sqm * EXCHANGE_RATE, 2)
        else:
            final_avg_price_per_sqm = round(LOCATION_BASE_PRICES.get(location, 1500), 2)
            final_avg_price_per_sqm_syp = round(final_avg_price_per_sqm * EXCHANGE_RATE, 2)

        result = {
            # السعر المتوقع بالدولار / Estimated price in USD
            'estimated_price_usd': round(estimated_price_usd, 2),
            # السعر المتوقع بالليرة / Estimated price in SYP
            'estimated_price_syp': estimated_price_syp,
            # متوسط السعر لكل متر مربع / Average price per sqm
            'avg_price_per_sqm_usd': final_avg_price_per_sqm,
            'avg_price_per_sqm_syp': final_avg_price_per_sqm_syp,
            # مستوى الثقة / Confidence level
            'confidence_level': confidence,
            # عدد العقارات المشابهة المستخدمة / Similar properties used count
            'similar_properties_used': similar_count,
            # تفاصيل المدخلات / Input details
            'input': {
                'location': location,
                'location_ar': LOCATION_NAMES_AR.get(location, location),
                'area_sqm': area_sqm,
                'bedrooms': bedrooms,
                'bathrooms': bathrooms,
                'property_type': property_type,
                'property_type_ar': PROPERTY_TYPE_NAMES_AR.get(property_type, property_type),
                'condition': condition,
                'condition_ar': CONDITION_NAMES_AR.get(condition, condition),
            },
            # المضاعفات المطبقة / Applied multipliers
            'multipliers': {
                'type_multiplier': PROPERTY_TYPE_MULTIPLIERS.get(property_type, 1.0),
                'condition_multiplier': CONDITION_MULTIPLIERS.get(condition, 1.0),
            },
            # سعر الصرف المستخدم / Exchange rate used
            'exchange_rate': EXCHANGE_RATE,
        }

        return result

    def explain_prediction(self, prediction_result):
        """
        شرح نتيجة التوقع بلغة عربية مفهومة
        Explain prediction result in human-readable Arabic

        Args:
            prediction_result: نتيجة التوقع من predict_price / Prediction result from predict_price

        Returns:
            dict: شرح التوقع / Prediction explanation
        """
        inp = prediction_result.get('input', {})
        location = inp.get('location', '')
        location_ar = inp.get('location_ar', location)
        property_type = inp.get('property_type', '')
        property_type_ar = inp.get('property_type_ar', property_type)
        condition = inp.get('condition', '')
        condition_ar = inp.get('condition_ar', condition)
        area = inp.get('area_sqm', 0)
        bedrooms = inp.get('bedrooms', 0)
        bathrooms = inp.get('bathrooms', 0)

        similar_count = prediction_result.get('similar_properties_used', 0)
        avg_price_per_sqm = prediction_result.get('avg_price_per_sqm_usd', 0)
        estimated_price_usd = prediction_result.get('estimated_price_usd', 0)
        estimated_price_syp = prediction_result.get('estimated_price_syp', 0)
        confidence = prediction_result.get('confidence_level', 'low')
        multipliers = prediction_result.get('multipliers', {})

        # مستوى الثقة بالعربية / Confidence level in Arabic
        confidence_ar = {
            'high': 'مرتفع',
            'medium': 'متوسط',
            'low': 'منخفض',
        }.get(confidence, 'غير محدد')

        # بناء الشرح / Build explanation
        explanation_parts = []

        # الجملة الرئيسية / Main sentence
        explanation_parts.append(
            f"السعر المتوقع لهذا العقار ({property_type_ar} في {location_ar}) "
            f"هو {estimated_price_usd:,.0f}$ أمريكي "
            f"(ما يعادل {estimated_price_syp:,.0f} ليرة سورية)."
        )

        # الجملة الرئيسية بالإنجليزية / Main sentence in English
        explanation_parts.append(
            f"The estimated price for this property ({property_type} in {location}) "
            f"is ${estimated_price_usd:,.0f} USD "
            f"(equivalent to {estimated_price_syp:,.0f} SYP)."
        )

        # شرح الأساس / Basis explanation
        if similar_count > 0:
            explanation_parts.append(
                f"تم حساب السعر بناءً على {similar_count} عقار مشابه في منطقة {location_ar}، "
                f"حيث متوسط السعر لكل متر مربع هو {avg_price_per_sqm:,.0f}$."
            )
            explanation_parts.append(
                f"Price calculated based on {similar_count} similar properties in {location}, "
                f"with an average price per sqm of ${avg_price_per_sqm:,.0f}."
            )
        else:
            explanation_parts.append(
                f"تم حساب السعر بناءً على السعر الأساسي لمنطقة {location_ar}. "
                f"لا توجد بيانات كافية لعقارات مشابهة."
            )
            explanation_parts.append(
                f"Price calculated based on the base price for {location}. "
                f"Not enough similar property data available."
            )

        # شرح المضاعفات / Multipliers explanation
        type_mult = multipliers.get('type_multiplier', 1.0)
        cond_mult = multipliers.get('condition_multiplier', 1.0)

        if type_mult != 1.0:
            explanation_parts.append(
                f"تم تطبيق مضاعف نوع العقار ({property_type_ar}): {type_mult}x."
            )
            explanation_parts.append(
                f"Property type multiplier ({property_type}) applied: {type_mult}x."
            )

        if cond_mult != 1.0:
            explanation_parts.append(
                f"تم تطبيق مضاعف حالة العقار ({condition_ar}): {cond_mult}x."
            )
            explanation_parts.append(
                f"Condition multiplier ({condition}) applied: {cond_mult}x."
            )

        # شرح مستوى الثقة / Confidence explanation
        explanation_parts.append(
            f"مستوى الثقة في التوقع: {confidence_ar}."
        )
        explanation_parts.append(
            f"Prediction confidence level: {confidence}."
        )

        # تفاصيل المواصفات / Specification details
        explanation_parts.append(
            f"المواصفات: مساحة {area} م²، {bedrooms} غرف نوم، {bathrooms} حمام."
        )
        explanation_parts.append(
            f"Specifications: {area} sqm, {bedrooms} bedrooms, {bathrooms} bathrooms."
        )

        full_explanation = ' '.join(explanation_parts)

        return {
            'explanation': full_explanation,
            'explanation_parts': explanation_parts,
            'confidence': confidence,
            'confidence_ar': confidence_ar,
            'similar_properties_used': similar_count,
            'location': location,
            'location_ar': location_ar,
        }

    def get_price_trend(self, location, property_type=None, months=6):
        """
        الحصول على اتجاه الأسعار في منطقة معينة
        Get price trend for a specific location

        تجميع العقارات حسب شهر النشر وحساب متوسط السعر لكل شهر
        Groups properties by posting month and calculates average price per month

        Args:
            location: المنطقة / Location name
            property_type: نوع العقار (اختياري) / Property type (optional)
            months: عدد الأشهر / Number of months

        Returns:
            dict: بيانات الاتجاه / Trend data
        """
        # تحميل البيانات إذا لم تكن محملة / Load data if not loaded
        if self.data_loader.df is None:
            self.data_loader.load_data()

        df = self.data_loader.df

        # فلترة حسب المنطقة / Filter by location
        filtered = df[df['location'] == location]

        # فلترة حسب النوع إذا تم تحديده / Filter by type if specified
        if property_type:
            filtered = filtered[filtered['property_type'] == property_type]

        if filtered.empty:
            return {
                'location': location,
                'location_ar': LOCATION_NAMES_AR.get(location, location),
                'property_type': property_type,
                'trend_data': [],
                'trend_direction': 'stable',
                'trend_direction_ar': 'مستقر',
                'percentage_change': 0.0,
                'total_properties': 0,
            }

        # التأكد من وجود تاريخ صالح / Ensure valid dates exist
        filtered = filtered.dropna(subset=['date_posted'])

        if filtered.empty:
            return {
                'location': location,
                'location_ar': LOCATION_NAMES_AR.get(location, location),
                'property_type': property_type,
                'trend_data': [],
                'trend_direction': 'stable',
                'trend_direction_ar': 'مستقر',
                'percentage_change': 0.0,
                'total_properties': 0,
            }

        # تجميع حسب الشهر / Group by month
        filtered = filtered.copy()
        filtered['month'] = filtered['date_posted'].dt.to_period('M')

        monthly_groups = filtered.groupby('month')

        trend_data = []
        for period, group in monthly_groups:
            avg_price = round(float(group['price'].mean()), 2)
            avg_price_syp = round(avg_price * EXCHANGE_RATE, 2)
            avg_price_per_sqm = round(float(group['price_per_sqm'].mean()), 2)
            count = len(group)

            trend_data.append({
                'month': str(period),
                'avg_price_usd': avg_price,
                'avg_price_syp': avg_price_syp,
                'avg_price_per_sqm_usd': avg_price_per_sqm,
                'avg_price_per_sqm_syp': round(avg_price_per_sqm * EXCHANGE_RATE, 2),
                'count': count,
            })

        # ترتيب حسب الشهر / Sort by month
        trend_data.sort(key=lambda x: x['month'])

        # تحديد عدد الأشهر المطلوبة / Limit to requested months
        if len(trend_data) > months:
            trend_data = trend_data[-months:]

        # حساب اتجاه الاتجاه / Calculate trend direction
        percentage_change = 0.0
        trend_direction = 'stable'
        trend_direction_ar = 'مستقر'

        if len(trend_data) >= 2:
            first_price = trend_data[0]['avg_price_usd']
            last_price = trend_data[-1]['avg_price_usd']

            if first_price > 0:
                percentage_change = round(
                    ((last_price - first_price) / first_price) * 100, 2
                )

                if percentage_change > 2:
                    trend_direction = 'rising'
                    trend_direction_ar = 'ارتفاع'
                elif percentage_change < -2:
                    trend_direction = 'falling'
                    trend_direction_ar = 'انخفاض'
                else:
                    trend_direction = 'stable'
                    trend_direction_ar = 'مستقر'

        return {
            'location': location,
            'location_ar': LOCATION_NAMES_AR.get(location, location),
            'property_type': property_type,
            'trend_data': trend_data,
            'trend_direction': trend_direction,
            'trend_direction_ar': trend_direction_ar,
            'percentage_change': percentage_change,
            'total_properties': len(filtered),
        }

    def get_recommendations(self, property_id, limit=5):
        """
        الحصول على توصيات لعقارات مشابهة
        Get recommendations for similar properties

        يجد العقار المحدد ثم يبحث عن عقارات مشابهة في نفس المنطقة
        ونطاق سعري مشابه ونفس النوع أو أنواع قريبة

        Finds the specified property, then searches for similar properties
        in the same location, similar price range, and same or nearby types

        Args:
            property_id: معرف العقار / Property ID
            limit: عدد التوصيات الأقصى / Max recommendations

        Returns:
            dict: التوصيات / Recommendations
        """
        # تحميل البيانات إذا لم تكن محملة / Load data if not loaded
        if self.data_loader.df is None:
            self.data_loader.load_data()

        # البحث عن العقار / Find the property
        target = self.data_loader.get_property_by_id(property_id)

        if target is None:
            return {
                'property_id': property_id,
                'error': 'العقار غير موجود / Property not found',
                'recommendations': [],
            }

        # تحديد الحد الأقصى / Enforce max limit
        limit = min(limit, MAX_RECOMMENDATIONS)

        target_price = target.get('price', 0)
        target_location = target.get('location', '')
        target_type = target.get('property_type', '')
        target_area = target.get('area_sqm', 0)
        target_bedrooms = target.get('bedrooms', 0)

        # نطاق السعر المشابه (±30%) / Similar price range (±30%)
        price_min = target_price * (1 - SIMILAR_PRICE_RANGE)
        price_max = target_price * (1 + SIMILAR_PRICE_RANGE)

        df = self.data_loader.df

        # استبعاد العقار نفسه / Exclude the property itself
        candidates = df[df['id'] != int(property_id)].copy()

        # ─── حساب درجة التشابه / Calculate similarity score ───
        similarities = []

        for idx, row in candidates.iterrows():
            similarity_score = 0.0

            # تشابه المنطقة (أهم عامل) / Location similarity (most important)
            if row['location'] == target_location:
                similarity_score += 40.0

            # تشابه نطاق السعر / Price range similarity
            if price_min <= row['price'] <= price_max:
                similarity_score += 25.0
                # مكافأة إضافية لقرب السعر / Extra bonus for close price
                price_diff_pct = abs(row['price'] - target_price) / max(target_price, 1)
                similarity_score += max(0, 10.0 * (1 - price_diff_pct / SIMILAR_PRICE_RANGE))
            else:
                # عقار خارج النطاق لكن قريب / Outside range but close
                price_diff_pct = abs(row['price'] - target_price) / max(target_price, 1)
                if price_diff_pct < 0.5:
                    similarity_score += 10.0

            # تشابه النوع / Type similarity
            if row['property_type'] == target_type:
                similarity_score += 20.0
            else:
                # أنواع قريبة (شقة ودوبلكس مثلاً) / Nearby types
                type_groups = [
                    {'Apartment', 'Duplex'},
                    {'Townhouse', 'House'},
                    {'Villa', 'House'},
                ]
                for group in type_groups:
                    if row['property_type'] in group and target_type in group:
                        similarity_score += 10.0
                        break

            # تشابه المساحة / Area similarity
            area_diff_pct = abs(row['area_sqm'] - target_area) / max(target_area, 1)
            if area_diff_pct < 0.2:
                similarity_score += 10.0
            elif area_diff_pct < 0.4:
                similarity_score += 5.0

            # تشابه عدد الغرف / Bedroom similarity
            bedroom_diff = abs(row['bedrooms'] - target_bedrooms)
            if bedroom_diff == 0:
                similarity_score += 5.0
            elif bedroom_diff == 1:
                similarity_score += 2.5

            similarities.append({
                'property': row.to_dict(),
                'similarity_score': round(similarity_score, 2),
            })

        # ترتيب حسب درجة التشابه / Sort by similarity score
        similarities.sort(key=lambda x: x['similarity_score'], reverse=True)

        # أخذ أعلى النتائج / Take top results
        recommendations = similarities[:limit]

        # تنسيق النتائج / Format results
        formatted_recommendations = []
        for rec in recommendations:
            prop = rec['property']
            formatted_recommendations.append({
                'id': prop.get('id'),
                'title': prop.get('title', ''),
                'price_usd': prop.get('price', 0),
                'price_syp': prop.get('price_syp', 0),
                'location': prop.get('location', ''),
                'location_ar': LOCATION_NAMES_AR.get(prop.get('location', ''), ''),
                'area_sqm': prop.get('area_sqm', 0),
                'bedrooms': prop.get('bedrooms', 0),
                'bathrooms': prop.get('bathrooms', 0),
                'property_type': prop.get('property_type', ''),
                'property_type_ar': PROPERTY_TYPE_NAMES_AR.get(prop.get('property_type', ''), ''),
                'condition': prop.get('condition', ''),
                'condition_ar': CONDITION_NAMES_AR.get(prop.get('condition', ''), ''),
                'features_list': prop.get('features_list', []),
                'image_path': prop.get('image_path', ''),
                'similarity_score': rec['similarity_score'],
            })

        return {
            'property_id': property_id,
            'target_property': {
                'id': target.get('id'),
                'title': target.get('title', ''),
                'price_usd': target.get('price', 0),
                'price_syp': target.get('price_syp', 0),
                'location': target.get('location', ''),
                'location_ar': LOCATION_NAMES_AR.get(target.get('location', ''), ''),
                'area_sqm': target.get('area_sqm', 0),
                'bedrooms': target.get('bedrooms', 0),
                'bathrooms': target.get('bathrooms', 0),
                'property_type': target.get('property_type', ''),
                'property_type_ar': PROPERTY_TYPE_NAMES_AR.get(target.get('property_type', ''), ''),
                'condition': target.get('condition', ''),
                'condition_ar': CONDITION_NAMES_AR.get(target.get('condition', ''), ''),
            },
            'recommendations': formatted_recommendations,
            'total_found': len(similarities),
        }
