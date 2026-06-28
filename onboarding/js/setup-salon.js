import { db, auth } from "../../core/firebase-init.js";
import { doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { processImage, removeImageFromGallery } from "../../auth/js/images-utils.js"; 
import { showNotification } from "../../auth/js/notifications.js";

// ==========================================
// 1. المتغيرات ومصفوفات البيانات في النطاق العالمي للملف
// ==========================================
let selectedCoverBase64 = null;
let galleryImages = []; 
let certificateImages = []; 
let currentUid = null;
let isUploadingImages = false;

// ==========================================
// 2. جلب عناصر واجهة المستخدم في النطاق العالمي لحل مشكلة الكاش تماماً
// ==========================================
const setupForm = document.getElementById('setupSalonForm');
const coverUploader = document.getElementById('coverUploader');
const fileInput = document.getElementById('fileInput');
const salonImg = document.getElementById('salonImg');
const placeholderIcon = document.getElementById('placeholderIcon');
const coverUploaderLabel = document.getElementById('coverUploaderLabel');
const deleteCoverBtn = document.getElementById('deleteCoverBtn');
const skipBtn = document.getElementById('skipBtn');
const mainSubmitBtn = document.getElementById('submitBtn');

const galleryPreviewsContainer = document.getElementById('galleryPreviewsContainer');
const addGalleryPhotoBtn = document.getElementById('addGalleryPhotoBtn');
const galleryFileInput = document.getElementById('galleryFileInput');

const certPreviewsContainer = document.getElementById('certPreviewsContainer');
const addCertPhotoBtn = document.getElementById('addCertPhotoBtn');
const certFileInput = document.getElementById('certFileInput');

// تصفير مدخلات الملفات فوراً لكسر كاش المتصفح العشوائي (Cache Breaker)
if (fileInput) fileInput.value = "";
if (galleryFileInput) galleryFileInput.value = "";
if (certFileInput) certFileInput.value = "";

// ==========================================
// 3. دالة التحكم في حالات الأزرار أثناء الرفع المعقد
// ==========================================
function toggleActionButtonsState(disabled, text = "") {
    isUploadingImages = disabled;
    if (mainSubmitBtn) {
        mainSubmitBtn.disabled = disabled;
        if (disabled) {
            if (!mainSubmitBtn.dataset.originalText) {
                mainSubmitBtn.dataset.originalText = mainSubmitBtn.innerHTML;
            }
            mainSubmitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
        } else {
            mainSubmitBtn.innerHTML = mainSubmitBtn.dataset.originalText || 'حفظ وإنشاء الملف الشخصي';
        }
    }
    if (skipBtn) skipBtn.disabled = disabled;
}

// ==========================================
// 4. دالة بناء كروت المعاينة للصور (Previews)
// ==========================================
function renderPreviewsOnly(array, container, isGalleryType) {
    if (!container) return;
    container.innerHTML = "";
    
    array.forEach(imgData => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        
        item.innerHTML = `
            <img src="${imgData.base64}">
            <button type="button" class="delete-btn"><i class="fas fa-times"></i></button>
        `;

        item.querySelector('.delete-btn').onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            removeImageFromGallery(
                imgData.id, 
                array, 
                container, 
                (updatedArray) => {
                    if (isGalleryType) {
                        galleryImages = updatedArray;
                    } else {
                        certificateImages = updatedArray;
                    }
                },
                (updatedArray) => {
                    renderPreviewsOnly(updatedArray, container, isGalleryType);
                }
            );
        };
        container.appendChild(item);
    });
}

// ==========================================
// 5. ربط أحداث عناصر الواجهة بشكل عالمي مباشر (تجنب الحجز داخل الدالات المخفية)
// ==========================================

// إعداد قنوات النقر لرفع صورة الغلاف
if (coverUploader && fileInput) {
    coverUploader.onclick = (e) => {
        if (e.target.closest('#deleteCoverBtn')) return; 
        fileInput.click();
    };

    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showNotification("يرجى اختيار ملف صورة صحيح (PNG أو JPG)", "error");
            fileInput.value = "";
            return;
        }

        toggleActionButtonsState(true, "جاري معالجة صورة الواجهة...");
        try {
            selectedCoverBase64 = await processImage(file, 1000, 0.75);
            
            if (salonImg) {
                salonImg.src = selectedCoverBase64;
                salonImg.style.display = 'block';
            }
            if (placeholderIcon) placeholderIcon.style.display = 'none';
            if (coverUploaderLabel) coverUploaderLabel.style.display = 'none';
            if (deleteCoverBtn) deleteCoverBtn.style.display = 'flex';
            
            showNotification("تم تحديث صورة واجهة الصالون بنجاح 📸", "success");
        } catch (err) {
            console.error("Cover photo processing failed:", err);
            showNotification("لم نتمكن من معالجة الصورة، يرجى تجربة صورة أخرى", "error");
        } finally {
            toggleActionButtonsState(false);
        }
    };
}

// حدث إزالة صورة الواجهة الأساسية
if (deleteCoverBtn) {
    deleteCoverBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation(); 
        selectedCoverBase64 = null;
        if (salonImg) {
            salonImg.src = "";
            salonImg.style.display = 'none';
        }
        if (placeholderIcon) placeholderIcon.style.display = 'block';
        if (coverUploaderLabel) coverUploaderLabel.style.display = 'block';
        deleteCoverBtn.style.display = 'none';
        if (fileInput) fileInput.value = "";
        showNotification("تم إزالة صورة الواجهة بنجاح", "success");
    };
}

// إعداد قنوات النقر لرفع وتخزين صور معرض الأعمال
if (addGalleryPhotoBtn && galleryFileInput) {
    addGalleryPhotoBtn.onclick = (e) => {
        e.preventDefault();
        galleryFileInput.click();
    };

    galleryFileInput.onchange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        if ((galleryImages.length + files.length) > 6) {
            showNotification("يمكنك رفع 6 صور كحد أقصى لمعرض أعمال الصالون", "error");
            galleryFileInput.value = "";
            return;
        }

        toggleActionButtonsState(true, "جاري معالجة صور المعرض...");
        try {
            for (const file of files) {
                if (!file.type.startsWith('image/')) continue;
                const base64 = await processImage(file, 800, 0.7);
                const imageId = 'gallery_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                galleryImages.push({ id: imageId, base64: base64 });
            }
            showNotification("تم إضافة صور معرض الأعمال بنجاح ✨", "success");
        } catch (err) {
            console.error("Error processing gallery image:", err);
            showNotification("حدثت مشكلة أثناء معالجة الصور، يرجى إعادة المحاولة", "error");
        } finally {
            renderPreviewsOnly(galleryImages, galleryPreviewsContainer, true);
            toggleActionButtonsState(false);
            galleryFileInput.value = ""; 
        }
    };
}

// إعداد قنوات النقر لرفع صور الشهادات الموثقة
if (addCertPhotoBtn && certFileInput) {
    addCertPhotoBtn.onclick = (e) => {
        e.preventDefault();
        certFileInput.click();
    };

    certFileInput.onchange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        if ((certificateImages.length + files.length) > 3) {
            showNotification("يمكنك إرفاق 3 شهادات كحد أقصى لتوثيق الحساب", "error");
            certFileInput.value = "";
            return;
        }

        toggleActionButtonsState(true, "جاري معالجة وثائق الشهادات...");
        try {
            for (const file of files) {
                if (!file.type.startsWith('image/')) continue;
                const base64 = await processImage(file, 800, 0.7);
                const imageId = 'cert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                certificateImages.push({ id: imageId, base64: base64 });
            }
            showNotification("تم إرفاق مستندات الشهادات بنجاح 🎓", "success");
        } catch (err) {
            console.error("Error processing certification image:", err);
            showNotification("لم نتمكن من قراءة ملفات الشهادات، يرجى المحاولة مجدداً", "error");
        } finally {
            renderPreviewsOnly(certificateImages, certPreviewsContainer, false);
            toggleActionButtonsState(false);
            certFileInput.value = ""; 
        }
    };
}

// حدث إرسال النموذج وحفظ البيانات في قاعدة البيانات لـ Firestore
if (setupForm) {
    setupForm.onsubmit = async (e) => {
        e.preventDefault();
        if (!currentUid || isUploadingImages) return;

        const descElement = document.getElementById('salonDescription');
        const certTitleElement = document.getElementById('certificateText');

        const descriptionValue = descElement ? descElement.value.trim() : "";
        const certificateTitleValue = certTitleElement ? certTitleElement.value.trim() : "";

        if (!selectedCoverBase64) {
            showNotification("يرجى اختيار صورة الواجهة الرئيسية أولاً لإظهار صالونك بشكل مميز للزبائن", "error");
            return;
        }

        if (descriptionValue.length < 10) {
            showNotification("يرجى كتابة نبذة عن الصالون لا تقل عن 10 أحرف لتعريف زبائنك بخدماتك المتاحة", "error");
            if (descElement) descElement.focus();
            return;
        }

        toggleActionButtonsState(true, "جاري إعداد ملف صالونك الاحترافي...");

        try {
            await setDoc(doc(db, "salons", currentUid), {
                coverImage: selectedCoverBase64,
                description: descriptionValue,
                portfolio: galleryImages.map(img => img.base64),
                certificate: {
                    title: certificateTitleValue,
                    photos: certificateImages.map(img => img.base64)
                },
                onboardingStatus: "completed",
                updatedAt: new Date()
            }, { merge: true });

            await updateDoc(doc(db, "users", currentUid), { 
                status: "active",
                onboardingStatus: "completed"
            });

            showNotification("تهانينا! تم إنشاء ملف صالونك بنجاح وجاري توجيهك لصفحتك الموثقة 🪄", "success");
            
            setTimeout(() => {
                window.location.replace("../profiles/profile-salon.html");
            }, 1500);
        } catch (err) {
            console.error("Error during handling final salon registration process:", err);
            showNotification("تأخر الاتصال بالخوادم، يرجى التحقق من الشبكة وإعادة المحاولة", "error");
            toggleActionButtonsState(false);
        }
    };
}

// حدث التخطي الفوري والمؤقت للمسار الحالي
if (skipBtn) {
    skipBtn.onclick = async (e) => {
        e.preventDefault();
        if (!currentUid || isUploadingImages) return;

        toggleActionButtonsState(true, "جاري تأجيل خطوة الهوية البصرية...");

        try {
            await setDoc(doc(db, "salons", currentUid), {
                onboardingStatus: "completed",
                updatedAt: new Date()
            }, { merge: true });

            await updateDoc(doc(db, "users", currentUid), { 
                status: "active",
                onboardingStatus: "completed"
            });

            showNotification("تم تأجيل إعداد ملف المظهر، يمكنك استكماله لاحقاً من لوحة تحكم الإعدادات", "success");

            setTimeout(() => {
                window.location.replace("../profiles/profile-salon.html");
            }, 1200);
        } catch (err) {
            console.error("Error during salon onboarding skipping process:", err);
            showNotification("لم نتمكن من معالجة طلب التخطي حالياً، يرجى المحاولة لاحقاً", "error");
            toggleActionButtonsState(false);
        }
    };
}

// ==========================================
// 6. مستمع الجلسة الأمنية (وظيفة التحقق والتوثيق فقط)
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (!user) {
        setTimeout(() => {
            if (!auth.currentUser) {
                window.location.replace("../../register/login.html");
            }
        }, 500);
        return;
    }
    // إسناد المعرف الحقيقي الآمن للمستخدم فقط
    currentUid = user.uid;
});
