/**
 * حارس الصلاحيات (Role Guard)
 * يقوم بفحص دور المستخدم المسجل في قاعدة البيانات ومقارنته بالدور المطلوب للصفحة.
 */

export const checkRole = (userData, requiredRole) => {
    // 1. إذا لم يوجد مستخدم أو لم يوجد دور للمستخدم، نمنع الوصول فوراً
    if (!userData || !userData.role) {
        console.warn("Access Denied: User role not found.");
        return false;
    }

    // 2. التحقق من تطابق الدور
    // ملاحظة: يمكنك إضافة منطق "Admin" هنا إذا أردت صلاحية مطلقة للـ Admin
    if (userData.role === 'admin') return true; 

    // 3. المقارنة الأساسية
    return userData.role === requiredRole;
};

/**
 * دالة مساعدة لتوجيه المستخدم إذا فشل التحقق
 */
export const handleUnauthorizedAccess = () => {
    // يمكنك تغيير المسار هنا حسب رغبتك (مثلاً تحويل لصفحة تسجيل الدخول أو الرئيسية)
    window.location.href = '/index.html';
};
