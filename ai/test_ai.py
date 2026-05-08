# test_ai.py - حطه بـ D:\nazraproject1\ai\
import requests

# 1. فحص الصحة
r = requests.get("http://localhost:5001/health")
print("=== Health ===")
print(r.json())

# 2. توقع سعر شقة بالمزة
print("\n=== Estimate ===")
r = requests.post("http://localhost:5001/estimate", json={
    "location": "المزة",
    "property_type": "شقة",
    "area_sqm": 120,
    "bedrooms": 3,
    "bathrooms": 2,
    "condition": "ممتاز",
    "floor": "ثالث",
    "ownership_type": "طابو أخضر",
    "area_class": "راقية"
})
print(r.json())

# 3. المناطق
print("\n=== Locations ===")
r = requests.get("http://localhost:5001/locations")
print(r.json())

# 4. أنواع العقارات
print("\n=== Property Types ===")
r = requests.get("http://localhost:5001/property-types")
print(r.json())

# 5. بحث ذكي
print("\n=== Smart Search ===")
r = requests.post("http://localhost:5001/search", json={
    "query": "شقة بالمزة 3 غرف ممتازة"
})
data = r.json()
print(f"Interpreted: {data['interpreted']}")
print(f"Results: {data['count']}")