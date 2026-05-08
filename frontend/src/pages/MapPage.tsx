

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Property } from '../types';
import axios from 'axios';

var DAMASCUS_CENTER: [number, number] = [33.5138, 36.2765];

var NEIGHBORHOOD_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'جميع الأحياء' },
  { value: 'المزة', label: 'المزة' },
  { value: 'كفرسوسة', label: 'كفرسوسة' },
  { value: 'المالكي', label: 'المالكي' },
  { value: 'أبو رمانة', label: 'أبو رمانة' },
  { value: 'الشعلان', label: 'الشعلان' },
  { value: 'الروضة', label: 'الروضة' },
  { value: 'العباسين', label: 'العباسين' },
  { value: 'برزة', label: 'برزة' },
  { value: 'القصور', label: 'القصور' },
  { value: 'دمر', label: 'دمر' },
  { value: 'الصحفي', label: 'الصحفي' },
  { value: 'اليرموك', label: 'اليرموك' },
  { value: 'جوبر', label: 'جوبر' },
  { value: 'الميدان', label: 'الميدان' },
  { value: 'باب توما', label: 'باب توما' },
  { value: 'القنوات', label: 'القنوات' },
  { value: 'ركن الدين', label: 'ركن الدين' },
  { value: 'سومرية', label: 'سومرية' },
  { value: 'مشروع دمر', label: 'مشروع دمر' },
  { value: 'ماروتا سيتي', label: 'ماروتا سيتي' },
  { value: 'دمر البلد', label: 'دمر البلد' },
  { value: 'الحلبوني', label: 'الحلبوني' },
  { value: 'البحصة', label: 'البحصة' }
];

var PROPERTY_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'جميع الأنواع' },
  { value: 'شقة', label: 'شقة' },
  { value: 'فيلا', label: 'فيلا' },
  { value: 'منزل', label: 'منزل' },
  { value: 'أرض', label: 'أرض' },
  { value: 'مكتب', label: 'مكتب' },
  { value: 'محل تجاري', label: 'محل تجاري' }
];

var PRICE_RANGE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'جميع الأسعار' },
  { value: '0-200000000', label: 'أقل من 200 مليون' },
  { value: '200000000-500000000', label: '200 - 500 مليون' },
  { value: '500000000-1000000000', label: '500 مليون - 1 مليار' },
  { value: '1000000000-5000000000', label: '1 - 5 مليار' },
  { value: '5000000000-9999999999999', label: 'أكثر من 5 مليار' }
];

var ROOM_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'جميع الغرف' },
  { value: '1', label: '1 غرفة' },
  { value: '2', label: '2 غرف' },
  { value: '3', label: '3 غرف' },
  { value: '4', label: '4 غرف' },
  { value: '5', label: '5 غرف' },
  { value: '6', label: '6+ غرف' }
];

// أنماط الخريطة المتاحة
var MAP_STYLES: Array<{ id: string; label: string; url: string; attr: string }> = [
  { id: 'light', label: 'فاتح', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attr: '&copy; CARTO' },
  { id: 'dark', label: 'داكن', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attr: '&copy; CARTO' },
  { id: 'satellite', label: 'فضائي', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: '&copy; Esri' },
  { id: 'streets', label: 'شوارع', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '&copy; OpenStreetMap' },
];

function formatPriceShort(price: number): string {
  if (price >= 1000000000) {
    var b = price / 1000000000;
    return (b % 1 === 0 ? b.toFixed(0) : b.toFixed(1)) + ' مليار';
  }
  if (price >= 1000000) {
    var m = price / 1000000;
    return (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)) + ' مليون';
  }
  if (price >= 1000) {
    return (price / 1000).toFixed(0) + ' ألف';
  }
  return price.toString();
}

function priceToUsd(price: number): string {
  var usd = Math.round(price / 10000);
  return '$' + usd.toLocaleString('en-US');
}

function getPriceColor(price: number): string {
  if (price < 200000000) return '#22C55E';
  if (price < 500000000) return '#EAB308';
  if (price < 1000000000) return '#F97316';
  return '#EF4444';
}

function getPriceLabel(price: number): string {
  if (price < 200000000) return 'اقتصادي';
  if (price < 500000000) return 'متوسط';
  if (price < 1000000000) return 'مرتفع';
  return 'فاخر';
}

function getPropertyTypeLabel(type: string): string {
  var labels: Record<string, string> = {
    'شقة': 'شقة', 'فيلا': 'فيلا', 'منزل': 'منزل',
    'أرض': 'أرض', 'مكتب': 'مكتب', 'محل تجاري': 'محل تجاري',
    apartment: 'شقة', villa: 'فيلا', house: 'منزل',
    land: 'أرض', office: 'مكتب', shop: 'محل تجاري'
  };
  return labels[type] || type;
}

function createMarkerIcon(price: number): L.DivIcon {
  var color = getPriceColor(price);
  var label = formatPriceShort(price);
  var markerHtml =
    '<div style="position:relative;display:flex;flex-direction:column;align-items:center">' +
      '<div style="' +
        'display:flex;align-items:center;justify-content:center;' +
        'min-width:48px;height:28px;' +
        'background:' + color + ';' +
        'border-radius:14px;padding:2px 10px;' +
        'box-shadow:0 3px 10px rgba(0,0,0,0.35);border:2px solid white' +
      '">' +
        '<span style="color:white;font-size:10px;font-weight:700;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,0.3);font-family:Cairo,sans-serif">' + label + '</span>' +
      '</div>' +
      '<div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:8px solid ' + color + ';margin-top:-1px;filter:drop-shadow(0 2px 2px rgba(0,0,0,0.2))"></div>' +
    '</div>';
  return L.divIcon({
    html: markerHtml, className: 'nazra-marker',
    iconSize: [48, 36], iconAnchor: [24, 36], popupAnchor: [0, -36]
  });
}

function MapRecenter(props: { center: [number, number]; zoom: number }) {
  var map = useMap();
  useEffect(function() {
    map.flyTo(props.center, props.zoom, { duration: 1.5 });
  }, [props.center, props.zoom, map]);
  return null;
}

function FitBoundsOnTrigger(props: { properties: Property[]; trigger: number }) {
  var map = useMap();
  useEffect(function() {
    if (props.trigger === 0 || props.properties.length === 0) return;
    if (props.properties.length === 1) {
      var p = props.properties[0];
      map.flyTo([p.latitude!, p.longitude!], 16, { duration: 1.2 });
      return;
    }
    var bounds = L.latLngBounds(props.properties.map(function(p) { return L.latLng(p.latitude!, p.longitude!); }));
    map.flyToBounds(bounds, { padding: [60, 60], duration: 1.2 });
  }, [props.trigger]);
  return null;
}

// مكون البحث على الخريطة
function MapSearchBar(props: {
  value: string;
  onChange: (v: string) => void;
  results: Property[];
  onSelect: (p: Property) => void;
}) {
  var ref = useRef<HTMLDivElement>(null);
  var s = useState(false); var isOpen = s[0]; var setIsOpen = s[1];

  useEffect(function() {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return function() { document.removeEventListener('mousedown', handleClick); };
  }, []);

  return (
    <div ref={ref} className="relative" style={{ width: '280px' }}>
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl shadow-lg"
        style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(226,232,240,0.8)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0077B6" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          type="text"
          value={props.value}
          onChange={function(e) { props.onChange(e.target.value); setIsOpen(true); }}
          onFocus={function() { setIsOpen(true); }}
          placeholder="ابحث عن عقار على الخريطة..."
          className="flex-1 bg-transparent text-xs outline-none"
          style={{ fontFamily: 'Cairo, sans-serif', color: '#1F2937' }}
        />
        {props.value && (
          <button onClick={function() { props.onChange(''); setIsOpen(false); }}
            className="text-gray-400 hover:text-gray-600" style={{ fontSize: '12px' }}>✕</button>
        )}
      </div>
      {isOpen && props.value.length >= 2 && props.results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto"
          style={{ border: '1.5px solid #E2E8F0' }} dir="rtl">
          {props.results.slice(0, 8).map(function(p) {
            return (
              <button key={p.id} onClick={function() { props.onSelect(p); setIsOpen(false); }}
                className="w-full text-right px-3 py-2.5 text-xs transition-colors hover:bg-blue-50 flex items-center gap-2"
                style={{ fontFamily: 'Cairo, sans-serif', borderBottom: '1px solid #F1F5F9', color: '#374151' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                  {p.type === 'شقة' ? '🏢' : p.type === 'فيلا' ? '🏡' : '🏠'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ color: '#001F3F' }}>{p.title}</p>
                  <p style={{ color: '#6B7280', fontSize: '10px' }}>{p.neighborhood} • {formatPriceShort(p.price)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface MapFilters { neighborhood: string; type: string; priceRange: string; rooms: string; }

export default function MapPage() {
  var navigate = useNavigate();
  var storeProperties = useStore(function(s: any) { return s.properties; });
  var mapPropsState = useState<Property[]>([]);
  var mapProperties = mapPropsState[0];
  var setMapProperties = mapPropsState[1];
  var f1 = useState(false); var filtersOpen = f1[0]; var setFiltersOpen = f1[1];
  var f2 = useState(false); var statsOpen = f2[0]; var setStatsOpen = f2[1];
  var f3 = useState<Property | null>(null); var selectedProperty = f3[0]; var setSelectedProperty = f3[1];
  var f4 = useState<MapFilters>({ neighborhood: '', type: '', priceRange: '', rooms: '' }); var mapFilters = f4[0]; var setMapFilters = f4[1];
  var f5 = useState(0); var fitBoundsTrigger = f5[0]; var setFitBoundsTrigger = f5[1];
  var f6 = useState(0); var recenterKey = f6[0]; var setRecenterKey = f6[1];
  var loadingState = useState(true); var isLoading = loadingState[0]; var setIsLoading = loadingState[1];

  // ⚠️ تحسين: شريط البحث
  var searchState = useState(''); var searchQuery = searchState[0]; var setSearchQuery = searchState[1];

  // ⚠️ تحسين: نمط الخريطة
  var styleState = useState('light'); var mapStyle = styleState[0]; var setMapStyle = styleState[1];

  useEffect(function() {
    axios.get('/api/properties', { params: { per_page: 2000 } })
      .then(function(res) {
        if (res.data && res.data.data) {
          setMapProperties(res.data.data);
        }
        setIsLoading(false);
      })
      .catch(function() { setIsLoading(false); });
  }, []);

  function parsePriceRange(range: string): [number, number] | null {
    if (!range) return null;
    var parts = range.split('-');
    if (parts.length !== 2) return null;
    return [Number(parts[0]), Number(parts[1])];
  }

  var allProperties = mapProperties.length > 0 ? mapProperties : storeProperties;

  var filteredProperties = useMemo(function() {
    return allProperties.filter(function(p: Property) {
      if (!p.latitude || !p.longitude) return false;
      if (mapFilters.neighborhood && p.neighborhood !== mapFilters.neighborhood) return false;
      if (mapFilters.type && p.type !== mapFilters.type) return false;
      if (mapFilters.rooms) {
        var t = Number(mapFilters.rooms);
        if (mapFilters.rooms === '6') { if (p.rooms < 6) return false; }
        else { if (p.rooms !== t) return false; }
      }
      if (mapFilters.priceRange) {
        var range = parsePriceRange(mapFilters.priceRange);
        if (range && (p.price < range[0] || p.price > range[1])) return false;
      }
      return true;
    });
  }, [allProperties, mapFilters]);

  // ⚠️ تحسين: نتائج البحث
  var searchResults = useMemo(function() {
    if (!searchQuery || searchQuery.length < 2) return [];
    var q = searchQuery.toLowerCase();
    return filteredProperties.filter(function(p: Property) {
      return (p.title && p.title.toLowerCase().includes(q)) ||
             (p.neighborhood && p.neighborhood.toLowerCase().includes(q)) ||
             (p.type && p.type.toLowerCase().includes(q));
    }).slice(0, 10);
  }, [searchQuery, filteredProperties]);

  var stats = useMemo(function() {
    if (filteredProperties.length === 0) return { total: 0, avgPrice: 0, minPrice: 0, maxPrice: 0, byType: {} as Record<string, number>, byNeighborhood: {} as Record<string, number>, byPriceTier: {} as Record<string, number> };
    var total = filteredProperties.length;
    var prices = filteredProperties.map(function(p: Property) { return p.price; });
    var sum = prices.reduce(function(a: number, b: number) { return a + b; }, 0);
    var avgPrice = Math.round(sum / total);
    var minPrice = Math.min.apply(null, prices);
    var maxPrice = Math.max.apply(null, prices);
    var byType: Record<string, number> = {};
    var byNeighborhood: Record<string, number> = {};
    var byPriceTier: Record<string, number> = { 'اقتصادي': 0, 'متوسط': 0, 'مرتفع': 0, 'فاخر': 0 };
    filteredProperties.forEach(function(p: Property) {
      byType[p.type] = (byType[p.type] || 0) + 1;
      byNeighborhood[p.neighborhood] = (byNeighborhood[p.neighborhood] || 0) + 1;
      byPriceTier[getPriceLabel(p.price)] = (byPriceTier[getPriceLabel(p.price)] || 0) + 1;
    });
    return { total: total, avgPrice: avgPrice, minPrice: minPrice, maxPrice: maxPrice, byType: byType, byNeighborhood: byNeighborhood, byPriceTier: byPriceTier };
  }, [filteredProperties]);

  var topNeighborhoods = useMemo(function() {
    return Object.entries(stats.byNeighborhood).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 10);
  }, [stats.byNeighborhood]);

  var topTypes = useMemo(function() {
    return Object.entries(stats.byType).sort(function(a, b) { return b[1] - a[1]; });
  }, [stats.byType]);

  function handleFilterChange(key: keyof MapFilters, value: string) {
    setMapFilters(function(prev) { var n = Object.assign({}, prev); n[key] = value; return n; });
  }
  function resetFilters() { setMapFilters({ neighborhood: '', type: '', priceRange: '', rooms: '' }); }
  function goToProperty(id: number) { navigate('/property/' + id); }
  function recenterMap() { setRecenterKey(function(k) { return k + 1; }); }
  function zoomToFit() { setFitBoundsTrigger(function(k) { return k + 1; }); }
  var hasActiveFilters = !!(mapFilters.neighborhood || mapFilters.type || mapFilters.priceRange || mapFilters.rooms);

  // ⚠️ تحسين: الانتقال لعقار من نتائج البحث
  function handleSearchSelect(p: Property) {
    setRecenterKey(function(k) { return k + 1; });
    setSelectedProperty(p);
  }

  var currentMapStyle = MAP_STYLES.find(function(s) { return s.id === mapStyle; }) || MAP_STYLES[0];

  var mapCss =
    '.nazra-marker{background:none!important;border:none!important}' +
    '.nazra-cluster{background:none!important;border:none!important}' +
    '.leaflet-popup-content-wrapper{border-radius:16px!important;padding:0!important;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.15)!important}' +
    '.leaflet-popup-content{margin:0!important;min-width:240px!important}' +
    '.leaflet-popup-tip{box-shadow:0 4px 10px rgba(0,0,0,0.1)!important}' +
    '.leaflet-popup-close-button{top:8px!important;right:8px!important;font-size:20px!important;color:white!important;z-index:10}' +
    '.leaflet-control-zoom{border-radius:12px!important;overflow:hidden;border:none!important;box-shadow:0 2px 10px rgba(0,0,0,0.15)!important}' +
    '.leaflet-control-zoom a{width:36px!important;height:36px!important;line-height:36px!important;font-size:16px!important;color:#001F3F!important;background:white!important;border:none!important}' +
    '.leaflet-control-zoom a:hover{background:#E8F4FD!important}' +
    '@keyframes nazraPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}' +
    '.nazra-marker-hover{animation:nazraPulse 0.5s ease-in-out}';

  return (
    <div className="relative" style={{ height: 'calc(100vh - 64px)' }}>
      <style>{mapCss}</style>

      {isLoading && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.8)' }}>
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-semibold" style={{ color: '#0077B6', fontFamily: 'Cairo, sans-serif' }}>جاري تحميل الخريطة...</p>
          </div>
        </div>
      )}

      <MapContainer center={DAMASCUS_CENTER} zoom={12} className="h-full w-full" zoomControl={false}
        maxBounds={[[33.40, 36.15], [33.60, 36.45]]} minZoom={10} maxZoom={18}>
        <TileLayer attribution={currentMapStyle.attr} url={currentMapStyle.url} key={currentMapStyle.id} />
        {recenterKey > 0 && <MapRecenter center={DAMASCUS_CENTER} zoom={12} />}
        <FitBoundsOnTrigger properties={filteredProperties} trigger={fitBoundsTrigger} />
        <MarkerClusterGroup chunkedLoading maxClusterRadius={60} spiderfyOnMaxZoom={true} showCoverageOnHover={false}
          iconCreateFunction={function(cluster: any) {
            var count = cluster.getChildCount();
            var size = count < 10 ? 44 : count < 50 ? 52 : 60;
            var fontSize = count < 10 ? 13 : count < 50 ? 15 : 18;
            var bgColor = count < 10 ? 'rgba(0,119,182,0.75)' : count < 50 ? 'rgba(0,119,182,0.85)' : 'rgba(0,31,63,0.9)';
            var html = '<div style="background:' + bgColor + ';color:white;border-radius:50%;width:' + size + 'px;height:' + size + 'px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:' + fontSize + 'px;border:3px solid white;box-shadow:0 3px 12px rgba(0,0,0,0.3);font-family:Cairo,sans-serif">' + count + '</div>';
            return L.divIcon({ html: html, className: 'nazra-cluster', iconSize: L.point(size, size) });
          }}>
          {filteredProperties.map(function(p: Property) {
            return (
              <Marker key={p.id} position={[p.latitude!, p.longitude!]} icon={createMarkerIcon(p.price)}
                eventHandlers={{ click: function() { setSelectedProperty(p); } }}>
                <Popup>
                  <div dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    <div style={{ position: 'relative', height: '150px', overflow: 'hidden' }}>
                      <img src={p.images && p.images.length > 0 ? p.images[0] : '/placeholder.jpg'} alt={p.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={function(e) { (e.target as HTMLImageElement).src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" fill="%23E2E8F0"><rect width="300" height="150"/><text x="150" y="80" text-anchor="middle" fill="%2394A3B8" font-size="14">' + getPropertyTypeLabel(p.type) + '</text></svg>'); }} />
                      <div style={{ position: 'absolute', top: '8px', right: '8px', background: getPriceColor(p.price), color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>{formatPriceShort(p.price)}</div>
                      <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,31,63,0.8)', color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 500 }}>{getPropertyTypeLabel(p.type)}</div>
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px 0', color: '#001F3F', lineHeight: '1.4' }}>{p.title}</h3>
                      <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 8px 0' }}>{p.neighborhood + ' - ' + (p.city || 'دمشق')}</p>
                      <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: '#374151', marginBottom: '8px' }}>
                        <span>{p.rooms} غرف</span>
                        <span>{p.area} م&#178;</span>
                        {p.bathrooms && <span>{p.bathrooms} حمام</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>{priceToUsd(p.price) + ' دولار'}</div>
                      <button onClick={function() { goToProperty(p.id); }} style={{ width: '100%', padding: '9px', background: '#0077B6', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'Cairo, sans-serif' }}
                        onMouseEnter={function(e) { (e.currentTarget as HTMLElement).style.background = '#005f8a'; }}
                        onMouseLeave={function(e) { (e.currentTarget as HTMLElement).style.background = '#0077B6'; }}>عرض التفاصيل</button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {/* ===== شريط التحكم العلوي المحسن ===== */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between pointer-events-none gap-3">
        {/* الشعار والبحث */}
        <div className="pointer-events-auto flex items-center gap-2 flex-1">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-lg shrink-0"
            style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.8)' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#0077B6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🗺️</div>
            <div>
              <h1 className="font-bold text-sm leading-tight" style={{ color: '#001F3F', fontFamily: 'Cairo, sans-serif' }}>خريطة العقارات</h1>
              <span className="text-xs" style={{ color: '#6B7280' }}>دمشق</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: '#0077B6' }}>{filteredProperties.length}</span>
          </div>

          {/* ⚠️ تحسين: شريط البحث على الخريطة */}
          <MapSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            results={searchResults}
            onSelect={handleSearchSelect}
          />
        </div>

        {/* أزرار التحكم */}
        <div className="pointer-events-auto flex gap-2 shrink-0">
          {/* ⚠️ تحسين: زر تبديل نمط الخريطة */}
          <div className="relative">
            <div className="flex gap-0.5 px-1 py-1 rounded-xl shadow-lg"
              style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.8)' }}>
              {MAP_STYLES.map(function(style) {
                var isActive = mapStyle === style.id;
                return (
                  <button key={style.id} onClick={function() { setMapStyle(style.id); }}
                    className="px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                    style={{
                      background: isActive ? '#0077B6' : 'transparent',
                      color: isActive ? 'white' : '#374151',
                      fontFamily: 'Cairo, sans-serif',
                    }}>
                    {style.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={function() { setFiltersOpen(!filtersOpen); setStatsOpen(false); }} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl shadow-lg text-sm font-semibold transition-all duration-200"
            style={{ background: filtersOpen ? '#0077B6' : 'rgba(255,255,255,0.92)', color: filtersOpen ? 'white' : '#001F3F', backdropFilter: 'blur(12px)', border: filtersOpen ? '1.5px solid #0077B6' : '1px solid rgba(255,255,255,0.8)', fontFamily: 'Cairo, sans-serif' }}>
            <span style={{ fontSize: '14px' }}>🎯</span><span className="hidden sm:inline">تصفية</span>
            {hasActiveFilters && <span className="w-2 h-2 rounded-full" style={{ background: '#FFA500' }}></span>}
          </button>
          <button onClick={function() { setStatsOpen(!statsOpen); setFiltersOpen(false); }} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl shadow-lg text-sm font-semibold transition-all duration-200"
            style={{ background: statsOpen ? '#001F3F' : 'rgba(255,255,255,0.92)', color: statsOpen ? 'white' : '#001F3F', backdropFilter: 'blur(12px)', border: statsOpen ? '1.5px solid #001F3F' : '1px solid rgba(255,255,255,0.8)', fontFamily: 'Cairo, sans-serif' }}>
            <span style={{ fontSize: '14px' }}>📊</span><span className="hidden sm:inline">إحصائيات</span>
          </button>
          <button onClick={zoomToFit} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl shadow-lg text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.92)', color: '#001F3F', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.8)', fontFamily: 'Cairo, sans-serif' }}
            title="تكبير لعرض الكل">
            <span style={{ fontSize: '14px' }}>🔍</span>
          </button>
          <button onClick={recenterMap} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl shadow-lg text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.92)', color: '#001F3F', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.8)', fontFamily: 'Cairo, sans-serif' }}
            title="إعادة للوسط">
            <span style={{ fontSize: '14px' }}>🏠</span>
          </button>
        </div>
      </div>

      {/* دليل الأسعار */}
      <div className="absolute bottom-4 left-4 z-[1000] rounded-xl shadow-lg px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.8)' }} dir="rtl">
        <p className="text-xs font-semibold mb-1.5" style={{ color: '#001F3F', fontFamily: 'Cairo, sans-serif' }}>دليل الأسعار</p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: '#22C55E' }}></span><span className="text-xs" style={{ color: '#374151' }}>اقتصادي (&lt;200M)</span></div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: '#EAB308' }}></span><span className="text-xs" style={{ color: '#374151' }}>متوسط (200-500M)</span></div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: '#F97316' }}></span><span className="text-xs" style={{ color: '#374151' }}>مرتفع (500M-1B)</span></div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: '#EF4444' }}></span><span className="text-xs" style={{ color: '#374151' }}>فاخر (&gt;1B)</span></div>
        </div>
      </div>

      {/* لوحة الفلاتر */}
      {filtersOpen && (
        <div className="absolute top-14 left-3 bottom-3 z-[1001] rounded-2xl shadow-2xl overflow-y-auto" style={{ width: '290px', background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(16px)', border: '1px solid rgba(226,232,240,0.8)', fontFamily: 'Cairo, sans-serif' }} dir="rtl">
          <div className="p-4">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2"><span style={{ fontSize: '18px' }}>🎯</span><h2 className="font-bold text-base" style={{ color: '#001F3F' }}>تصفية العقارات</h2></div>
              <button onClick={function() { setFiltersOpen(false); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600" style={{ background: '#F1F5F9', fontSize: '14px' }}>✕</button>
            </div>
            {/* Filter dropdowns - same as before */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#001F3F' }}>📍 الحي</label>
                <select value={mapFilters.neighborhood} onChange={function(e) { handleFilterChange('neighborhood', e.target.value); }}
                  className="w-full px-3 py-2.5 rounded-xl text-sm" style={{ background: mapFilters.neighborhood ? '#E8F4FD' : '#F8FAFC', border: mapFilters.neighborhood ? '1.5px solid #0077B6' : '1.5px solid #E2E8F0', fontFamily: 'Cairo, sans-serif' }}>
                  {NEIGHBORHOOD_OPTIONS.map(function(o) { return <option key={o.value} value={o.value}>{o.label}</option>; })}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#001F3F' }}>🏠 نوع العقار</label>
                <select value={mapFilters.type} onChange={function(e) { handleFilterChange('type', e.target.value); }}
                  className="w-full px-3 py-2.5 rounded-xl text-sm" style={{ background: mapFilters.type ? '#E8F4FD' : '#F8FAFC', border: mapFilters.type ? '1.5px solid #0077B6' : '1.5px solid #E2E8F0', fontFamily: 'Cairo, sans-serif' }}>
                  {PROPERTY_TYPE_OPTIONS.map(function(o) { return <option key={o.value} value={o.value}>{o.label}</option>; })}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#001F3F' }}>💰 نطاق السعر</label>
                <select value={mapFilters.priceRange} onChange={function(e) { handleFilterChange('priceRange', e.target.value); }}
                  className="w-full px-3 py-2.5 rounded-xl text-sm" style={{ background: mapFilters.priceRange ? '#E8F4FD' : '#F8FAFC', border: mapFilters.priceRange ? '1.5px solid #0077B6' : '1.5px solid #E2E8F0', fontFamily: 'Cairo, sans-serif' }}>
                  {PRICE_RANGE_OPTIONS.map(function(o) { return <option key={o.value} value={o.value}>{o.label}</option>; })}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#001F3F' }}>🛏️ عدد الغرف</label>
                <select value={mapFilters.rooms} onChange={function(e) { handleFilterChange('rooms', e.target.value); }}
                  className="w-full px-3 py-2.5 rounded-xl text-sm" style={{ background: mapFilters.rooms ? '#E8F4FD' : '#F8FAFC', border: mapFilters.rooms ? '1.5px solid #0077B6' : '1.5px solid #E2E8F0', fontFamily: 'Cairo, sans-serif' }}>
                  {ROOM_OPTIONS.map(function(o) { return <option key={o.value} value={o.value}>{o.label}</option>; })}
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <div className="mt-4 pt-3" style={{ borderTop: '1px solid #E2E8F0' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs" style={{ color: '#6B7280' }}>{filteredProperties.length + ' عقار'}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#FEF3C7', color: '#92400E' }}>فلاتر مفعلة</span>
                </div>
                <button onClick={resetFilters} className="w-full py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: '#FEF2F2', color: '#DC2626', border: '1.5px solid #FECACA', fontFamily: 'Cairo, sans-serif' }}>🔄 إعادة تعيين الفلاتر</button>
              </div>
            )}
            <div className="mt-4 pt-3" style={{ borderTop: '1px solid #E2E8F0' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#001F3F' }}>ملخص سريع</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl" style={{ background: '#EFF6FF' }}><p className="text-lg font-bold" style={{ color: '#0077B6' }}>{filteredProperties.length}</p><p className="text-xs" style={{ color: '#6B7280' }}>عقار</p></div>
                <div className="p-2.5 rounded-xl" style={{ background: '#F0FDF4' }}><p className="text-sm font-bold" style={{ color: '#16A34A' }}>{stats.avgPrice > 0 ? formatPriceShort(stats.avgPrice) : '-'}</p><p className="text-xs" style={{ color: '#6B7280' }}>متوسط السعر</p></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* لوحة الإحصائيات */}
      {statsOpen && (
        <div className="absolute top-14 right-3 bottom-3 z-[1001] rounded-2xl shadow-2xl overflow-y-auto" style={{ width: '290px', background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(16px)', border: '1px solid rgba(226,232,240,0.8)', fontFamily: 'Cairo, sans-serif' }} dir="rtl">
          <div className="p-4">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2"><span style={{ fontSize: '18px' }}>📊</span><h2 className="font-bold text-base" style={{ color: '#001F3F' }}>إحصائيات الخريطة</h2></div>
              <button onClick={function() { setStatsOpen(false); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600" style={{ background: '#F1F5F9', fontSize: '14px' }}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-5">
              <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' }}><p className="text-2xl font-bold" style={{ color: '#0077B6' }}>{stats.total}</p><p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>عقار متوفر</p></div>
              <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)' }}><p className="text-sm font-bold" style={{ color: '#16A34A' }}>{stats.avgPrice > 0 ? formatPriceShort(stats.avgPrice) : '-'}</p><p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>متوسط السعر</p></div>
              <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)' }}><p className="text-xs font-bold" style={{ color: '#D97706' }}>{stats.minPrice > 0 ? formatPriceShort(stats.minPrice) : '-'}</p><p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>أقل سعر</p></div>
              <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, #FEF2F2, #FECACA)' }}><p className="text-xs font-bold" style={{ color: '#DC2626' }}>{stats.maxPrice > 0 ? formatPriceShort(stats.maxPrice) : '-'}</p><p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>أعلى سعر</p></div>
            </div>
            <div className="mb-5">
              <p className="text-sm font-semibold mb-2" style={{ color: '#001F3F' }}>💰 توزيع الأسعار</p>
              <div className="space-y-2">
                {[{ key: 'اقتصادي', color: '#22C55E' }, { key: 'متوسط', color: '#EAB308' }, { key: 'مرتفع', color: '#F97316' }, { key: 'فاخر', color: '#EF4444' }].map(function(tier) {
                  var count = stats.byPriceTier[tier.key] || 0;
                  var percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <div key={tier.key} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: tier.color }}></span>
                      <span className="text-xs flex-1" style={{ color: '#374151' }}>{tier.key}</span>
                      <span className="text-xs font-semibold" style={{ color: tier.color }}>{count}</span>
                      <div className="w-16 h-1.5 rounded-full" style={{ background: '#E2E8F0' }}><div className="h-full rounded-full" style={{ width: percent + '%', background: tier.color }}></div></div>
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>{percent}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mb-5">
              <p className="text-sm font-semibold mb-2" style={{ color: '#001F3F' }}>🏠 حسب النوع</p>
              <div className="space-y-2">
                {topTypes.map(function(entry) {
                  var typeKey = entry[0]; var count = entry[1];
                  var percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <div key={typeKey} className="flex items-center gap-2">
                      <span className="text-xs flex-1" style={{ color: '#374151' }}>{typeKey}</span>
                      <span className="text-xs font-semibold" style={{ color: '#0077B6' }}>{count}</span>
                      <div className="w-16 h-1.5 rounded-full" style={{ background: '#E2E8F0' }}><div className="h-full rounded-full" style={{ width: percent + '%', background: '#0077B6' }}></div></div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2" style={{ color: '#001F3F' }}>📍 أكثر الأحياء</p>
              <div className="space-y-1.5">
                {topNeighborhoods.map(function(entry, index) {
                  var name = entry[0]; var count = entry[1];
                  var percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  var barColor = index === 0 ? '#FFA500' : '#0077B6';
                  return (
                    <div key={name} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: index < 3 ? barColor : '#94A3B8' }}>{index + 1}</span>
                      <span className="text-xs flex-1" style={{ color: '#374151' }}>{name}</span>
                      <span className="text-xs font-semibold" style={{ color: barColor }}>{count}</span>
                      <div className="w-12 h-1.5 rounded-full" style={{ background: '#E2E8F0' }}><div className="h-full rounded-full" style={{ width: percent + '%', background: barColor }}></div></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* بطاقة العقار المحدد */}
      {selectedProperty && (function() {
        var prop = selectedProperty;
        return (
          <div className="absolute bottom-3 right-3 left-3 z-[1001] md:left-auto md:w-[360px]" dir="rtl">
            <div className="rounded-2xl shadow-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px)', border: '1px solid rgba(226,232,240,0.8)', fontFamily: 'Cairo, sans-serif' }}>
              <div className="flex">
                <div style={{ width: '130px', height: '130px', flexShrink: 0, overflow: 'hidden' }}>
                  <img src={prop.images && prop.images.length > 0 ? prop.images[0] : '/placeholder.jpg'} alt={prop.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={function(e) { (e.target as HTMLImageElement).src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="130" height="130" fill="%23E2E8F0"><rect width="130" height="130"/><text x="65" y="70" text-anchor="middle" fill="%2394A3B8" font-size="30">🏠</text></svg>'); }} />
                </div>
                <div className="flex-1 p-3 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm leading-tight truncate" style={{ color: '#001F3F' }}>{prop.title}</h3>
                    <button onClick={function() { setSelectedProperty(null); }} className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#F1F5F9', color: '#9CA3AF', fontSize: '12px' }}>✕</button>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{prop.neighborhood}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="px-2 py-0.5 rounded-lg text-xs font-bold text-white" style={{ background: getPriceColor(prop.price) }}>{formatPriceShort(prop.price)}</span>
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>{priceToUsd(prop.price)}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: '#6B7280' }}>
                    <span>{prop.rooms} غرف</span>
                    <span>{prop.area} م&#178;</span>
                    <span>{getPropertyTypeLabel(prop.type)}</span>
                  </div>
                  <button onClick={function() { goToProperty(prop.id); }} className="w-full mt-2 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{ background: '#0077B6', fontFamily: 'Cairo, sans-serif' }}
                    onMouseEnter={function(e) { (e.currentTarget as HTMLElement).style.background = '#005f8a'; }}
                    onMouseLeave={function(e) { (e.currentTarget as HTMLElement).style.background = '#0077B6'; }}>عرض التفاصيل</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
