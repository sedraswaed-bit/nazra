

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import type { User, Property, SearchFilters, PriceEstimate, SmartSearchResult } from '../types';

// واجهة المخزن
interface AppState {
  // المصادقة
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // العقارات
  properties: Property[];
  currentProperty: Property | null;
  similarProperties: Property[];
  totalCount: number;
  currentPage: number;
  filters: SearchFilters;

  // المفضلات
  favorites: number[];

  // الذكاء الاصطناعي
  priceEstimate: PriceEstimate | null;
  smartSearchResults: SmartSearchResult | null;
  isAiLoading: boolean;

  // المقارنة
  comparisonIds: number[];

  // الإشعارات
  notifications: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>;

  // النوافذ المنبثقة
  showLoginModal: boolean;
  showRegisterModal: boolean;
  showAddPropertyModal: boolean;

  // الإجراءات
  // المصادقة
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  checkAuth: () => Promise<void>;

  // العقارات
  fetchProperties: (filters?: SearchFilters) => Promise<void>;
  fetchProperty: (id: number) => Promise<void>;
  addProperty: (data: FormData) => Promise<void>;
  updateProperty: (id: number, data: Partial<Property>) => Promise<void>;
  deleteProperty: (id: number) => Promise<void>;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;

  // المفضلات
  fetchFavorites: () => Promise<void>;
  toggleFavorite: (propertyId: number) => void;
  isFavorite: (propertyId: number) => boolean;

  // الذكاء الاصطناعي
  estimatePrice: (data: any) => Promise<void>;
  smartSearch: (query: string) => Promise<void>;
  fetchRecommendations: (propertyId?: number) => Promise<void>;

  // المقارنة
  toggleComparison: (propertyId: number) => void;
  clearComparison: () => void;

  // النوافذ المنبثقة
  setShowLoginModal: (show: boolean) => void;
  setShowRegisterModal: (show: boolean) => void;
  setShowAddPropertyModal: (show: boolean) => void;

  // الإشعارات
  addNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeNotification: (id: string) => void;
}

// بيانات التسجيل
interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  role?: 'user' | 'owner';
  city?: string;
  neighborhood?: string;
}

// إعداد axios
var api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// إضافة التوكن لكل طلب
api.interceptors.request.use(function(config) {
  var token = localStorage.getItem('nazra_token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  // إزالة Content-Type عند FormData ليحدد المتصفح boundary تلقائياً
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// دالة تنظيف الفلاتر
function cleanFilters(filters: any): any {
  var cleaned: any = {};
  Object.keys(filters).forEach(function(key) {
    var val = filters[key];
    if (val !== null && val !== undefined && val !== '') {
      cleaned[key] = val;
    }
  });
  return cleaned;
}

// إنشاء المخزن
export var useStore = create<AppState>()(
  persist(
    function(set, get) {
      return {
        // القيم الابتدائية
        user: null,
        token: localStorage.getItem('nazra_token'),
        isAuthenticated: !!localStorage.getItem('nazra_token'),
        isLoading: false,

        properties: [],
        currentProperty: null,
        similarProperties: [],
        totalCount: 0,
        currentPage: 1,
        filters: {},

        favorites: [],

        priceEstimate: null,
        smartSearchResults: null,
        isAiLoading: false,

        comparisonIds: [],

        notifications: [],

        showLoginModal: false,
        showRegisterModal: false,
        showAddPropertyModal: false,

        // إجراءات المصادقة
        login: function(email, password) {
          set({ isLoading: true });
          return api.post('/login', { email: email, password: password })
            .then(function(res) {
              var user = res.data.user;
              var token = res.data.token;
              localStorage.setItem('nazra_token', token);
              set({ user: user, token: token, isAuthenticated: true, isLoading: false, showLoginModal: false });
              get().addNotification('تم تسجيل الدخول بنجاح', 'success');
            })
            .catch(function(err) {
              set({ isLoading: false });
              var msg = 'فشل تسجيل الدخول';
              if (err.response && err.response.data && err.response.data.message) {
                msg = err.response.data.message;
              }
              get().addNotification(msg, 'error');
              throw err;
            });
        },

        register: function(data) {
          set({ isLoading: true });
          return api.post('/register', data)
            .then(function(res) {
              var user = res.data.user;
              var token = res.data.token;
              localStorage.setItem('nazra_token', token);
              set({ user: user, token: token, isAuthenticated: true, isLoading: false, showRegisterModal: false });
              get().addNotification('تم إنشاء الحساب بنجاح', 'success');
            })
            .catch(function(err) {
              set({ isLoading: false });
              var msg = 'فشل إنشاء الحساب';
              if (err.response && err.response.data && err.response.data.message) {
                msg = err.response.data.message;
              }
              get().addNotification(msg, 'error');
              throw err;
            });
        },

        logout: function() {
          api.post('/logout').catch(function() {});
          localStorage.removeItem('nazra_token');
          set({ user: null, token: null, isAuthenticated: false, favorites: [] });
          get().addNotification('تم تسجيل الخروج', 'info');
        },

        setUser: function(user) { set({ user: user }); },

        // التحقق من المصادقة عند تحميل الصفحة
        checkAuth: function() {
          var token = localStorage.getItem('nazra_token');
          if (!token) {
            set({ user: null, token: null, isAuthenticated: false });
            return Promise.resolve();
          }
          return api.get('/me')
            .then(function(res) {
              set({
                user: res.data.user,
                isAuthenticated: true,
              });
            })
            .catch(function() {
              // التوكن غير صالح
              localStorage.removeItem('nazra_token');
              set({ user: null, token: null, isAuthenticated: false, favorites: [] });
            });
        },

        // إجراءات العقارات
        fetchProperties: function(filters) {
          set({ isLoading: true });
          var rawParams = filters || get().filters;
          // تنظيف الباراميترات قبل الإرسال
          var params = cleanFilters(rawParams);
          return api.get('/properties', { params: params })
            .then(function(res) {
              set({
                properties: res.data.data,
                totalCount: res.data.total,
                currentPage: res.data.current_page,
                isLoading: false,
              });
            })
            .catch(function(err) {
              set({ isLoading: false });
            });
        },

        fetchProperty: function(id) {
          set({ isLoading: true, currentProperty: null });
          return api.get('/properties/' + id)
            .then(function(res) {
              set({
                currentProperty: res.data.property,
                similarProperties: res.data.similar || [],
                isLoading: false,
              });
            })
            .catch(function(err) {
              set({ isLoading: false });
            });
        },

        addProperty: function(data) {
          set({ isLoading: true });
          return api.post('/owner/properties', data)
            .then(function() {
              set({ isLoading: false, showAddPropertyModal: false });
              get().addNotification('تم إضافة العقار بنجاح، بانتظار المراجعة', 'success');
              get().fetchProperties();
            })
            .catch(function(err) {
              set({ isLoading: false });
              var msg = 'فشل إضافة العقار';
              if (err.response && err.response.data && err.response.data.message) {
                msg = err.response.data.message;
              }
              get().addNotification(msg, 'error');
              throw err;
            });
        },

        updateProperty: function(id, data) {
          return api.put('/owner/properties/' + id, data)
            .then(function() {
              get().addNotification('تم تحديث العقار', 'success');
              get().fetchProperties();
            })
            .catch(function(err) {
              get().addNotification('فشل تحديث العقار', 'error');
            });
        },

        deleteProperty: function(id) {
          return api.delete('/owner/properties/' + id)
            .then(function() {
              get().addNotification('تم حذف العقار', 'success');
              get().fetchProperties();
            })
            .catch(function(err) {
              get().addNotification('فشل حذف العقار', 'error');
            });
        },

        setFilters: function(filters) {
          var current: Record<string, any> = Object.assign({}, get().filters);
          var incoming: Record<string, any> = Object.assign({}, filters);
          // حذف المفاتيح الفارغة
          Object.keys(incoming).forEach(function(key) {
            if (incoming[key] === null || incoming[key] === undefined || incoming[key] === '') {
              delete current[key];
              delete incoming[key];
            }
          });
          var newFilters = Object.assign({}, current, incoming, { page: 1 });
          set({ filters: newFilters, currentPage: 1 });
          get().fetchProperties(newFilters);
        },

        clearFilters: function() {
          set({ filters: {}, currentPage: 1 });
          get().fetchProperties({});
        },

        // إجراءات المفضلات
        fetchFavorites: function() {
          return api.get('/favorites')
            .then(function(res) {
              var favIds = [];
              if (res.data.data && Array.isArray(res.data.data)) {
                favIds = res.data.data.map(function(f: any) { return f.id; });
              }
              set({ favorites: favIds });
            })
            .catch(function(err) {
              // صامت
            });
        },

        toggleFavorite: function(propertyId) {
          if (!get().isAuthenticated) {
            set({ showLoginModal: true });
            return;
          }
          var isFav = get().favorites.includes(propertyId);
          if (isFav) {
            api.delete('/favorites/' + propertyId)
              .then(function() {
                set({ favorites: get().favorites.filter(function(id) { return id !== propertyId; }) });
                get().addNotification('تم الحذف من المفضلة', 'info');
              })
              .catch(function() {
                get().addNotification('حدث خطأ', 'error');
              });
          } else {
            api.post('/favorites', { property_id: propertyId })
              .then(function() {
                set({ favorites: get().favorites.concat([propertyId]) });
                get().addNotification('تم الإضافة للمفضلة', 'success');
              })
              .catch(function() {
                get().addNotification('حدث خطأ', 'error');
              });
          }
        },

        isFavorite: function(propertyId) {
          return get().favorites.includes(propertyId);
        },

        // إجراءات الذكاء الاصطناعي
        estimatePrice: function(data) {
          set({ isAiLoading: true });
          return api.post('/ai/estimate', data)
            .then(function(res) {
              set({ priceEstimate: res.data, isAiLoading: false });
            })
            .catch(function(err) {
              set({ isAiLoading: false });
            });
        },

        smartSearch: function(query) {
          set({ isAiLoading: true });
          return api.post('/ai/search', { query: query })
            .then(function(res) {
              set({ smartSearchResults: res.data, isAiLoading: false });
            })
            .catch(function(err) {
              set({ isAiLoading: false });
            });
        },

        fetchRecommendations: function(propertyId) {
          var data: any = {};
          if (propertyId) {
            data.property_id = propertyId;
          }
          return api.post('/ai/recommend', data)
            .then(function(res) {
              // يمكن استخدام التوصيات لاحقاً
            })
            .catch(function(err) {
              // صامت
            });
        },

        // إجراءات المقارنة
        toggleComparison: function(propertyId) {
          var ids = get().comparisonIds;
          if (ids.includes(propertyId)) {
            set({ comparisonIds: ids.filter(function(id) { return id !== propertyId; }) });
          } else if (ids.length < 4) {
            set({ comparisonIds: ids.concat([propertyId]) });
            get().addNotification('تمت الإضافة للمقارنة (' + (ids.length + 1) + '/4)', 'info');
          } else {
            get().addNotification('يمكنك مقارنة 4 عقارات كحد أقصى', 'error');
          }
        },

        clearComparison: function() { set({ comparisonIds: [] }); },

        // إجراءات النوافذ
        setShowLoginModal: function(show) { set({ showLoginModal: show }); },
        setShowRegisterModal: function(show) { set({ showRegisterModal: show }); },
        setShowAddPropertyModal: function(show) { set({ showAddPropertyModal: show }); },

        // إجراءات الإشعارات
        addNotification: function(message, type) {
          if (!type) type = 'info';
          var id = Date.now().toString();
          set({ notifications: get().notifications.concat([{ id: id, message: message, type: type }]) });
          // حذف تلقائي بعد 4 ثوان
          setTimeout(function() { get().removeNotification(id); }, 4000);
        },

        removeNotification: function(id) {
          set({ notifications: get().notifications.filter(function(n) { return n.id !== id; }) });
        },
      };
    },
    {
      name: 'nazra-store',
      // حفظ القيم المحددة فقط
      partialize: function(state) {
        return {
          token: state.token,
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          favorites: state.favorites,
          comparisonIds: state.comparisonIds,
        };
      },
    }
  )
);