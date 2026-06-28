/**
 * middleware/core/profile-route.js
 * التوجيه الذكي لملفات المستخدمين حسب أدوارهم
 */
import { auth, db } from '../../core/firebase-init.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * توجيه المستخدم لصفحة ملفه الشخصي حسب دوره
 * @param {string} uid - معرف المستخدم (اختياري، يستخدم currentUser إذا لم يُمرر)
 */
export const navigateToUserDashboard = async (uid = null) => {
    try {
        const user = uid ? await auth.currentUser : auth.currentUser;
        
        if (!user) {
            window.location.href = '/register/login.html';
            return;
        }

        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            console.warn("User document not found, redirecting to login");
            window.location.href = '/register/login.html';
            return;
        }

        const userData = userDoc.data();
        const role = userData.role || 'customer';

        // خريطة المسارات حسب الدور
        const routes = {
            "salon": "/profiles/profile-salon.html",
            "store": "/profiles/profile-store.html",
            "customer": "/profiles/profile-customer.html",
            "admin": "/dashboard/admin.html"
        };

        const targetRoute = routes[role] || routes["customer"];
        window.location.href = targetRoute;
        
    } catch (error) {
        console.error("Error in profile routing:", error);
        window.location.href = '/index.html';
    }
};

/**
 * الحصول على رابط الملف الشخصي للمستخدم
 * @param {string} role 
 * @returns {string}
 */
export const getProfileRoute = (role) => {
    const routes = {
        "salon": "/profiles/profile-salon.html",
        "store": "/profiles/profile-store.html",
        "customer": "/profiles/profile-customer.html"
    };
    return routes[role] || "/profiles/profile-customer.html";
};

/**
 * التحقق من أن المستخدم في صفحته الصحيحة حسب الدور
 * @returns {Promise<boolean>}
 */
export const verifyProfileAccess = async () => {
    const user = await getCurrentUser();
    if (!user) return false;

    const currentPath = window.location.pathname;
    const expectedPath = getProfileRoute(user.role);
    
    return currentPath.includes(expectedPath);
};

