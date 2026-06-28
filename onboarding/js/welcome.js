import { auth, db } from "../../core/firebase-init.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "../../auth/js/notifications.js"; 

const welcomeTitle = document.getElementById('welcomeTitle');
const startBtn = document.getElementById('startSetupBtn');

/**
 * ملف الترحيب المركزي - يعمل كبوابة توجيه (Router) لكل المستخدمين الجدد
 * يقوم بقراءة دور المستخدم من Firestore وتوجيهه للمسار الصحيح دون تمرير بيانات في الـ URL
 */
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            // جلب مستند المستخدم من المجموعة المركزية users
            const userDoc = await getDoc(doc(db, "users", user.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const role = userData.role; // القيم المعتمدة: 'salon', 'store', 'customer'
                const name = userData.fullName ? userData.fullName.split(' ')[0] : "مستخدم";

                // تحديث واجهة المستخدم بالاسم الأول بشكل ودّي
                if (welcomeTitle) {
                    welcomeTitle.innerText = `مرحباً بك، ${name}!`;
                }

                // منطق التوجيه المركزي عند الضغط على زر البدء
                if (startBtn) {
                    startBtn.onclick = () => {
                        // حماية الزر من الضغط المتكرر أثناء رندرة وتحميل الصفحة التالية
                        startBtn.disabled = true;
                        startBtn.innerHTML = '<span>جاري الانتقال...</span> <i class="fas fa-spinner fa-spin"></i>';

                        let destination = "";

                        // تحديد الوجهة بناءً على رتبة المستخدم (Role-Based Routing) - تم اعتماد store هنا
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
                                destination = 'add-salon.html';
                        }

                        // التوجيه النظيف والآمن دون تمرير الـ UID في الرابط لتجنب الثغرات وتغيير الرابط يدوياً
                        window.location.href = destination;
                    };
                }
            } else {
                console.error("No user data found in Firestore");
                // تسجيل الخروج التلقائي لحماية الحساب من التعليق في جلسة بدون مستند
                await signOut(auth);
                window.location.replace("../register/login.html");
            }
        } catch (error) {
            console.error("Error in Central Router:", error);
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.innerHTML = '<span>ابدأ الآن</span> <i class="fas fa-arrow-left"></i>';
            }
            if (typeof showNotification === "function") {
                showNotification("حدث خطأ أثناء الاتصال بالخادم، يرجى إعادة المحاولة", "error");
            }
        }
    } else {
        window.location.replace("../register/login.html");
    }
});
