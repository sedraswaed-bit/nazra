

import { Link } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { to: '/properties', label: 'العقارات' },
    { to: '/map', label: 'الخريطة' },
    { to: '/compare', label: 'المقارنة' },
    { to: '/loan-calculator', label: 'حاسبة القروض' },
  ];

  const typeLinks = [
    { to: '/properties?type=apartment', label: 'شقق' },
    { to: '/properties?type=villa', label: 'فلل' },
    { to: '/properties?type=house', label: 'بيوت' },
    { to: '/properties?type=land', label: 'أراضي' },
    { to: '/properties?type=office', label: 'مكاتب' },
    { to: '/properties?type=shop', label: 'محلات' },
  ];

  return (
    <footer className="bg-nazra-navy text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* عن المنصة */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-nazra-blue rounded-lg flex items-center justify-center">
                <Building2 className="text-white" size={18} />
              </div>
              <span className="text-xl font-bold">نظرة</span>
            </Link>
            <p className="text-sm text-blue-200 leading-relaxed">
              منصة عقارية ذكية تساعدك في البحث عن العقارات وتقييم أسعارها باستخدام تقنيات الذكاء الاصطناعي في سوريا.
            </p>
          </div>

          {/* روابط سريعة */}
          <div>
            <h4 className="font-semibold mb-4 text-nazra-orange">روابط سريعة</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-blue-200 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* أنواع العقارات */}
          <div>
            <h4 className="font-semibold mb-4 text-nazra-orange">أنواع العقارات</h4>
            <ul className="space-y-2">
              {typeLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-blue-200 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* التواصل */}
          <div>
            <h4 className="font-semibold mb-4 text-nazra-orange">تواصل معنا</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-blue-200">
                <Mail size={14} />
                info@nazra.sy
              </li>
              <li className="flex items-center gap-2 text-sm text-blue-200">
                <Phone size={14} />
                +963-11-1234567
              </li>
              <li className="flex items-center gap-2 text-sm text-blue-200">
                <MapPin size={14} />
                دمشق، سوريا
              </li>
            </ul>
          </div>
        </div>

        {/* خط فاصل وملاحظات */}
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-blue-300">
            © {currentYear} منصة نظرة. جميع الحقوق محفوظة.
          </p>
          <p className="text-xs text-blue-400">
            الأسعار تقريبية وقد تختلف عن الأسعار الفعلية
          </p>
        </div>
      </div>
    </footer>
  );
}
