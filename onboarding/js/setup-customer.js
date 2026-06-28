/* Firebase Application and Core Database Modules */
import { db, auth } from "../../core/firebase-init.js";

/* Cloud Firestore Database Operation Methods */
import { doc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* Firebase Authentication State Management Observer */
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.replace("../../register/login.html");
        return;
    }

    try {
        // تحديث الحساب الفرعي والحساب الرئيسي معاً بأمان عبر الـ UID الخاص بالجلسة المشفرة
        await Promise.all([
            setDoc(doc(db, "customers", user.uid), {
                onboardingStatus: "completed",
                activatedAt: new Date(),
                role: "customer"
            }, { merge: true }),
            
            updateDoc(doc(db, "users", user.uid), { 
                status: "active",
                onboardingStatus: "completed"
            })
        ]);

        // توجيه نظيف ومحمي إلى الصفحة الشخصية
        setTimeout(() => {
            window.location.replace("../profiles/profile-customer.html");
        }, 1500);

    } catch (err) {
        console.error("خطأ في تفعيل حساب الزبون الفعلي:", err);
    }
});
