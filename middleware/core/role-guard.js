/**
 * middleware/core/role-guard.js
 * نظام التحقق من الصلاحيات والأدوار
 */

/**
 * التحقق من تطابق دور المستخدم مع الدور المطلوب
 * @param {Object} userData - بيانات المستخدم الكاملة
 * @param {string|string[]} requiredRole - الدور المطلوب (أو مصفوفة أدوار)
 * @returns {boolean}
 */
export const checkRole = (userData, requiredRole) => {
    // 1. التحقق من وجود المستخدم وبياناته
    if (!userData || !userData.role) {
        console.warn("⚠️ Access Denied: User role not found.");
        return false;
    }

    const userRole = userData.role;

    // 2. إذا كان المستخدم Admin، يسمح بالوصول دائماً
    if (userRole === 'admin') {
        return true;
    }

    // 3. إذا كان requiredRole مصفوفة، نتحقق من وجود الدور في أي منها
    if (Array.isArray(requiredRole)) {
        return requiredRole.includes(userRole);
    }

    // 4. مقارنة مباشرة للدور
    return userRole === requiredRole;
};

/**
 * التحقق من حالة المستخدم (new, active, suspended...)
 * @param {Object} userData 
 * @param {string} requiredStatus 
 * @returns {boolean}
 */
export const checkUserStatus = (userData, requiredStatus) => {
    if (!userData || !userData.status) {
        return false;
    }
    return userData.status === requiredStatus;
};

/**
 * معالجة الوصول غير المصرح به
 * @param {string} redirectPath - المسار للتوجيه (افتراضي: الصفحة الرئيسية)
 */
export const handleUnauthorizedAccess = (redirectPath = '/index.html') => {
    // عرض تنبيه للمستخدم
    if (typeof window.showNotification === 'function') {
        window.showNotification("ليس لديك صلاحية الوصول لهذه الصفحة", "error");
    }
    
    // التوجيه بعد فترة قصيرة
    setTimeout(() => {
        window.location.href = redirectPath;
    }, 1500);
};

/**
 * التحقق من أن المستخدم أكمل الـ Onboarding
 * @param {Object} userData 
 * @returns {boolean}
 */
export const hasCompletedOnboarding = (userData) => {
    if (!userData) return false;
    return userData.onboardingStatus === 'completed' && userData.status === 'active';
};

