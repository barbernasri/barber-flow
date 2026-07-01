/**
 * shared/js/paths.js
 * مركزية جميع مسارات المشروع بشكل ديناميكي متوافق مع Spck و GitHub
 */

// حساب المسار الرئيسي للمشروع ديناميكياً سواء كان على سيرفر محلي أو GitHub Pages
const getBasePath = () => {
    const location = window.location.pathname;
    
    // إذا كان المشروع مستضافاً على GitHub Pages باسم المستودع barber-flow
    if (location.includes('/barber-flow/')) {
        return '/barber-flow';
    }
    
    // إذا كان يعمل محلياً (Localhost) أو في بيئة لا تحتوي على مجلد فرعي
    return '';
};

const BASE = getBasePath();

export const PATHS = {
    // الصفحة الرئيسية
    INDEX: `${BASE}/index.html`,

    // المصادقة
    LOGIN: `${BASE}/register/login.html`,
    REGISTER: `${BASE}/register/register.html`,

    // الترحيب والإعداد (Onboarding)
    WELCOME: `${BASE}/onboarding/welcome.html`,
    ADD_SALON: `${BASE}/onboarding/add-salon.html`,
    ADD_STORE: `${BASE}/onboarding/add-store.html`,
    ADD_CUSTOMER: `${BASE}/onboarding/add-customer.html`,
    SETUP_SALON: `${BASE}/onboarding/setup-salon.html`,
    SETUP_STORE: `${BASE}/onboarding/setup-store.html`,
    SETUP_CUSTOMER: `${BASE}/onboarding/setup-customer.html`,

    // البروفايلات
    PROFILE_SALON: `${BASE}/profiles/profile-salon.html`,
    PROFILE_STORE: `${BASE}/profiles/profile-store.html`,
    PROFILE_CUSTOMER: `${BASE}/profiles/profile-customer.html`,

    // الاستكشاف والتفاصيل
    EXPLORE_SALON: `${BASE}/home/explore-salon.html`,
    EXPLORE_STORE: `${BASE}/home/explore-store.html`,
    DETAILS_SALON: `${BASE}/home/details-salon.html`,
    DETAILS_STORE: `${BASE}/home/details-store.html`,

    // لوحة التحكم
    APPOINTMENTS: `${BASE}/dashboard/appointments/`, // تم تصحيح الخطأ الإملائي
    ANALYTICS: `${BASE}/dashboard/analytics/`,
    SETTINGS_GENERAL: `${BASE}/dashboard/settings/settings-general.html`,
    SETTINGS_SALON: `${BASE}/dashboard/settings/settings-salon.html`,
    SETTINGS_STORE: `${BASE}/dashboard/settings/settings-store.html`,
    ADMIN_DASHBOARD: `${BASE}/dashboard/admin.html`,

    // الدعم
    ABOUT: `${BASE}/support/about.html`,
    CONTACT: `${BASE}/support/contact.html`,
    SURVEY: `${BASE}/support/survey.html`
};

export default PATHS;

