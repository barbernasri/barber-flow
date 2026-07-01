/**
 * shared/js/paths.js
 * مركزية جميع مسارات مشروع BarberFlow-Pro
 * ️ جميع المسارات مطلقة (تبدأ بـ /)
 */

export const PATHS = {
    // الصفحة الرئيسية
    INDEX: '/index.html',

    // المصادقة
    LOGIN: '/register/login.html',
    REGISTER: '/register/register.html',

    // الترحيب والإعداد
    WELCOME: '/onboarding/welcome.html',
    ADD_SALON: '/onboarding/add-salon.html',
    ADD_STORE: '/onboarding/add-store.html',
    ADD_CUSTOMER: '/onboarding/add-customer.html',
    SETUP_SALON: '/onboarding/setup-salon.html',
    SETUP_STORE: '/onboarding/setup-store.html',
    SETUP_CUSTOMER: '/onboarding/setup-customer.html',

    // البروفايلات
    PROFILE_SALON: '/profiles/profile-salon.html',
    PROFILE_STORE: '/profiles/profile-store.html',
    PROFILE_CUSTOMER: '/profiles/profile-customer.html',

    // الاستكشاف
    EXPLORE_SALON: '/home/explore-salon.html',
    EXPLORE_STORE: '/home/explore-store.html',
    DETAILS_SALON: '/home/details-salon.html',
    DETAILS_STORE: '/home/details-store.html',

    // لوحة التحكم
    APPOINTMENTS: '/dashboard/appointments/',
    ANALYTICS: '/dashboard/analytics/',
    SETTINGS_GENERAL: '/dashboard/settings/settings-general.html',
    SETTINGS_SALON: '/dashboard/settings/settings-salon.html',
    SETTINGS_STORE: '/dashboard/settings/settings-store.html',

    // الدعم
    ABOUT: '/support/about.html',
    CONTACT: '/support/contact.html',
    SURVEY: '/support/survey.html'
};

/**
 * تحويل مفتاح المسار إلى URL كامل
 * @param {string} key - مفتاح المسار من PATHS
 * @returns {string} URL كامل (مثل: https://site.com/index.html)
 */
export function resolvePath(key) {
    const absolutePath = PATHS[key];
    if (!absolutePath) return '#';
    
    // إذا كان المسار يبدأ بـ http، اتركه كما هو
    if (absolutePath.startsWith('http')) {
        return absolutePath;
    }
    
    // بناء URL كامل من جذر الموقع
    return window.location.origin + absolutePath;
}

export default PATHS;

