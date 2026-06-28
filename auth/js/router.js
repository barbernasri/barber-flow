/* Firebase Application and Core Database Modules */
import { auth, db } from "../../core/firebase-init.js";

/* Cloud Firestore Database Operation Methods */
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* Firebase Authentication State Management Observer */
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* نظام التنبيهات المخصص لـ BarberFlow-Pro */
import { showNotification } from "../../auth/js/notifications.js";

// مصفوفة المسارات الثابتة المعتمدة في شجرة مجلدات مرحلة الـ Onboarding
const PATHS = {
    WELCOME: "../onboarding/welcome.html",
    ADD_SALON: "../onboarding/add-salon.html",
    ADD_STORE: "../onboarding/add-store.html",
    ADD_CUSTOMER: "../onboarding/add-customer.html",
    SETUP_SALON: "../onboarding/setup-salon.html",
    SETUP_STORE: "../onboarding/setup-store.html"
};

/**
 * نظام التوجيه والحماية المركزي المطوّر (Global Auth Guard & Role-Based Onboarding Router)
 * تم تعديله ليعتمد على التنبيه الاختياري بالكامل بدلاً من التوجيه الإجباري.
 */
onAuthStateChanged(auth, async (user) => {
    const currentPath = window.location.pathname;
    
    // التحقق من الصفحات الحالية لمنع التكرار اللانهائي في التحويل
    const isWelcomePage = currentPath.includes("welcome.html");
    const isAddPage = currentPath.includes("add-salon.html") || currentPath.includes("add-store.html") || currentPath.includes("add-customer.html");
    const isSetupPage = currentPath.includes("setup-salon.html") || currentPath.includes("setup-store.html");
    
    // هل المستخدم متواجد حالياً داخل إحدى صفحات الـ onboarding؟
    const isOnboardingZone = isWelcomePage || isAddPage || isSetupPage;

    if (user) {
        try {
            // جلب مستند المستخدم المركزي لمعرفة الدور والحالة الحقيقية
            const userDoc = await getDoc(doc(db, "users", user.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const role = userData.role; // جلب دور المستخدم الحقيقي (salon / store / customer)
                const userStatus = userData.status || "new";
                const onboardingStatus = userData.onboardingStatus || "none";

                // [القاعدة الذهبية المحدثة]: إذا كان الحساب نشطاً بالكامل وأنهى الإعداد، الـ Router لا يتدخل إطلاقاً
                if (userStatus === "active" || onboardingStatus === "completed") {
                    showPageContent();
                    return;
                }

                // [منطق المعالجة والتوجيه للمستخدمين الجدد فقط والذين لم يكملوا الإعداد]
                if (userStatus === "new" && onboardingStatus !== "completed") {
                    
                    // إذا كان المستخدم قد اختار التخطي المؤقت في هذه الجلسة، نتركه يتصفح ولا نضايقه بالتحويل
                    if (sessionStorage.getItem("skipOnboardingAsset")) {
                        showPageContent();
                        return;
                    }

                    // التحقق مما إذا كان المستخدم متواجداً حالياً في صفحة التصفح العادية (خارج منطقة الـ onboarding)
                    if (!isOnboardingZone) {
                        // تحديد مسار التوجيه المناسب حسب الدور والخطوة الحالية لإرساله للنافذة المنبثقة
                        let targetPath = PATHS.WELCOME;

                        if (onboardingStatus === "none" || !onboardingStatus) {
                            if (role === "salon") {
                                targetPath = PATHS.ADD_SALON;
                            } else if (role === "store") {
                                targetPath = PATHS.ADD_STORE;
                            } else if (role === "customer") {
                                targetPath = PATHS.ADD_CUSTOMER;
                            } else {
                                targetPath = PATHS.WELCOME;
                            }
                        } else if (onboardingStatus === "basic_done") {
                            if (role === "salon") {
                                targetPath = PATHS.SETUP_SALON;
                            } else if (role === "store") {
                                targetPath = PATHS.SETUP_STORE;
                            } else if (role === "customer") {
                                // الزبون العادي لا يحتاج خطوة ثانية
                                showPageContent();
                                return;
                            }
                        }

                        // تفعيل التنبيه المنبثق الاختياري وإرسال المسار المستهدف له
                        triggerRecoveryModal(role, onboardingStatus, targetPath);
                    }
                }
            }
        } catch (error) {
            console.error("Auth Router System Configuration Error:", error);
        }
    } else {
        // إذا لم يكن هناك مستخدم مسجل وجلسة العمل فارغة تماماً
        if (isOnboardingZone) {
            window.location.replace("../../register/login.html");
            return;
        }
    }
    
    // إظهار محتوى الصفحة بأمان
    showPageContent();
});

/**
 * دالة لتوليد وعرض النافذة المنبثقة التفاعلية الفاخرة المخصصة حسب دور المستخدم لإكمال الإعداد
 */
function triggerRecoveryModal(role, currentStep, targetPath) {
    // منع تكرار إنشاء النافذة المنبثقة في الصفحة
    if (document.getElementById('routerRecoveryModal')) return;

    let title = "تخصيص حسابك التجاري 🪄";
    let text = "لم تقم بتهيئة ملفك العملي بالكامل بعد. إكمال هذه البيانات يساعد الزبائن على العثور عليك وحجز خدماتك بسرعة!";

    // تخصيص النصوص ديناميكياً بدقة تامة بناءً على الدور الحالي للمستخدم
    if (role === "salon") {
        title = "إعداد صالونك المحترف 💈";
        text = "تبقى خطوة واحدة لتفعيل نظام الحجوزات والظهور للزبائن في منطقتك. لنكمل إعداد الصالون الآن.";
    } else if (role === "store") {
        title = "تجهيز متجرك الموثق 🛍️";
        text = "ابدأ في عرض وبيع منتجات الحلاقة والتجميل الخاصة بك. أكمل إعداد المتجر لتنشيط سلة الشراء.";
    } else if (role === "customer") {
        title = "إكمال ملفك الشخصي 👤";
        text = "لنستمتع بتجربة حجز فريدة وسريعة، يرجى إكمال معلومات ملفك الشخصي وعنوانك لتسهيل الخدمة.";
    }

    const modal = document.createElement('div');
    modal.id = 'routerRecoveryModal';
    modal.className = 'modal-overlay'; // استخدام الفئة المتواجدة بملف الـ CSS لإضافة تأثير الـ Blur
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 999999; direction: rtl; font-family: "Cairo", sans-serif;';
    
    modal.innerHTML = `
        <div class="auth-container" style="background: #161616; border: 1px solid rgba(212, 175, 55, 0.2); padding: 25px; border-radius: 12px; width: 90%; max-width: 450px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
            <h3 style="color: #d4af37; margin-top: 0; font-size: 1.3rem; margin-bottom: 15px;"><i class="fas fa-user-clock" style="color:#d4af37; margin-left: 8px;"></i> ${title}</h3>
            <p style="color: #ccc; font-size: 0.95rem; line-height: 1.6; margin-bottom: 25px;">${text}</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <button id="modalConfirmBtn" style="padding: 12px; background: linear-gradient(135deg, #d4af37, #aa841b); border: none; border-radius: 8px; color: #000; font-weight: bold; cursor: pointer; font-size: 0.95rem; transition: all 0.3s;">إكمال الآن 🪄</button>
                <button id="modalCancelBtn" style="padding: 12px; background: transparent; border: 1px solid #444; border-radius: 8px; color: #aaa; font-weight: bold; cursor: pointer; font-size: 0.95rem; transition: all 0.3s;">لاحقاً، تصفح الموقع</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#modalConfirmBtn').onclick = () => {
        modal.remove();
        window.location.href = targetPath;
    };

    modal.querySelector('#modalCancelBtn').onclick = () => {
        // حفظ خيار التخطي في sessionStorage لمنع إزعاج المستخدم مجدداً أثناء هذه الجلسة الحالية
        sessionStorage.setItem("skipOnboardingAsset", "true");
        modal.remove();
        showNotification("تم تأجيل إكمال البيانات، يمكنك تصفح الموقع الآن بكل حرية.", "success");
        showPageContent();
    };
}

/**
 * دالة مركزية آمنة لإظهار محتوى الصفحة الحالي بعد التحقق الكامل
 */
function showPageContent() {
    if (document.body) {
        document.body.style.visibility = "visible";
    }
}
