

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Heart, GitCompare, MapPin, BedDouble, Bath, Maximize2,
  Building2, Calendar, Compass, Star, Eye, Phone, Mail, MessageSquare,
  ChevronRight, ChevronLeft, Share2, Sparkles, AlertCircle, X,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import PropertyCard from '../components/PropertyCard';
import ReviewSection from '../components/ReviewSection';
import {
  formatPrice, formatArea, priceToUsd, formatDate,
  propertyTypeNames, featureLabels, propertyStatusNames, propertyStatusColors,
} from '../helpers';
import type { Property } from '../types';

export default function PropertyDetailPage() {
  var params = useParams<{ id: string }>();
  var id = params.id;
  var navigate = useNavigate();
  var store = useStore();
  var property = store.currentProperty;
  var similarProperties = store.similarProperties;
  var isLoading = store.isLoading;
  var fetchProperty = store.fetchProperty;
  var toggleFavorite = store.toggleFavorite;
  var isFavorite = store.isFavorite;
  var toggleComparison = store.toggleComparison;
  var comparisonIds = store.comparisonIds;
  var clearComparison = store.clearComparison;
  var isAuthenticated = store.isAuthenticated;
  var setShowLoginModal = store.setShowLoginModal;
  var addNotification = store.addNotification;

  var activeImgState = useState(0);
  var activeImg = activeImgState[0];
  var setActiveImg = activeImgState[1];
  var contactMsgState = useState('');
  var contactMsg = contactMsgState[0];
  var setContactMsg = contactMsgState[1];
  var sendingMsgState = useState(false);
  var sendingMsg = sendingMsgState[0];
  var setSendingMsg = sendingMsgState[1];

  // تحميل العقار - Load property
  useEffect(function() {
    if (id) {
      fetchProperty(Number(id));
      setActiveImg(0);
    }
  }, [id, fetchProperty]);

  // عنوان الصفحة - Page title
  useEffect(function() {
    if (property) {
      document.title = property.title + ' - نظرة';
    }
  }, [property]);

  // إرسال رسالة للمالك - Contact owner
  async function handleContact() {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    if (!contactMsg.trim()) {
      addNotification('اكتب رسالتك أولاً', 'error');
      return;
    }

    setSendingMsg(true);
    try {
      // ⚠️ إصلاح: الـ endpoint الصحيح هو /api/messages مش /api/properties/{id}/contact
      var token = localStorage.getItem('nazra_token');
      var res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + (token || ''),
        },
        body: JSON.stringify({
          receiver_id: property!.owner?.id,
          property_id: property!.id,
          body: contactMsg,
        }),
      });
      if (!res.ok) throw new Error();
      addNotification('تم إرسال رسالتك للمالك', 'success');
      setContactMsg('');
    } catch(e) {
      addNotification('فشل إرسال الرسالة', 'error');
    } finally {
      setSendingMsg(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin w-8 h-8 border-4 border-nazra-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-32 text-gray-400">
        <AlertCircle size={48} className="mx-auto mb-3" />
        <p className="text-lg">العقار غير موجود</p>
        <Link to="/properties" className="text-nazra-blue text-sm mt-2 inline-block hover:underline">
          العودة للعقارات
        </Link>
      </div>
    );
  }

  var images = property.images && property.images.length > 0 ? property.images : [];
  var fav = isFavorite(property.id);
  var inCompare = comparisonIds.includes(property.id);
  var features = Object.entries(featureLabels).filter(function(entry) { return (property as any)[entry[0]]; });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* مسار التنقل - Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link to="/" className="hover:text-nazra-blue">الرئيسية</Link>
        <ChevronLeft size={14} />
        <Link to="/properties" className="hover:text-nazra-blue">العقارات</Link>
        <ChevronLeft size={14} />
        <span className="text-gray-600 truncate max-w-[200px]">{property.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* العمود الرئيسي - Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* معرض الصور - Image gallery */}
          <div className="card overflow-hidden">
            {images.length > 0 ? (
              <>
                <div className="relative aspect-[16/9] bg-gray-100">
                  <img
                    src={images[activeImg]}
                    alt={property.title + ' - صورة ' + (activeImg + 1)}
                    className="w-full h-full object-cover"
                  />

                  {/* أزرار التنقل - Navigation arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={function() { setActiveImg(function(prev) { return (prev + 1) % images.length; }); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={function() { setActiveImg(function(prev) { return (prev - 1 + images.length) % images.length; }); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}

                  {/* عداد الصور */}
                  <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    {activeImg + 1} / {images.length}
                  </div>
                </div>

                {/* صور مصغرة - Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto">
                    {images.map(function(img, idx) {
                      return (
                        <button
                          key={idx}
                          onClick={function() { setActiveImg(idx); }}
                          className={idx === activeImg
                            ? 'shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 border-nazra-blue transition-colors'
                            : 'shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 border-transparent opacity-60 hover:opacity-100 transition-colors'
                          }
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-[16/9] bg-gray-100 flex items-center justify-center text-gray-300">
                <Building2 size={64} />
              </div>
            )}
          </div>

          {/* معلومات العقار - Property info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            {/* الرأس */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={propertyStatusColors[property.status]}>{propertyStatusNames[property.status]}</span>
                  <span className="badge-blue">{propertyTypeNames[property.type]}</span>
                </div>
                <h1 className="text-xl font-bold text-gray-800">{property.title}</h1>
              </div>

              {/* ✅ أزرار المفضلة والمقارنة محسّنة */}
              <div className="flex items-center gap-2">
                <button
                  onClick={function() { toggleFavorite(property.id); }}
                  className={fav
                    ? 'p-2 rounded-lg border bg-red-50 border-red-200 text-red-500 transition-colors'
                    : 'p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 transition-colors'
                  }
                  title={fav ? 'إزالة من المفضلة' : 'أضف للمفضلة'}
                >
                  <Heart size={18} fill={fav ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={function() { toggleComparison(property.id); }}
                  className={inCompare
                    ? 'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium bg-nazra-blue text-white border-nazra-blue transition-colors'
                    : 'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium border-gray-200 text-gray-600 hover:border-nazra-blue hover:text-nazra-blue transition-colors'
                  }
                  title={inCompare ? 'إزالة من المقارنة' : 'أضف للمقارنة'}
                >
                  <GitCompare size={16} />
                  <span>{inCompare ? 'في المقارنة' : 'قارن'}</span>
                </button>
              </div>
            </div>

            {/* السعر */}
            <div className="flex items-baseline gap-3 mb-5">
              <span className="text-2xl font-bold text-nazra-blue">{formatPrice(property.price)}</span>
              <span className="text-sm text-gray-400">{priceToUsd(property.price)}</span>
            </div>

            {/* الموقع */}
            <div className="flex items-center gap-1.5 text-gray-500 mb-5">
              <MapPin size={16} className="text-nazra-blue" />
              <span>{property.city}، {property.neighborhood}{property.address ? '، ' + property.address : ''}</span>
            </div>

            {/* المواصفات الأساسية */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl mb-5">
              <div className="text-center">
                <Maximize2 className="mx-auto text-nazra-blue mb-1" size={20} />
                <div className="text-sm font-bold text-gray-800">{formatArea(property.area)}</div>
                <div className="text-xs text-gray-400">المساحة</div>
              </div>
              <div className="text-center">
                <BedDouble className="mx-auto text-nazra-blue mb-1" size={20} />
                <div className="text-sm font-bold text-gray-800">{property.rooms}</div>
                <div className="text-xs text-gray-400">غرف</div>
              </div>
              <div className="text-center">
                <Bath className="mx-auto text-nazra-blue mb-1" size={20} />
                <div className="text-sm font-bold text-gray-800">{property.bathrooms}</div>
                <div className="text-xs text-gray-400">حمامات</div>
              </div>
              {property.floor && (
                <div className="text-center">
                  <Building2 className="mx-auto text-nazra-blue mb-1" size={20} />
                  <div className="text-sm font-bold text-gray-800">الطابق {property.floor}</div>
                  <div className="text-xs text-gray-400">الطابق</div>
                </div>
              )}
            </div>

            {/* التفاصيل الإضافية */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-5">
              {property.direction && (
                <div className="flex items-center gap-2">
                  <Compass size={14} className="text-gray-400" />
                  <span className="text-gray-500">الاتجاه:</span>
                  <span className="font-medium text-gray-700">{property.direction}</span>
                </div>
              )}
              {property.year_built && (
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" />
                  <span className="text-gray-500">سنة البناء:</span>
                  <span className="font-medium text-gray-700">{property.year_built}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Eye size={14} className="text-gray-400" />
                <span className="text-gray-500">المشاهدات:</span>
                <span className="font-medium text-gray-700">{property.views_count}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star size={14} className="text-gray-400" />
                <span className="text-gray-500">التقييم:</span>
                <span className="font-medium text-gray-700">
                  {property.average_rating ? property.average_rating.toFixed(1) + '/5' : 'لا تقييم'}
                </span>
              </div>
            </div>

            {/* المميزات */}
            {features.length > 0 && (
              <div className="mb-5">
                <h3 className="font-semibold text-gray-700 mb-2">المميزات</h3>
                <div className="flex flex-wrap gap-2">
                  {features.map(function(entry) {
                    return <span key={entry[0]} className="badge-green">{entry[1]}</span>;
                  })}
                </div>
              </div>
            )}

            {/* الوصف */}
            {property.description && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">الوصف</h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{property.description}</p>
              </div>
            )}
          </motion.div>

          {/* التقدير الذكي - AI Estimate */}
          {property.ai_price_estimate && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="text-nazra-orange" size={18} />
                <h3 className="font-semibold text-gray-800">التقدير الذكي للسعر</h3>
              </div>
              <div className="flex items-center gap-4 p-4 bg-nazra-blue/5 rounded-xl">
                <div>
                  <div className="text-xs text-gray-500">السعر المقدر</div>
                  <div className="text-xl font-bold text-nazra-blue">{formatPrice(property.ai_price_estimate)}</div>
                </div>
                <div className="flex-1">
                  {property.ai_confidence && (
                    <div className="text-xs text-gray-500">نسبة الثقة: {Math.round(property.ai_confidence * 100)}%</div>
                  )}
                  {property.ai_explanation && (
                    <p className="text-xs text-gray-600 mt-1">{property.ai_explanation}</p>
                  )}
                </div>
                <div className={Math.abs(property.ai_price_estimate - property.price) / property.price < 0.1
                  ? 'text-sm font-medium px-3 py-1 rounded-full bg-green-100 text-green-700'
                  : 'text-sm font-medium px-3 py-1 rounded-full bg-orange-100 text-orange-700'
                }>
                  {Math.abs(property.ai_price_estimate - property.price) / property.price < 0.1
                    ? 'سعر معقول'
                    : 'قد يكون مغالاة'}
                </div>
              </div>
            </motion.div>
          )}

          {/* التقييمات - Reviews */}
          <div>
            <h3 className="font-semibold text-gray-800 text-lg mb-4">التقييمات</h3>
            <ReviewSection
              propertyId={property.id}
              reviews={property.reviews || []}
              averageRating={property.average_rating || 0}
              reviewsCount={property.reviews_count || 0}
            />
          </div>
        </div>

        {/* العمود الجانبي - Sidebar */}
        <div className="space-y-5">
          {/* معلومات المالك - Owner info */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-3">مالك العقار</h3>
            {property.owner ? (
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-nazra-blue/10 flex items-center justify-center">
                  {property.owner.avatar ? (
                    <img src={property.owner.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <span className="text-nazra-blue font-bold">{property.owner.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-800">{property.owner.name}</div>
                  <div className="text-xs text-gray-400">
                    عضو منذ {new Date(property.owner.created_at).getFullYear()}
                    {property.owner.is_verified && ' • موثوق ✓'}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-4">معلومات المالك غير متاحة</p>
            )}

            {/* نموذج التواصل */}
            <div className="space-y-2">
              <textarea
                value={contactMsg}
                onChange={function(e) { setContactMsg(e.target.value); }}
                placeholder="اكتب رسالتك للمالك..."
                rows={3}
                className="input-field resize-none text-sm"
              />
              <button
                onClick={handleContact}
                disabled={sendingMsg}
                className="w-full btn-primary py-2.5 flex items-center justify-center gap-1.5 text-sm"
              >
                <MessageSquare size={15} />
                {sendingMsg ? 'جاري الإرسال...' : 'تواصل مع المالك'}
              </button>
            </div>
          </div>

          {/* عقارات مشابهة - Similar properties */}
          {similarProperties.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">عقارات مشابهة</h3>
              <div className="space-y-3">
                {similarProperties.slice(0, 3).map(function(sp) {
                  return (
                    <Link
                      key={sp.id}
                      to={'/property/' + sp.id}
                      className="card p-3 flex items-center gap-3 group"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {sp.images && sp.images[0] ? (
                          <img src={sp.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Building2 size={18} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-700 group-hover:text-nazra-blue truncate transition-colors">
                          {sp.title}
                        </p>
                        <p className="text-xs text-gray-400">{sp.city}، {sp.neighborhood}</p>
                        <p className="text-sm font-bold text-nazra-blue mt-0.5">{formatPrice(sp.price)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ✅ شريط المقارنة العائم - Floating comparison bar */}
      {comparisonIds.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-lg z-50 py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitCompare className="text-nazra-blue" size={20} />
              <span className="text-sm font-medium text-gray-700">
                {'تم اختيار ' + comparisonIds.length + ' عقار للمقارنة'}
              </span>
              <div className="flex items-center gap-1">
                {comparisonIds.map(function(cid) {
                  return (
                    <span key={cid} className="w-7 h-7 rounded-full bg-nazra-blue/10 text-nazra-blue text-xs font-bold flex items-center justify-center">
                      {cid}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={function() { clearComparison(); }}
                className="text-xs text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <X size={12} />
                إزالة الكل
              </button>
              <Link
                to="/compare"
                className={comparisonIds.length >= 2
                  ? 'flex items-center gap-1.5 px-4 py-2 bg-nazra-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors'
                  : 'flex items-center gap-1.5 px-4 py-2 bg-nazra-blue/50 text-white rounded-lg text-sm font-medium cursor-not-allowed pointer-events-none'
                }
              >
                <GitCompare size={14} />
                {'مقارنة (' + comparisonIds.length + ')'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}