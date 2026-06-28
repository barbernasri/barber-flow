/**
 * middleware/core/index.js
 * الدالة المركزية لتهيئة الصفحات المحمية
 */
import { getCurrentUser } from './auth-state.js';
import { checkRole, handleUnauthorizedAccess, hasCompletedOnboarding } from './role-guard.js';

/**
 * تهيئة الصفحة والتحقق من الصلاحيات
 * تستدعى في بداية كل صفحة محمية
 * 
 * @param {Object} options - خيارات التهيئة
 * @param {string|string[]} options.requiredRole - الدور المطلوب (null = أي مستخدم مسجل)
 * @param {boolean} options.requireOnboarding - هل يشترط إكمال الإعداد؟ (default: false)
 * @param {string} options.redirectPath - مسار التوجيه عند الفشل (default: /index.html)
 * @param {Function} options.onSuccess - دالة تستدعى عند النجاح (تمرر userData)
 * @param {Function} options.onError - دالة تستدعى عند الفشل
 * 
 * @returns {Promise<Object|null>} بيانات المستخدم أو null
 */
export async function initializePage(options = {}) {
    const {
        requiredRole = null,
        requireOnboarding = false,
        redirectPath = '/index.html',
        onSuccess = null,
        onError = null
    } = options;

    try {
        // 1. التحقق من تسجيل الدخول
        const user = await getCurrentUser();
        
        if (!user) {
            // المستخدم غير مسجل، توجيه لصفحة الدخول
            window.location.replace('/register/login.html');
            return null;
        }

        // 2. التحقق من الصلاحيات (إذا تم تحديد دور)
        if (requiredRole && !checkRole(user, requiredRole)) {
            handleUnauthorizedAccess(redirectPath);
            if (onError) onError({ type: 'unauthorized', user });
            return null;
        }

        // 3. التحقق من إكمال الـ Onboarding (إذا لزم)
        if (requireOnboarding && !hasCompletedOnboarding(user)) {
            // توجيه لصفحة الإعداد حسب الدور
            const onboardingPaths = {
                'salon': '/onboarding/welcome.html',
                'store': '/onboarding/welcome.html',
                'customer': '/profiles/profile-customer.html'
            };
            
            const targetPath = onboardingPaths[user.role] || '/onboarding/welcome.html';
            window.location.replace(targetPath);
            
            if (onError) onError({ type: 'incomplete_onboarding', user });
            return null;
        }

        // 4. النجاح - استدعاء الدالة الممررة إذا وجدت
        if (onSuccess) {
            onSuccess(user);
        }

        return user;
    } catch (error) {
        console.error("Page initialization error:", error);
        
        if (onError) {
            onError({ type: 'error', error });
        }
        
        return null;
    }
}

/**
 * دالة مختصرة للصفحات العامة (لا تتطلب تسجيل دخول)
 * @returns {Promise<Object|null>}
 */
export async function initializePublicPage() {
    return await getCurrentUser();
}

/**
 * دالة مختصرة للصفحات الخاصة بالصالونات
 * @returns {Promise<Object|null>}
 */
export async function initializeSalonPage() {
    return await initializePage({
        requiredRole: 'salon',
        requireOnboarding: true,
        redirectPath: '/index.html'
    });
}

/**
 * دالة مختصرة للصفحات الخاصة بالمتاجر
 * @returns {Promise<Object|null>}
 */
export async function initializeStorePage() {
    return await initializePage({
        requiredRole: 'store',
        requireOnboarding: true,
        redirectPath: '/index.html'
    });
}

/**
 * دالة مختصرة للصفحات الخاصة بالزبائن
 * @returns {Promise<Object|null>}
 */
export async function initializeCustomerPage() {
    return await initializePage({
        requiredRole: 'customer',
        requireOnboarding: false,
        redirectPath: '/index.html'
    });
}

