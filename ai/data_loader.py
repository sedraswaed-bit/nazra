"""

Loads, cleans, and prepares Damascus real estate data for ML training.
No translation needed - Arabic data stays Arabic.
"""

import os
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
import joblib
import logging

logger = logging.getLogger(__name__)


class DataLoader:
    """Loads and prepares Damascus real estate dataset (Arabic data)"""

    COLUMN_MAP = {
        'price_usd': 'price_usd',
        'price_per_sqm_usd': 'price_per_sqm_usd',
        'area_sqm': 'area_sqm',
        'bedrooms': 'bedrooms',
        'bathrooms': 'bathrooms',
        'location': 'location',
        'property_type': 'property_type',
        'condition': 'condition',
        'floor': 'floor',
        'ownership_type': 'ownership_type',
        'area_class': 'area_class',
        'features': 'features',
        'utilities': 'utilities',
        'latitude': 'latitude',
        'longitude': 'longitude',
        'date_posted': 'date_posted',
        'title': 'title',
        'description': 'description',
        'id': 'id',
        'main_image': 'main_image',
        'gallery_images': 'gallery_images',
    }

    CATEGORICAL_COLS = [
        'location',
        'property_type',
        'condition',
        'floor',
        'ownership_type',
        'area_class',
    ]

    NUMERIC_COLS = [
        'area_sqm',
        'bedrooms',
        'bathrooms',
        'price_usd',
        'price_per_sqm_usd',
        'latitude',
        'longitude',
    ]

    FEATURE_COLS = [
        'loc_enc', 'type_enc', 'cond_enc', 'floor_enc',
        'own_enc', 'class_enc',
        'area_sqm', 'bedrooms', 'bathrooms',
        'price_per_sqm_usd',
    ]

    TARGET_COL = 'price_usd'

    def __init__(self, data_path=None):
        """Initialize DataLoader"""
        self.df = None
        self.encoders = {}
        self.data_path = data_path or self._find_csv_path()
        self.properties = []
        logger.info(f"DataLoader initialized | CSV path: {self.data_path}")

    def _find_csv_path(self):
        """Find CSV file in multiple possible locations"""
        base_dir = os.path.dirname(os.path.abspath(__file__))
        possible_paths = [
            os.path.join(base_dir, 'data', 'damascus_properties.csv'),
            os.path.join(base_dir, '..', 'backend', 'database', 'data', 'damascus_properties.csv'),
            os.path.join(base_dir, 'data', 'damascus_properties_1500_realistic.csv'),
            os.path.join(base_dir, '..', '..', 'upload', 'damascus_properties.csv'),
        ]
        for path in possible_paths:
            abs_path = os.path.normpath(path)
            if os.path.exists(abs_path):
                logger.info(f"Found CSV at: {abs_path}")
                return abs_path
        logger.warning("CSV file not found in any location!")
        return possible_paths[0]

    def load_data(self):
        """Load dataset from CSV"""
        try:
            logger.info(f"Loading data from: {self.data_path}")

            if not os.path.exists(self.data_path):
                logger.error(f"CSV file not found: {self.data_path}")
                self._create_fallback_data()
                return len(self.df) > 0

            self.df = pd.read_csv(self.data_path, encoding='utf-8')
            logger.info(f"Records loaded: {len(self.df)}")
            logger.info(f"CSV columns: {list(self.df.columns)}")

            # Clean data
            self._clean_data()

            # Build properties list for search
            self._build_properties_list()

            logger.info(f"Data ready: {len(self.df)} clean records")
            return True

        except Exception as e:
            logger.error(f"Error loading data: {e}")
            self._create_fallback_data()
            return len(self.df) > 0

    def _create_fallback_data(self):
        """Create fallback data when CSV not found"""
        logger.warning("Creating fallback data for demo purposes...")
        import random
        random.seed(42)
        records = []
        idx = 1

        locations = ['أبو رمانة', 'المالكي', 'المزة', 'كفرسوسة', 'الشعلان', 'برزة', 'الميدان', 'باب توما']
        property_types = ['شقة', 'منزل', 'فيلا', 'محل تجاري', 'مكتب']
        conditions = ['جديد', 'ممتاز', 'كالجديد', 'جيد', 'مقبول', 'يحتاج ترميم']
        floors = ['أرضي', 'أول', 'ثاني', 'ثالث', 'رابع', 'خامس']
        ownerships = ['طابو أخضر', 'طابو نظامي', 'حكم محكمة', 'سجل عقاري']
        area_classes = ['صغيرة', 'متوسطة', 'كبيرة', 'فاخرة']

        base_prices = {
            'أبو رمانة': 2700, 'المالكي': 2650, 'المزة': 2300,
            'كفرسوسة': 2100, 'الشعلان': 2050, 'برزة': 1650,
            'الميدان': 1300, 'باب توما': 1720,
        }

        for _ in range(600):
            loc = random.choice(locations)
            ptype = random.choice(property_types)
            cond = random.choice(conditions)

            base_ppsm = base_prices.get(loc, 1500)
            variance = random.uniform(0.8, 1.2)
            price_per_sqm = base_ppsm * variance

            area = random.randint(60, 300)
            price = price_per_sqm * area

            if area < 80:
                area_class = 'صغيرة'
            elif area < 150:
                area_class = 'متوسطة'
            elif area < 250:
                area_class = 'كبيرة'
            else:
                area_class = 'فاخرة'

            bedrooms = max(1, min(6, int(area / 40) + random.randint(-1, 1)))
            bathrooms = max(1, min(4, int(bedrooms / 2) + random.randint(0, 1)))

            features_list = random.sample(
                ['مصعد', 'مكيف', 'حارس أمن', 'موقف سيارات', 'حديقة', 'مفروش', 'تدفئة', 'شرفة', 'مسبح', 'طاقة شمسية'],
                k=random.randint(1, 5)
            )

            records.append({
                'id': idx,
                'title': f"{ptype} في {loc}",
                'description': f"{ptype} في {loc} - {area} م²",
                'price_usd': round(price, 2),
                'price_per_sqm_usd': round(price_per_sqm, 2),
                'area_sqm': area,
                'bedrooms': bedrooms,
                'bathrooms': bathrooms,
                'location': loc,
                'property_type': ptype,
                'condition': cond,
                'floor': random.choice(floors),
                'ownership_type': random.choice(ownerships),
                'area_class': area_class,
                'features': ', '.join(features_list),
                'utilities': 'كهرباء دولة',
                'latitude': 33.51 + random.uniform(-0.03, 0.03),
                'longitude': 36.28 + random.uniform(-0.03, 0.03),
                'date_posted': f"2025-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
            })
            idx += 1

        self.df = pd.DataFrame(records)
        logger.info(f"Created {len(self.df)} fallback records")

    def _clean_data(self):
        """Clean and prepare data """
        if self.df is None or len(self.df) == 0:
            return

        logger.info(f"Columns before cleaning: {list(self.df.columns)}")

        # Ensure required columns exist
        required = ['price_usd', 'area_sqm', 'location', 'property_type']
        missing = [c for c in required if c not in self.df.columns]
        if missing:
            logger.error(f"Missing required columns: {missing}")
            for req_col in missing:
                for col in self.df.columns:
                    if req_col in col or col in req_col:
                        logger.info(f"  Renaming '{col}' -> '{req_col}'")
                        self.df = self.df.rename(columns={col: req_col})
                        break

        # Drop rows with no price
        if 'price_usd' in self.df.columns:
            before = len(self.df)
            self.df = self.df.dropna(subset=['price_usd'])
            after = len(self.df)
            if before != after:
                logger.info(f"Removed {before - after} rows with missing price_usd")

        # Fill missing numeric columns with median
        for col in self.NUMERIC_COLS:
            if col in self.df.columns:
                self.df[col] = pd.to_numeric(self.df[col], errors='coerce')
                median_val = self.df[col].median()
                if self.df[col].isna().any():
                    self.df[col] = self.df[col].fillna(median_val if not pd.isna(median_val) else 0)
            else:
                logger.warning(f"Numeric column '{col}' not found, adding default 0")
                self.df[col] = 0

        # Fill missing categorical columns
        for col in self.CATEGORICAL_COLS:
            if col in self.df.columns:
                self.df[col] = self.df[col].fillna('').astype(str)
                mode_val = self.df[col].mode()
                fill_val = mode_val[0] if len(mode_val) > 0 and mode_val[0] != '' else 'غير محدد'
                self.df[col] = self.df[col].replace('', fill_val)
            else:
                logger.warning(f"Categorical column '{col}' not found, adding default")
                self.df[col] = 'غير محدد'

        # Fill text columns
        for col in ['features', 'utilities', 'description', 'title']:
            if col in self.df.columns:
                self.df[col] = self.df[col].fillna('').astype(str)
            else:
                self.df[col] = ''

        # Ensure price_per_sqm_usd is calculated
        if 'price_per_sqm_usd' not in self.df.columns or self.df['price_per_sqm_usd'].isna().all():
            self.df['price_per_sqm_usd'] = self.df['price_usd'] / self.df['area_sqm'].replace(0, 1)
        else:
            self.df['price_per_sqm_usd'] = pd.to_numeric(self.df['price_per_sqm_usd'], errors='coerce')
            self.df['price_per_sqm_usd'] = self.df['price_per_sqm_usd'].fillna(
                self.df['price_usd'] / self.df['area_sqm'].replace(0, 1)
            )

        # Create features_list from features text column
        if 'features_list' not in self.df.columns:
            if 'features' in self.df.columns:
                self.df['features_list'] = self.df['features'].apply(
                    lambda x: [f.strip() for f in str(x).split(',') if f.strip()] if x else []
                )
            else:
                self.df['features_list'] = [[] for _ in range(len(self.df))]

        # Calculate area_class if missing
        if 'area_class' not in self.df.columns or self.df['area_class'].isna().all():
            def classify_area(area):
                if area < 80: return 'صغيرة'
                elif area < 150: return 'متوسطة'
                elif area < 250: return 'كبيرة'
                else: return 'فاخرة'
            self.df['area_class'] = self.df['area_sqm'].apply(classify_area)
        else:
            self.df['area_class'] = self.df['area_class'].fillna('متوسطة').astype(str)

        # Remove extreme outliers
        if 'price_usd' in self.df.columns and len(self.df) > 10:
            mean = self.df['price_usd'].mean()
            std = self.df['price_usd'].std()
            lower = mean - 3 * std
            upper = mean + 3 * std
            before = len(self.df)
            self.df = self.df[(self.df['price_usd'] >= lower) & (self.df['price_usd'] <= upper)]
            after = len(self.df)
            if before != after:
                logger.info(f"Removed {before - after} outlier records")

        # Ensure integer columns
        for col in ['bedrooms', 'bathrooms']:
            if col in self.df.columns:
                self.df[col] = pd.to_numeric(self.df[col], errors='coerce').fillna(0).astype(int)

        # Reset index
        self.df = self.df.reset_index(drop=True)

        # Log Arabic data info
        logger.info(f"Data cleaned: {len(self.df)} records ready")
        if 'price_usd' in self.df.columns:
            logger.info(f"Price range: ${self.df['price_usd'].min():,.0f} - ${self.df['price_usd'].max():,.0f}")
        if 'location' in self.df.columns:
            unique_locs = self.df['location'].unique().tolist()
            logger.info(f"Locations ({len(unique_locs)}): {unique_locs[:10]}...")
        if 'property_type' in self.df.columns:
            unique_types = self.df['property_type'].unique().tolist()
            logger.info(f"Property types ({len(unique_types)}): {unique_types}")
        if 'condition' in self.df.columns:
            unique_conds = self.df['condition'].unique().tolist()
            logger.info(f"Conditions ({len(unique_conds)}): {unique_conds}")

    def _build_properties_list(self):
        """Build properties list for fast search"""
        if self.df is None:
            self.properties = []
            return

        self.properties = []
        for _, row in self.df.iterrows():
            prop = row.to_dict()
            if 'features_list' in prop and isinstance(prop['features_list'], str):
                try:
                    import json
                    prop['features_list'] = json.loads(prop['features_list'])
                except:
                    prop['features_list'] = [f.strip() for f in prop['features_list'].split(',') if f.strip()]
            elif 'features_list' not in prop:
                features = prop.get('features', '')
                prop['features_list'] = [f.strip() for f in str(features).split(',') if f.strip()] if features else []

            if 'price_usd' in prop:
                prop['price'] = prop['price_usd']
                prop['price_syp'] = prop['price_usd'] * 10000
            self.properties.append(prop)

    def prepare_features(self):
        """Prepare features for model training"""
        if self.df is None or len(self.df) == 0:
            logger.error("No data to prepare features from")
            return None, None

        data = self.df.copy()

        self.encoders = {}
        encoder_map = {
            'location': 'loc_enc',
            'property_type': 'type_enc',
            'condition': 'cond_enc',
            'floor': 'floor_enc',
            'ownership_type': 'own_enc',
            'area_class': 'class_enc',
        }

        for cat_col, enc_name in encoder_map.items():
            le = LabelEncoder()
            data[enc_name] = le.fit_transform(data[cat_col].astype(str))
            self.encoders[cat_col] = le
            logger.info(f"Encoder '{cat_col}': {len(le.classes_)} classes -> {list(le.classes_)[:5]}...")

        for col in self.FEATURE_COLS:
            if col not in data.columns:
                logger.warning(f"Feature column '{col}' missing, filling with 0")
                data[col] = 0

        X = data[self.FEATURE_COLS].fillna(0)
        y = data[self.TARGET_COL]

        logger.info(f"Features prepared: X={X.shape}, y={y.shape}")
        return X, y

    def save_encoders(self, model_dir):
        """Save LabelEncoders"""
        os.makedirs(model_dir, exist_ok=True)
        for name, encoder in self.encoders.items():
            path = os.path.join(model_dir, f'{name}_encoder.joblib')
            joblib.dump(encoder, path)

    def load_encoders(self, model_dir):
        """Load saved LabelEncoders"""
        self.encoders = {}
        for name in self.CATEGORICAL_COLS:
            path = os.path.join(model_dir, f'{name}_encoder.joblib')
            if os.path.exists(path):
                self.encoders[name] = joblib.load(path)
                logger.info(f"Loaded encoder: {name} ({len(self.encoders[name].classes_)} classes)")
        return len(self.encoders) >= 4

    def get_data(self):
        """Return the loaded DataFrame"""
        return self.df

    def get_locations(self):
        """Return unique locations"""
        if self.df is not None and 'location' in self.df.columns:
            return sorted(self.df['location'].unique().tolist())
        return []

    def get_property_types(self):
        """Return unique property types"""
        if self.df is not None and 'property_type' in self.df.columns:
            return sorted(self.df['property_type'].unique().tolist())
        return []

    def get_property_by_id(self, property_id):
        """Get property by ID"""
        if self.df is None:
            return None
        try:
            pid = int(property_id)
            rows = self.df[self.df['id'] == pid]
            if len(rows) > 0:
                return rows.iloc[0].to_dict()
        except:
            pass
        return None

    def get_stats(self):
        """Return dataset statistics"""
        if self.df is None or len(self.df) == 0:
            return {}

        stats = {
            'total_records': len(self.df),
            'locations': self.df['location'].nunique() if 'location' in self.df.columns else 0,
            'property_types': self.df['property_type'].nunique() if 'property_type' in self.df.columns else 0,
            'avg_price_usd': int(self.df['price_usd'].mean()) if 'price_usd' in self.df.columns else 0,
            'min_price_usd': int(self.df['price_usd'].min()) if 'price_usd' in self.df.columns else 0,
            'max_price_usd': int(self.df['price_usd'].max()) if 'price_usd' in self.df.columns else 0,
            'avg_area_sqm': int(self.df['area_sqm'].mean()) if 'area_sqm' in self.df.columns else 0,
            'avg_bedrooms': round(self.df['bedrooms'].mean(), 1) if 'bedrooms' in self.df.columns else 0,
        }
        return stats

    def safe_encode(self, column_name, value):
        """Safely encode a value using saved encoder - ✅ works with Arabic values"""
        if column_name not in self.encoders:
            logger.warning(f"No encoder for column '{column_name}'")
            return 0
        encoder = self.encoders[column_name]
        try:
            value_str = str(value).strip()
            if value_str in encoder.classes_:
                return int(encoder.transform([value_str])[0])
            # Partial match
            for cls in encoder.classes_:
                if value_str in str(cls) or str(cls) in value_str:
                    return int(encoder.transform([cls])[0])
            logger.warning(f"safe_encode: '{value_str}' not in {column_name} classes")
            return 0
        except Exception as e:
            logger.error(f"safe_encode error for {column_name}='{value}': {e}")
            return 0
