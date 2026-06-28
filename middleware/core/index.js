// middleware/core/index.js
import { getCurrentUser } from './auth-state.js';
import { checkRole } from './role-guard.js';

/**
 * دالة مركزية لتجهيز الصفحة. 
 * تستدعى في بداية أي صفحة محمية.
 */
export async function initializePage(requiredRole = null) {
    const user = await getCurrentUser();
    
    // 1. التحقق من تسجيل الدخول
    if (!user) {
        window.location.href = "/register/login.html";
        return null;
    }

    // 2. التحقق من الصلاحيات إذا تم تمرير دور مطلوب
    if (requiredRole && !checkRole(user, requiredRole)) {
        window.location.href = "/index.html";
        return null;
    }

    return user; // تعيد بيانات المستخدم المكتملة للصفحة
}
