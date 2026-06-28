import { db, auth } from "../../core/firebase-init.js";
import { doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { processImage, removeImageFromGallery } from "../../auth/js/images-utils.js"; 
import { showNotification } from "../../auth/js/notifications.js";

const setupForm = document.getElementById('setupStoreForm');
const coverUploader = document.getElementById('coverUploader');
const fileInput = document.getElementById('fileInput');
const storeImg = document.getElementById('storeImg');
const placeholderIcon = document.getElementById('placeholderIcon');
const coverUploaderLabel = document.getElementById('coverUploaderLabel');
const deleteCoverBtn = document.getElementById('deleteCoverBtn');
const skipBtn = document.getElementById('skipBtn');

const storePhotosGrid = document.getElementById('storePhotosGrid');
const galleryInput = document.getElementById('galleryInput');
const certPhotosGrid = document.getElementById('certPhotosGrid');
const certFileInput = document.getElementById('certInput');

let selectedCoverBase64 = null;
let storePhotos = []; 
let storeCertificates = [];
let currentUid = null;

// تأمين وحماية متكاملة لجلسة المتجر لمنع انهيار أو ضياع مصفوفات صور المنتجات المرفوعة
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.replace("../../register/login.html");
        return;
    }
    
    currentUid = user.uid;

    // معالجة غلاف واجهة المتجر الأساسية بالتوافق مع الصالون
    if (coverUploader && fileInput) {
        coverUploader.onclick = (e) => {
            if (e.target.closest('#deleteCoverBtn')) return;
            fileInput.click();
        };

        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    selectedCoverBase64 = await processImage(file, 1000, 0.7);
                    if (storeImg) {
                        storeImg.src = selectedCoverBase64;
                        storeImg.style.display = 'block';
                    }
                    if (placeholderIcon) placeholderIcon.style.display = 'none';
                    if (coverUploaderLabel) coverUploaderLabel.style.display = 'none';
                    if (deleteCoverBtn) deleteCoverBtn.style.display = 'flex';
                } catch (err) {
                    showNotification("فشل تعديل ومعاينة صورة غلاف المتجر الحالية", "error");
                }
            }
        };
    }

    if (deleteCoverBtn) {
        deleteCoverBtn.onclick = (e) => {
            e.stopPropagation();
            selectedCoverBase64 = null;
            if (storeImg) {
                storeImg.src = "";
                storeImg.style.display = 'none';
            }
            if (placeholderIcon) placeholderIcon.style.display = 'block';
            if (coverUploaderLabel) coverUploaderLabel.style.display = 'block';
            deleteCoverBtn.style.display = 'none';
            if (fileInput) fileInput.value = "";
        };
    }

    // إدارة معرض المنتجات الحصري للتاجر (إضافة، معاينة، وحذف ديناميكي موحد)
    if (storePhotosGrid) {
        const addPhotoBtn = storePhotosGrid.querySelector('.add-photo-btn') || document.createElement('div');
        if (!storePhotosGrid.querySelector('.add-photo-btn')) {
            addPhotoBtn.className = 'add-photo-btn';
            addPhotoBtn.innerHTML = '<i class="fas fa-plus-circle"></i>';
            storePhotosGrid.appendChild(addPhotoBtn);
        }

        addPhotoBtn.onclick = () => galleryInput && galleryInput.click();

        if (galleryInput) {
            galleryInput.onchange = async (e) => {
                const files = Array.from(e.target.files);
                for (const file of files) {
                    try {
                        const base64 = await processImage(file, 800, 0.6);
                        const imgId = 'prod_' + Date.now() + Math.random().toString(36).substr(2, 5);
                        storePhotos.push({ id: imgId, base64: base64 });
                    } catch (err) {
                        showNotification("فشل رفع صورة من باقة المنتجات المحددة", "error");
                    }
                }
                renderStoreGallery();
                galleryInput.value = "";
            };
        }
    }

    function renderStoreGallery() {
        const items = storePhotosGrid.querySelectorAll('.img-item');
        items.forEach(i => i.remove());
        
        storePhotos.forEach(img => {
            const div = document.createElement('div');
            div.className = 'img-item';
            div.innerHTML = `
                <img src="${img.base64}">
                <span class="delete-img">&times;</span>
            `;
            div.querySelector('.delete-img').onclick = () => {
                removeImageFromGallery(img.id, storePhotos, storePhotosGrid, (updatedArr) => {
                    storePhotos = updatedArr;
                    renderStoreGallery();
                });
            };
            storePhotosGrid.insertBefore(div, storePhotosGrid.querySelector('.add-photo-btn'));
        });
    }

    // إدارة مستندات السجل التجاري والشهادات للتاجر بطريقة مطابقة ومحسنة
    if (certPhotosGrid) {
        const addCertCard = document.createElement('div');
        addCertCard.className = 'add-photo-btn';
        addCertCard.innerHTML = '<i class="fas fa-plus-circle"></i><span style="font-size:0.7rem; display:block;">أضف وثيقة</span>';
        
        if (certPhotosGrid.children.length === 0) {
            certPhotosGrid.appendChild(addCertCard);
        }

        addCertCard.onclick = () => certFileInput && certFileInput.click();

        if (certFileInput) {
            certFileInput.onchange = async (e) => {
                const files = Array.from(e.target.files);
                for (const file of files) {
                    try {
                        const base64 = await processImage(file, 800, 0.7);
                        const imgId = 'store_cert_' + Date.now() + Math.random().toString(36).substr(2, 5);
                        storeCertificates.push({ id: imgId, base64: base64 });
                    } catch (err) {
                        showNotification("فشل معالجة وثيقة السجل التجاري الحالية", "error");
                    }
                }
                renderStoreCertificates();
                certFileInput.value = "";
            };
        }
    }

    function renderStoreCertificates() {
        const items = certPhotosGrid.querySelectorAll('.img-item');
        items.forEach(i => i.remove());

        storeCertificates.forEach(img => {
            const div = document.createElement('div');
            div.className = 'img-item';
            div.innerHTML = `
                <img src="${img.base64}">
                <span class="delete-img">&times;</span>
            `;
            div.querySelector('.delete-img').onclick = () => {
                removeImageFromGallery(img.id, storeCertificates, certPhotosGrid, (updatedArr) => {
                    storeCertificates = updatedArr;
                    renderStoreCertificates();
                });
            };
            certPhotosGrid.insertBefore(div, certPhotosGrid.querySelector('.add-photo-btn'));
        });
    }

    // معالجة وحفظ النموذج النهائي للمتجر
    if (setupForm) {
        setupForm.onsubmit = async (e) => {
            e.preventDefault();
            if (!currentUid) return;

            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تهيئة الحساب التجاري...';

            try {
                const finalData = {
                    about: document.getElementById('storeAbout').value.trim() || "",
                    licenseNumber: document.getElementById('licenseText').value.trim() || "",
                    onboardingStatus: "completed",
                    updatedAt: new Date()
                };

                if (selectedCoverBase64) finalData.coverImage = selectedCoverBase64;
                if (storePhotos.length > 0) finalData.gallery = storePhotos.map(p => p.base64);
                if (storeCertificates.length > 0) finalData.certificates = storeCertificates.map(c => c.base64);

                await setDoc(doc(db, "stores", currentUid), finalData, { merge: true });
                await updateDoc(doc(db, "users", currentUid), { 
                    status: "active", 
                    onboardingStatus: "completed" 
                });

                showNotification("تم تنشيط ملف المتجر التجاري بالكامل", "success");
                setTimeout(() => {
                    window.location.replace("../profiles/profile-store.html");
                }, 1500);
            } catch (error) {
                console.error("خطأ أثناء تهيئة المتجر التجاري التابع للتاجر:", error);
                showNotification("حدث خطأ أثناء حفظ الملف الفني، يرجى مراجعة البيانات", "error");
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'حفظ وإنشاء الملف الشخصي';
            }
        };
    }

    // تشغيل زر التخطي الاختياري لحساب المتجر
    if (skipBtn) {
        skipBtn.onclick = async (e) => {
            e.preventDefault();
            if (!currentUid) return;

            skipBtn.disabled = true;
            skipBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التخطي...';

            try {
                await setDoc(doc(db, "stores", currentUid), {
                    onboardingStatus: "completed",
                    updatedAt: new Date()
                }, { merge: true });

                await updateDoc(doc(db, "users", currentUid), { 
                    status: "active",
                    onboardingStatus: "completed"
                });

                window.location.replace("../profiles/profile-store.html");
            } catch (err) {
                console.error("خطأ أثناء عملية تخطي المتجر المؤقتة:", err);
                showNotification("حدث خطأ ما، يرجى المحاولة لاحقاً", "error");
                skipBtn.disabled = false;
                skipBtn.innerHTML = 'تخطي هذه الخطوة مؤقتاً';
            }
        };
    }
});
