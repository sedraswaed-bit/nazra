

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, User, Building2, Clock, Send, Loader2, ChevronLeft, Mail } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatDate } from '../helpers';
import type { Message } from '../types';

export default function OwnerMessagesPage() {
  const { user, addNotification } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'الرسائل - نظرة';
    loadMessages();
  }, []);

  async function loadMessages() {
    setLoading(true);
    try {
      const token = localStorage.getItem('nazra_token');
      const res = await fetch('/api/owner/messages', {
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.data || data.messages || []);
      }
    } catch {
      addNotification('فشل تحميل الرسائل', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleReply() {
    if (!selectedMsg || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const token = localStorage.getItem('nazra_token');
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiver_id: selectedMsg.sender_id,
          property_id: selectedMsg.property_id,
          parent_id: selectedMsg.id,
          body: replyText,
        }),
      });
      if (!res.ok) throw new Error();
      addNotification('تم إرسال الرد', 'success');
      setReplyText('');
      loadMessages();
    } catch {
      addNotification('فشل إرسال الرد', 'error');
    } finally {
      setSendingReply(false);
    }
  }

  // تحديد كرسالة مقروءة - Mark as read
  async function markAsRead(msg: Message) {
    if (msg.is_read) return;
    try {
      const token = localStorage.getItem('nazra_token');
      await fetch(`/api/messages/${msg.id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setMessages((prev) =>
        prev.map((m) => m.id === msg.id ? { ...m, is_read: true } : m)
      );
    } catch {
      // صامت
    }
  }

  // عرض تفاصيل الرسالة - View message detail
  function openMessage(msg: Message) {
    setSelectedMsg(msg);
    markAsRead(msg);
  }

  const unreadCount = messages.filter((m) => !m.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin text-nazra-blue" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-nazra-navy flex items-center gap-2">
            <MessageSquare className="text-nazra-blue" size={24} />
            الرسائل
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} رسالة غير مقروءة` : 'لا رسائل جديدة'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 min-h-[500px]">
        {/* قائمة الرسائل - Message list */}
        <div className="md:col-span-2 card overflow-hidden">
          <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
            {messages.length > 0 ? (
              messages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => openMessage(msg)}
                  className={`w-full p-4 text-right hover:bg-gray-50 transition-colors ${
                    selectedMsg?.id === msg.id ? 'bg-nazra-blue/5' : ''
                  } ${!msg.is_read ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                      <User size={16} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-sm ${!msg.is_read ? 'font-bold text-gray-800' : 'font-medium text-gray-700'}`}>
                          {msg.sender?.name || 'مستخدم'}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(msg.created_at)}</span>
                      </div>
                      {msg.subject && (
                        <p className="text-xs text-gray-500 mb-0.5 truncate">{msg.subject}</p>
                      )}
                      <p className="text-xs text-gray-400 truncate">{msg.body}</p>
                      {msg.property && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-nazra-blue">
                          <Building2 size={10} />
                          {msg.property.title}
                        </div>
                      )}
                    </div>
                    {!msg.is_read && (
                      <div className="w-2 h-2 rounded-full bg-nazra-blue shrink-0 mt-2" />
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400">
                <Mail size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">لا توجد رسائل</p>
              </div>
            )}
          </div>
        </div>

        {/* تفاصيل الرسالة - Message detail */}
        <div className="md:col-span-3 card p-5">
          {selectedMsg ? (
            <div>
              {/* رأس الرسالة */}
              <div className="border-b border-gray-100 pb-4 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-nazra-blue/10 flex items-center justify-center">
                    {selectedMsg.sender?.avatar ? (
                      <img src={selectedMsg.sender.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <User size={18} className="text-nazra-blue" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{selectedMsg.sender?.name || 'مستخدم'}</div>
                    <div className="text-xs text-gray-400">{formatDate(selectedMsg.created_at)}</div>
                  </div>
                </div>
                {selectedMsg.subject && (
                  <h3 className="font-semibold text-gray-700">{selectedMsg.subject}</h3>
                )}
                {selectedMsg.property && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-nazra-blue">
                    <Building2 size={12} />
                    بخصوص: {selectedMsg.property.title}
                  </div>
                )}
              </div>

              {/* محتوى الرسالة */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedMsg.body}</p>
              </div>

              {/* الردود */}
              {selectedMsg.replies && selectedMsg.replies.length > 0 && (
                <div className="space-y-3 mb-4">
                  <h4 className="text-sm font-medium text-gray-600">الردود</h4>
                  {selectedMsg.replies.map((reply) => (
                    <div key={reply.id} className="bg-nazra-blue/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-700">
                          {reply.sender?.name || (reply.sender_id === user?.id ? 'أنت' : 'مستخدم')}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(reply.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-600">{reply.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* نموذج الرد */}
              <div className="border-t border-gray-100 pt-4">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="اكتب ردك..."
                  rows={3}
                  className="input-field resize-none text-sm mb-2"
                />
                <button
                  onClick={handleReply}
                  disabled={sendingReply || !replyText.trim()}
                  className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5"
                >
                  {sendingReply ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  إرسال الرد
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <MessageSquare size={40} className="mx-auto mb-2 opacity-50" />
                <p>اختر رسالة لعرضها</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
