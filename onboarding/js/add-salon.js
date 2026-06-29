/**
 * BarberFlow Pro - صفحة إضافة الصالون
 * المسار: onboarding/add-salon.js
 * 
 * المميزات:
 * - استخدام middleware للتحقق من الجلسة
 * - حماية من فقدان الجلسة أثناء التنقل
 * - حفظ تلقائي للبيانات
 */

import { auth, db } from "../core/firebase-init.js";
import { doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification, showConfirmDialog } from "../auth/js/notifications.js";
import { initializePage } from "../middleware/index.js";

// ============================================
// المتغيرات العامة
// ============================================
const days = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
const daysContainer = document.getElementById('daysSelector');
const servicesContainer = document.getElementById('servicesList');
const addServiceBtn = document.getElementById('addServiceBtn');
const salonForm = document.getElementById('addSalonForm');
const backBtn = document.getElementById('backBtn');
const cancelBtn = document.getElementById('cancelBtn');

let selectedDays = [];
let currentUser = null;
let serviceCounter = 0;

// ============================================
// التحقق من الجلسة عند تحميل الصفحة
// ============================================
async function checkSession() {
    try {
        currentUser = await initializePage('salon');
        
        if (!currentUser) {
            showNotification("الجلسة غير صالحة، يرجى تسجيل الدخول", "error");
            setTimeout(() => {
                window.location.replace("../register/login.html");
            }, 2000);
            return false;
        }

        // التحقق من الدور
        if (currentUser.role !== 'salon') {
            showNotification("هذه الصفحة مخصصة لأصحاب الصالونات فقط", "warning");
            setTimeout(() => {
                window.location.replace("../index.html");
            }, 2000);
            return false;
        }

        return true;
    } catch (error) {
        console.error("خطأ في التحقق من الجلسة:", error);
        return false;
    }
}

// ============================================
// بناء واجهة الأيام
// ============================================
function initDaysGrid() {
    if (!daysContainer || daysContainer.children.length > 0) return;

    days.forEach(day => {
        const chip = document.createElement('div');
        chip.className = 'day-chip';
        chip.textContent = day;
        
        chip.addEventListener('click', () => {
            chip.classList.toggle('selected');
            
            if (chip.classList.contains('selected')) {
                if (!selectedDays.includes(day)) {
                    selectedDays.push(day);
                }
            } else {
                selectedDays = selectedDays.filter(d => d !== day);
            }
        });
        
        daysContainer.appendChild(chip);
    });
}

// ============================================
// إضافة الخدمات ديناميكياً
// ============================================
function addServiceField() {
    serviceCounter++;
    
    const div = document.createElement('div');
    div.className = 'service-item';
    div.dataset.serviceId = serviceCounter;
    
    div.innerHTML = `
        <div class="service-fields">
            <div class="input-group">
                <label>اسم الخدمة</label>
                <input 
                    type="text" 
                    class="service-name" 
                    placeholder="مثال: حلاقة شعر"
                    required
                >
            </div>
            <div class="input-group">
                <label>الثمن (DH)</label>
                <input 
                    type="number" 
                    class="service-price" 
                    placeholder="50"
                    min="0"
                    step="0.01"
                    required
                >
            </div>
        </div>
        <button type="button" class="delete-service-btn" aria-label="حذف الخدمة">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    // حدث حذف الخدمة
    const deleteBtn = div.querySelector('.delete-service-btn');
    deleteBtn.onclick = () => {
        div.remove();
        showNotification("تم حذف الخدمة", "info");
    };
    
    servicesContainer.appendChild(div);
    showNotification("تمت إضافة خدمة جديدة", "success");
}

// ============================================
// جمع بيانات الخدمات
// ============================================
function collectServices() {
    const serviceItems = servicesContainer.querySelectorAll('.service-item');
    const services = [];
    
    serviceItems.forEach(item => {
        const name = item.querySelector('.service-name').value.trim();
        const price = parseFloat(item.querySelector('.service-price').value);
        
        if (name && !isNaN(price)) {
            services.push({ name, price });
        }
    });
    
    return services;
}

// ============================================
// حفظ البيانات في Firestore
// ============================================
async function saveSalonData() {
    if (!currentUser) {
        showNotification("الجلسة غير صالحة", "error");
        return false;
    }

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري حفظ البيانات...';

    try {
        // جمع البيانات
        const salonName = document.getElementById('salonName').value.trim();
        const location = document.getElementById('salonLocation').value.trim();
        let phone = document.getElementById('salonPhone').value.trim();
        const salonType = document.getElementById('salonType').value;
        const bookingType = document.querySelector('input[name="bookingType"]:checked').value;
        const openTime = document.getElementById('openTime').value;
        const closeTime = document.getElementById('closeTime').value;
        const services = collectServices();

        // التحقق من البيانات
        if (!salonName || !location || !phone || !salonType) {
            showNotification("يرجى ملء جميع الحقول المطلوبة", "error");
            btn.disabled = false;
            btn.innerHTML = '<span>حفظ ومتابعة الإعداد</span> <i class="fas fa-arrow-left"></i>';
            return false;
        }

        if (services.length === 0) {
            showNotification("يرجى إضافة خدمة واحدة على الأقل", "error");
            btn.disabled = false;
            btn.innerHTML = '<span>حفظ ومتابعة الإعداد</span> <i class="fas fa-arrow-left"></i>';
            return false;
        }

        if (selectedDays.length === 0) {
            showNotification("يرجى اختيار يوم عمل واحد على الأقل", "error");
            btn.disabled = false;
            btn.innerHTML = '<span>حفظ ومتابعة الإعداد</span> <i class="fas fa-arrow-left"></i>';
            return false;
        }

        // تنسيق رقم الهاتف
        if (phone.startsWith('06') || phone.startsWith('07')) {
            phone = '+212' + phone.substring(1);
        }

        // حفظ البيانات في Firestore
        await setDoc(doc(db, "salons", currentUser.uid), {
            salonName,
            location,
            phone,
            salonType,
            services,
            bookingType,
            workDays: selectedDays,
            workingHours: {
                open: openTime,
                close: closeTime
            },
            onboardingStatus: "basic_done",
            updatedAt: new Date()
        }, { merge: true });

        // تحديث مستند المستخدم
        await updateDoc(doc(db, "users", currentUser.uid), {
            onboardingStatus: "basic_done",
            updatedAt: new Date()
        });

        showNotification("تم حفظ بيانات الصالون بنجاح! 🎉", "success");
        
        // حفظ حالة الجلسة
        sessionStorage.setItem('salonSetupCompleted', 'true');
        sessionStorage.setItem('lastActivePage', 'add-salon');
        
        setTimeout(() => {
            window.location.href = "setup-salon.html";
        }, 1500);
        
        return true;

    } catch (error) {
        console.error("خطأ في حفظ بيانات الصالون:", error);
        showNotification("حدث خطأ أثناء الحفظ، يرجى المحاولة مرة أخرى", "error");
        btn.disabled = false;
        btn.innerHTML = '<span>حفظ ومتابعة الإعداد</span> <i class="fas fa-arrow-left"></i>';
        return false;
    }
}

// ============================================
// إلغاء وحذف الحساب
// ============================================
async function cancelAndDeleteAccount() {
    const confirmed = await showConfirmDialog("هل أنت متأكد من حذف حسابك؟ هذا الإجراء لا يمكن التراجع عنه!");
    
    if (!confirmed) return;

    if (!currentUser) {
        showNotification("الجلسة غير صالحة", "error");
        return;
    }

    try {
        // حذف مستند الصالون
        await setDoc(doc(db, "salons", currentUser.uid), {
            deleted: true,
            deletedAt: new Date()
        }, { merge: true });

        // تحديث حالة المستخدم
        await updateDoc(doc(db, "users", currentUser.uid), {
            status: "deleted",
            deletedAt: new Date()
        });

        // تسجيل الخروج
        await signOut(auth);
        
        showNotification("تم حذف الحساب بنجاح", "success");
        setTimeout(() => {
            window.location.replace("../index.html");
        }, 2000);

    } catch (error) {
        console.error("خطأ في حذف الحساب:", error);
        showNotification("فشل حذف الحساب، يرجى المحاولة مرة أخرى", "error");
    }
}

// ============================================
// حماية من فقدان الجلسة
// ============================================
window.addEventListener('beforeunload', (e) => {
    if (currentUser) {
        sessionStorage.setItem('lastActivePage', 'add-salon');
        sessionStorage.setItem('sessionTimestamp', Date.now().toString());
        
        // حفظ البيانات المؤقتة
        const formData = {
            salonName: document.getElementById('salonName').value,
            location: document.getElementById('salonLocation').value,
            phone: document.getElementById('salonPhone').value,
            salonType: document.getElementById('salonType').value,
            selectedDays,
            services: collectServices()
        };
        
        sessionStorage.setItem('salonDraft', JSON.stringify(formData));
    }
});

// استعادة البيانات المؤقتة عند تحميل الصفحة
window.addEventListener('load', () => {
    const draft = sessionStorage.getItem('salonDraft');
    if (draft) {
        try {
            const formData = JSON.parse(draft);
            
            document.getElementById('salonName').value = formData.salonName || '';
            document.getElementById('salonLocation').value = formData.location || '';
            document.getElementById('salonPhone').value = formData.phone || '';
            document.getElementById('salonType').value = formData.salonType || '';
            
            // استعادة الأيام المحددة
            if (formData.selectedDays) {
                formData.selectedDays.forEach(day => {
                    const chip = Array.from(daysContainer.children).find(c => c.textContent === day);
                    if (chip) {
                        chip.classList.add('selected');
                        if (!selectedDays.includes(day)) {
                            selectedDays.push(day);
                        }
                    }
                });
            }
            
            // استعادة الخدمات
            if (formData.services) {
                formData.services.forEach(service => {
                    addServiceField();
                    const lastService = servicesContainer.lastElementChild;
                    if (lastService) {
                        lastService.querySelector('.service-name').value = service.name;
                        lastService.querySelector('.service-price').value = service.price;
                    }
                });
            }
            
            showNotification("تم استعادة البيانات المحفوظة", "info");
        } catch (error) {
            console.error("خطأ في استعادة البيانات:", error);
        }
    }
});

// ============================================
// تهيئة الأحداث
// ============================================
async function init() {
    const sessionValid = await checkSession();
    if (!sessionValid) return;

    // بناء واجهة الأيام
    initDaysGrid();

    // إضافة خدمة أولية
    if (servicesContainer.children.length === 0) {
        addServiceField();
    }

    // حدث إضافة خدمة
    if (addServiceBtn) {
        addServiceBtn.onclick = (e) => {
            e.preventDefault();
            addServiceField();
        };
    }

    // حدث إرسال النموذج
    if (salonForm) {
        salonForm.onsubmit = async (e) => {
            e.preventDefault();
            await saveSalonData();
        };
    }

    // زر العودة
    if (backBtn) {
        backBtn.onclick = () => {
            window.history.back();
        };
    }

    // زر إلغاء الحساب
    if (cancelBtn) {
        cancelBtn.onclick = cancelAndDeleteAccount;
    }
}

// تشغيل التهيئة
init();

