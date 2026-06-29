/**
 * BarberFlow Pro - صفحة الترحيب المركزية
 * المسار: onboarding/welcome.js
 * 
 * المميزات:
 * - استخدام middleware للتحقق من الجلسة
 * - توجيه ذكي حسب الدور
 * - حماية من فقدان الجلسة
 */

import { auth, db } from "../core/firebase-init.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "../auth/js/notifications.js";
import { initializePage } from "../middleware/index.js";

// عناصر DOM
const welcomeTitle = document.getElementById('welcomeTitle');
const startBtn = document.getElementById('startSetupBtn');
const logoutBtn = document.getElementById('logoutBtn');

// ============================================
// التحقق من الجلسة باستخدام Middleware
// ============================================
let currentUserData = null;

async function checkSession() {
    try {
        // استخدام دالة التحقق من الجلسة
        currentUserData = await initializePage();
        
        if (!currentUserData) {
            // المستخدم غير مسجل، سيتم التوجيه تلقائياً
            return;
        }

        // تحديث واجهة المستخدم
        updateUI();
        
    } catch (error) {
        console.error("خطأ في التحقق من الجلسة:", error);
        showNotification("حدث خطأ في التحقق من الجلسة، يرجى إعادة تحميل الصفحة", "error");
    }
}

// ============================================
// تحديث واجهة المستخدم
// ============================================
function updateUI() {
    if (!currentUserData) return;

    const name = currentUserData.fullName 
        ? currentUserData.fullName.split(' ')[0] 
        : "مستخدم";

    if (welcomeTitle) {
        welcomeTitle.textContent = `مرحباً بك، ${name}!`;
    }
}

// ============================================
// منطق التوجيه حسب الدور
// ============================================
if (startBtn) {
    startBtn.onclick = async () => {
        if (!currentUserData) {
            showNotification("الجلسة غير صالحة، يرجى تسجيل الدخول مرة أخرى", "error");
            setTimeout(() => {
                window.location.replace("../register/login.html");
            }, 2000);
            return;
        }

        // حماية الزر من الضغط المتكرر
        startBtn.disabled = true;
        startBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الانتقال...';

        try {
            const role = currentUserData.role;
            let destination = "";

            // تحديد الوجهة بناءً على الدور
            switch (role) {
                case 'salon':
                    destination = 'add-salon.html';
                    break;
                case 'store':
                    destination = 'add-store.html';
                    break;
                case 'customer':
                    destination = 'add-customer.html';
                    break;
                default:
                    showNotification("دور المستخدم غير محدد", "error");
                    startBtn.disabled = false;
                    startBtn.innerHTML = '<span>ابدأ الإعداد الآن</span> <i class="fas fa-arrow-left"></i>';
                    return;
            }

            // حفظ الدور في sessionStorage للحفاظ على الجلسة
            sessionStorage.setItem('userRole', role);
            sessionStorage.setItem('userUid', currentUserData.uid);

            showNotification("جاري توجيهك لصفحة الإعداد...", "info");
            
            setTimeout(() => {
                window.location.href = destination;
            }, 500);

        } catch (error) {
            console.error("خطأ في التوجيه:", error);
            showNotification("حدث خطأ أثناء التوجيه، يرجى المحاولة مرة أخرى", "error");
            startBtn.disabled = false;
            startBtn.innerHTML = '<span>ابدأ الإعداد الآن</span> <i class="fas fa-arrow-left"></i>';
        }
    };
}

// ============================================
// زر تسجيل الخروج
// ============================================
if (logoutBtn) {
    logoutBtn.onclick = async () => {
        try {
            await signOut(auth);
            showNotification("تم تسجيل الخروج بنجاح", "success");
            setTimeout(() => {
                window.location.replace("../register/login.html");
            }, 1500);
        } catch (error) {
            console.error("خطأ في تسجيل الخروج:", error);
            showNotification("فشل تسجيل الخروج، يرجى المحاولة مرة أخرى", "error");
        }
    };
}

// ============================================
// مراقبة حالة المصادقة (لحماية إضافية)
// ============================================
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // المستخدم غير مسجل
        showNotification("انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى", "warning");
        setTimeout(() => {
            window.location.replace("../register/login.html");
        }, 2000);
    } else {
        // المستخدم مسجل، التحقق من وجود البيانات
        checkSession();
    }
});

// ============================================
// حماية من فقدان الجلسة عند التنقل
// ============================================
window.addEventListener('beforeunload', (e) => {
    if (currentUserData) {
        // حفظ حالة الجلسة
        sessionStorage.setItem('lastActivePage', 'welcome');
        sessionStorage.setItem('sessionTimestamp', Date.now().toString());
    }
});

// التحقق من صلاحية الجلسة عند تحميل الصفحة
window.addEventListener('load', () => {
    const lastActive = sessionStorage.getItem('lastActivePage');
    const timestamp = sessionStorage.getItem('sessionTimestamp');
    
    if (timestamp) {
        const elapsed = Date.now() - parseInt(timestamp);
        const maxSessionTime = 30 * 60 * 1000; // 30 دقيقة
        
        if (elapsed > maxSessionTime) {
            console.warn("الجلسة منتهية الصلاحية");
            sessionStorage.clear();
        }
    }
});

