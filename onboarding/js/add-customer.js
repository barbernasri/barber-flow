/**
 * BarberFlow Pro - صفحة إكمال ملف الزبون
 * المسار: onboarding/add-customer.js
 */

import { auth, db } from "../core/firebase-init.js";
import { doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "../auth/js/notifications.js";
import { processImage } from "../auth/js/images-utils.js";

// عناصر DOM
const setupForm = document.getElementById('customerSetupForm');
const userPhotoInput = document.getElementById('userPhotoInput');
const photoPreview = document.getElementById('photoPreview');

let currentUser = null;
let selectedBase64Photo = null;

// ============================================
// مراقبة الجلسة الأمنية
// ============================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
    } else {
        window.location.replace("../register/login.html");
    }
});

// ============================================
// معالجة الصورة الشخصية
// ============================================
if (userPhotoInput) {
    // النقر على الحاوية يفتح اختيار الملف
    const photoUploader = document.getElementById('photoUploader');
    if (photoUploader) {
        photoUploader.onclick = () => userPhotoInput.click();
    }

    userPhotoInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showNotification("يرجى اختيار ملف صورة صحيح", "error");
            userPhotoInput.value = "";
            return;
        }

        try {
            // معالجة وضغط الصورة بعرض 400 بكسل وجودة 70%
            selectedBase64Photo = await processImage(file, 400, 0.7);
            
            if (photoPreview) {
                photoPreview.innerHTML = `
                    <img src="${selectedBase64Photo}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">
                `;
            }
            
            showNotification("تم تحديث الصورة الشخصية بنجاح", "success");
        } catch (err) {
            console.error("Error processing photo:", err);
            showNotification("فشل معالجة الصورة، يرجى محاولة استخدام صورة أخرى", "error");
        }
    };
}

// ============================================
// إرسال النموذج وحفظ البيانات
// ============================================
if (setupForm) {
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

            // حفظ تفاصيل الملف الشخصي الفرعي للزبون في مجموعة customers مستقلة
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

            showNotification("تم حفظ بياناتك بنجاح! 🎉", "success");

            // توجيه نظيف وآمن تماماً دون تسريب أي قيم في الـ URL
            setTimeout(() => {
                window.location.replace("setup-customer.html");
            }, 1500);

        } catch (error) {
            console.error("Error saving customer profile:", error);
            showNotification("حدث خطأ في حفظ البيانات، يرجى التحقق من اتصالك", "error");
            btn.disabled = false;
            btn.innerHTML = '<span>حفظ والبدء في الاستكشاف</span> <i class="fas fa-arrow-left"></i>';
        }
    };
}

