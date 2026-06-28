/**
 * نظام التوجيه والحماية المركزي لـ BarberFlow Pro
 * المسار: auth/js/router.js
 * 
 * الوظيفة:
 * - التحقق من حالة تسجيل الدخول
 * - توجيه المستخدمين الجدد لإكمال الإعداد
 * - عرض نافذة منبثقة اختيارية بدلاً من التوجيه الإجباري
 */

import { auth, db } from "../../core/firebase-init.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "./notifications.js";

// ============================================
// مسارات الـ Onboarding
// ============================================
const PATHS = {
    WELCOME: "../onboarding/welcome.html",
    ADD_SALON: "../onboarding/add-salon.html",
    ADD_STORE: "../onboarding/add-store.html",
    ADD_CUSTOMER: "../onboarding/add-customer.html",
    SETUP_SALON: "../onboarding/setup-salon.html",
    SETUP_STORE: "../onboarding/setup-store.html"
};

// ============================================
// المراقب الرئيسي لحالة المصادقة
// ============================================
onAuthStateChanged(auth, async (user) => {
    const currentPath = window.location.pathname;
    
    // تحديد نوع الصفحة الحالية
    const isWelcomePage = currentPath.includes("welcome.html");
    const isAddPage = currentPath.includes("add-salon.html") || 
                      currentPath.includes("add-store.html") || 
                      currentPath.includes("add-customer.html");
    const isSetupPage = currentPath.includes("setup-salon.html") || 
                        currentPath.includes("setup-store.html");
    
    const isOnboardingZone = isWelcomePage || isAddPage || isSetupPage;
    
    if (user) {
        try {
            // جلب بيانات المستخدم من Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const role = userData.role;
                const userStatus = userData.status || "new";
                const onboardingStatus = userData.onboardingStatus || "none";

                // القاعدة الذهبية: إذا كان الحساب نشطاً، لا تتدخل
                if (userStatus === "active" || onboardingStatus === "completed") {
                    showPageContent();
                    return;
                }

                // منطق المستخدمين الجدد
                if (userStatus === "new" && onboardingStatus !== "completed") {
                    // إذا اختار التخطي في هذه الجلسة
                    if (sessionStorage.getItem("skipOnboardingAsset")) {
                        showPageContent();
                        return;
                    }

                    // إذا كان خارج منطقة الـ Onboarding
                    if (!isOnboardingZone) {
                        let targetPath = PATHS.WELCOME;

                        if (onboardingStatus === "none" || !onboardingStatus) {
                            if (role === "salon") targetPath = PATHS.ADD_SALON;
                            else if (role === "store") targetPath = PATHS.ADD_STORE;
                            else if (role === "customer") targetPath = PATHS.ADD_CUSTOMER;
                        } else if (onboardingStatus === "basic_done") {
                            if (role === "salon") targetPath = PATHS.SETUP_SALON;
                            else if (role === "store") targetPath = PATHS.SETUP_STORE;
                            else if (role === "customer") {
                                showPageContent();
                                return;
                            }
                        }

                        // عرض النافذة المنبثقة
                        triggerRecoveryModal(role, onboardingStatus, targetPath);
                    }
                }
            }
        } catch (error) {
            console.error("❌ خطأ في نظام التوجيه:", error);
        }
    } else {
        // المستخدم غير مسجل
        if (isOnboardingZone) {
            window.location.replace("../../register/login.html");
            return;
        }
    }
    
    // إظهار المحتوى
    showPageContent();
});

// ============================================
// عرض النافذة المنبثقة لإكمال الإعداد
// ============================================
function triggerRecoveryModal(role, currentStep, targetPath) {
    // منع التكرار
    if (document.getElementById('routerRecoveryModal')) return;
    
    let title = "تخصيص حسابك التجاري 🪄";
    let text = "لم تقم بتهيئة ملفك العملي بالكامل بعد.";
    
    // تخصيص النصوص حسب الدور
    if (role === "salon") {
        title = "إعداد صالونك المحترف 💈";
        text = "تبقى خطوة واحدة لتفعيل نظام الحجوزات والظهور للزبائن.";
    } else if (role === "store") {
        title = "تجهيز متجرك الموثق 🛍️";
        text = "ابدأ في عرض وبيع منتجاتك. أكمل إعداد المتجر لتنشيط سلة الشراء.";
    } else if (role === "customer") {
        title = "إكمال ملفك الشخصي 👤";
        text = "لنستمتع بتجربة حجز فريدة، يرجى إكمال معلومات ملفك الشخصي.";
    }
    
    const modal = document.createElement('div');
    modal.id = 'routerRecoveryModal';
    modal.className = 'global-otp-overlay';
    
    modal.innerHTML = `
        <div class="global-otp-modal" style="max-width: 450px;">
            <div class="global-otp-icon">
                <i class="fas fa-user-clock"></i>
            </div>
            
            <h2 class="global-otp-title">${title}</h2>
            <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 25px;">
                ${text}
            </p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <button id="modalConfirmBtn" class="btn btn-accent" style="padding: 12px;">
                    إكمال الآن 
                </button>
                <button id="modalCancelBtn" class="btn btn-outline" style="padding: 12px;">
                    لاحقاً
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // زر الإكمال
    modal.querySelector('#modalConfirmBtn').onclick = () => {
        modal.remove();
        window.location.href = targetPath;
    };
    
    // زر التخطي
    modal.querySelector('#modalCancelBtn').onclick = () => {
        sessionStorage.setItem("skipOnboardingAsset", "true");
        modal.remove();
        showNotification("تم تأجيل إكمال البيانات، يمكنك تصفح الموقع الآن.", "info");
        showPageContent();
    };
}

// ============================================
// إظهار محتوى الصفحة بأمان
// ============================================
function showPageContent() {
    if (document.body) {
        document.body.style.visibility = "visible";
    }
}

