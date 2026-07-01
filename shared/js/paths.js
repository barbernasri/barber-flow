/**
 * shared/js/paths.js
 * مركزية جميع مسارات مشروع BarberFlow-Pro
 * الدور: توحيد المسارات وتجنب التكرار والأخطاء
 */

export const PATHS = {
    // ============================================
    // الصفحة الرئيسية
    // ============================================
    INDEX: '../index.html',

    // ============================================
    // المصادقة (Authentication)
    // ============================================
    LOGIN: '../register/login.html',
    REGISTER: '../register/register.html',

    // ============================================
    // الترحيب والإعداد (Onboarding)
    // ============================================
    WELCOME: '../onboarding/welcome.html',
    ADD_SALON: '../onboarding/add-salon.html',
    ADD_STORE: '../onboarding/add-store.html',
    ADD_CUSTOMER: '../onboarding/add-customer.html',
    SETUP_SALON: '../onboarding/setup-salon.html',
    SETUP_STORE: '../onboarding/setup-store.html',
    SETUP_CUSTOMER: '../onboarding/setup-customer.html',

    // ============================================
    // البروفايلات (Profiles)
    // ============================================
    PROFILE_SALON: '../profiles/profile-salon.html',
    PROFILE_STORE: '../profiles/profile-store.html',
    PROFILE_CUSTOMER: '../profiles/profile-customer.html',

    // ============================================
    // الاستكشاف والتفاصيل (Home)
    // ============================================
    EXPLORE_SALON: '../home/explore-salon.html',
    EXPLORE_STORE: '../home/explore-store.html',
    DETAILS_SALON: '../home/details-salon.html',
    DETAILS_STORE: '../home/details-store.html',

    // ============================================
    // لوحة التحكم (Dashboard)
    // ============================================
    APPOINTMENTS: '../dashboard/appointments/',
    ANALYTICS: '../dashboard/analytics/',
    SETTINGS_GENERAL: '../dashboard/settings/settings-general.html',
    SETTINGS_SALON: '../dashboard/settings/settings-salon.html',
    SETTINGS_STORE: '../dashboard/settings/settings-store.html',
    ADMIN_DASHBOARD: '../dashboard/admin.html',

    // ============================================
    // الدعم والمعلومات (Support)
    // ============================================
    ABOUT: '../support/about.html',
    CONTACT: '../support/contact.html',
    SURVEY: '../support/survey.html'
};

export default PATHS;

