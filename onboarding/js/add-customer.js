/* Firebase Application and Core Database Modules */
import { auth, db } from "../../core/firebase-init.js";

/* Cloud Firestore Database Operation Methods */
import { doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* Firebase Authentication State Management Observer */
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* Application UI Notification Management Component */
import { showNotification } from "../../auth/js/notifications.js";

/* Client-Side Image Binary Optimization and Processing Utility */
import { processImage } from "../../auth/js/images-utils.js";

const setupForm = document.getElementById('customerSetupForm');
const userPhotoInput = document.getElementById('userPhotoInput');
const photoPreview = document.getElementById('photoPreview');
let currentUser = null;
let selectedBase64Photo = null;

// مراقبة وحماية الجلسة بشكل صارم قبل السماح بأي عملية كتابة
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
    } else {
        window.location.replace("../../register/login.html");
    }
});

// استدعاء ملف معالجة الصور المستقل عند تغيير الصورة الشخصية للزبون
if (userPhotoInput) {
    userPhotoInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // معالجة وضغط الصورة بعرض 400 بكسل وجودة 70%
                selectedBase64Photo = await processImage(file, 400, 0.7);
                photoPreview.innerHTML = `<img src="${selectedBase64Photo}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            } catch (err) {
                showNotification("فشل معالجة الصورة، يرجى محاولة استخدام صورة أخرى", "error");
            }
        }
    };
}

setupForm.onsubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
        showNotification("عملية غير مصرح بها، يرجى إعادة تسجيل الدخول", "error");
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري حفظ البيانات...';

    try {
        const addressValue = document.getElementById('userAddress').value.trim();
        const birthDateValue = document.getElementById('birthDate').value || "";

        // حفظ تفاصيل الملف الشخصي الفرعي للزبون في مجموعة كستمرز مستقلة
        await setDoc(doc(db, "customers", currentUser.uid), {
            address: addressValue,
            birthDate: birthDateValue,
            profileImage: selectedBase64Photo,
            role: "customer",
            onboardingStatus: "completed",
            createdAt: new Date()
        }, { merge: true });

        // تحديث المستند الرئيسي وتغيير الحالة إلى active لفتحه في الـ Router
        await updateDoc(doc(db, "users", currentUser.uid), {
            onboardingStatus: "completed",
            status: "active"
        });

        // توجيه نظيف وآمن تماماً دون تسريب أي قيم في الـ URL
        window.location.replace(`setup-customer.html`);
    } catch (error) {
        console.error("Error saving customer profile:", error);
        showNotification("حدث خطأ في حفظ البيانات، يرجى التحقق من اتصالك", "error");
        btn.disabled = false;
        btn.innerHTML = 'حفظ والبدء في الاستكشاف';
    }
};
