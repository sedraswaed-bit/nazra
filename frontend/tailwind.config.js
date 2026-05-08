/** @type {import('tailwindcss').Config} */
// إعدادات Tailwind CSS - Tailwind CSS Configuration
// منصة نظرة - NAZRA Platform

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ألوان المنصة - Platform colors
      colors: {
        'nazra-blue': '#0077B6',
        'nazra-blue-dark': '#005F8A',
        'nazra-blue-light': '#00B4D8',
        'nazra-orange': '#FFA500',
        'nazra-orange-dark': '#E09000',
        'nazra-navy': '#001F3F',
        'nazra-gray': '#6B7280',
        'nazra-bg': '#F8FAFC',
        'nazra-card': '#FFFFFF',
      },
      // خطوط عربية - Arabic fonts
      // ⚠️ إصلاح BUG #17: Noto Sans SC خط صيني مش عربي!
      fontFamily: {
        'arabic': ['Cairo', 'Tajawal', 'Noto Sans Arabic', 'sans-serif'],
      },
      // دعم RTL - RTL support
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
