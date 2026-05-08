

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Send, Loader2, User } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatDate } from '../helpers';
import type { Review } from '../types';

interface ReviewSectionProps {
  propertyId: number;
  reviews: Review[];
  averageRating: number;
  reviewsCount: number;
}

export default function ReviewSection({ propertyId, reviews, averageRating, reviewsCount }: ReviewSectionProps) {
  const { isAuthenticated, user, addNotification, setShowLoginModal } = useStore();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // توزيع التقييمات - Rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Math.round(r.rating) === star).length;
    const pct = reviewsCount > 0 ? (count / reviewsCount) * 100 : 0;
    return { star, count, pct };
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    if (rating === 0) {
      addNotification('اختر التقييم أولاً', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // ⚠️ إصلاح: الـ endpoint الصحيح هو /api/reviews مش /api/properties/{id}/reviews
      const token = localStorage.getItem('nazra_token');
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ property_id: propertyId, rating, comment }),
      });
      if (!res.ok) throw new Error('فشل إرسال التقييم');
      addNotification('تم إرسال التقييم بنجاح', 'success');
      setRating(0);
      setComment('');
    } catch {
      addNotification('فشل إرسال التقييم', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ملخص التقييمات - Rating summary */}
      <div className="flex flex-col sm:flex-row gap-6 p-5 bg-gray-50 rounded-xl">
        {/* المعدل - Average */}
        <div className="text-center sm:text-center sm:min-w-[120px]">
          <div className="text-4xl font-bold text-nazra-navy">{averageRating.toFixed(1)}</div>
          <div className="flex items-center justify-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={16}
                className={s <= Math.round(averageRating) ? 'text-nazra-orange' : 'text-gray-300'}
                fill={s <= Math.round(averageRating) ? 'currentColor' : 'none'}
              />
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-1">{reviewsCount} تقييم</div>
        </div>

        {/* التوزيع - Distribution */}
        <div className="flex-1 space-y-1.5">
          {ratingDistribution.map(({ star, count, pct }) => (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-4 text-gray-500 text-center">{star}</span>
              <Star size={12} className="text-nazra-orange" fill="currentColor" />
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-nazra-orange h-2 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-6 text-left">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* إضافة تقييم - Add review */}
      <div className="card p-5">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <MessageSquare size={16} />
          أضف تقييمك
        </h4>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* اختيار النجوم - Star selection */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                onMouseEnter={() => setHoveredStar(s)}
                onMouseLeave={() => setHoveredStar(0)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  size={24}
                  className={
                    s <= (hoveredStar || rating)
                      ? 'text-nazra-orange'
                      : 'text-gray-300'
                  }
                  fill={s <= (hoveredStar || rating) ? 'currentColor' : 'none'}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="text-sm text-gray-500 mr-2">
                {['', 'سيء', 'مقبول', 'جيد', 'جيد جداً', 'ممتاز'][rating]}
              </span>
            )}
          </div>

          {/* التعليق - Comment */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="شاركنا رأيك في هذا العقار... (اختياري)"
            rows={3}
            className="input-field resize-none text-sm"
          />

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary text-sm py-2 px-5 flex items-center gap-1.5"
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {submitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
          </button>
        </form>
      </div>

      {/* قائمة التقييمات - Reviews list */}
      <div className="space-y-3">
        {reviews.length > 0 ? (
          reviews.map((review, idx) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="card p-4"
            >
              <div className="flex items-start gap-3">
                {/* صورة المستخدم - User avatar */}
                <div className="w-9 h-9 rounded-full bg-nazra-blue/10 flex items-center justify-center shrink-0">
                  {review.user?.avatar ? (
                    <img src={review.user.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <User size={16} className="text-nazra-blue" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800">
                      {review.user?.name || 'مستخدم'}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
                  </div>

                  {/* النجوم */}
                  <div className="flex items-center gap-0.5 mb-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        className={s <= review.rating ? 'text-nazra-orange' : 'text-gray-300'}
                        fill={s <= review.rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>

                  {/* التعليق */}
                  {review.comment && (
                    <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">
            لا توجد تقييمات بعد. كن أول من يقيّم!
          </div>
        )}
      </div>
    </div>
  );
}
