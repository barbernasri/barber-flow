import { auth, db } from "../../core/firebase-init.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "../../auth/js/notifications.js";
import { initGlobalNavigation } from "./navbar.js";

// محرك الحماية وجلب البيانات الأساسية للزبون
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            // جلب وثيقة المستخدم من مجموعة users المركزية مباشرة
            const userDoc = await getDoc(doc(db, "users", user.uid));
            
            if (userDoc.exists() && userDoc.data().role === "customer") {
                const data = userDoc.data();
                
                // 1. تحديث النصوص الأساسية بالواجهة
                document.getElementById('userNameDisplay').innerText = data.fullName || "زبون BarberFlow";
                document.getElementById('userContactDisplay').innerText = data.contactInfo || "";
                
                // 2. تشغيل واستدعاء الشريط العلوي والسايدبار المشترك بشكل موحد
                await initGlobalNavigation({
                    role: "customer",
                    displayName: data.fullName,
                    title: "الملف الشخصي للزبون"
                });
                
            } else {
                showNotification("عذراً، هذه اللوحة مخصصة لحسابات الزبائن فقط", "error");
                setTimeout(() => window.location.replace("../register/login.html"), 2000);
            }
        } catch (error) {
            console.error("Error fetching customer data:", error);
            window.location.replace("../register/login.html");
        }
    } else {
        window.location.replace("../register/login.html");
    }
});
