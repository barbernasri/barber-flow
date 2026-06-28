import { auth, db } from "../../core/firebase-init.js";
import { doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "../../auth/js/notifications.js";

const days = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
const daysContainer = document.getElementById('daysSelector');
const servicesContainer = document.getElementById('servicesList');
const addServiceBtn = document.getElementById('addServiceBtn');
const salonForm = document.getElementById('addSalonForm');

let selectedDays = [];
let currentUser = null;

/**
 * بناء ورقاقات الأيام برمجياً بشكل مستقر لمرة واحدة فور جاهزية الهيكل
 */
function initDaysGrid() {
    if (daysContainer && daysContainer.children.length === 0) {
        days.forEach(day => {
            const chip = document.createElement('div');
            chip.className = 'day-chip';
            chip.style.cursor = 'pointer';
            chip.innerText = day;
            chip.addEventListener('click', () => {
                chip.classList.toggle('selected');
                if (chip.classList.contains('selected')) {
                    if (!selectedDays.includes(day)) selectedDays.push(day);
                } else {
                    selectedDays = selectedDays.filter(d => d !== day);
                }
            });
            daysContainer.appendChild(chip);
        });
    }
}

/**
 * تهيئة كافة أحداث واجهة المستخدم الثابتة
 */
function setupUserInterfaceEvents() {
    // إضافة الخدمات ديناميكياً
    if (addServiceBtn && servicesContainer) {
        addServiceBtn.onclick = (e) => {
            e.preventDefault();
            const div = document.createElement('div');
            div.className = 'input-group dynamic-item';
            div.style = "display: grid; grid-template-columns: 1fr 1fr auto; gap: 10px; margin-bottom: 10px; align-items: center;";
            
            div.innerHTML = `
                <input type="text" class="service-name" placeholder="اسم الخدمة (مثال: حلاقة شعر)" required>
                <input type="number" class="service-price" placeholder="الثمن (DH)" required>
                <button type="button" class="delete-btn" style="background:#ff4d4d; color:white; border:none; border-radius:6px; padding:10px; cursor:pointer;"><i class="fas fa-trash"></i></button>
            `;
            
            div.querySelector('.delete-btn').addEventListener('click', () => div.remove());
            servicesContainer.appendChild(div);
        };
    }

    // إرسال ومعالجة بيانات النموذج الأساسي لمرة واحدة
    if (salonForm) {
        salonForm.onsubmit = async (e) => {
            e.preventDefault();
            
            if (!currentUser) {
                showNotification("انتهت الجلسة الأمنية، يرجى إعادة تسجيل الدخول", "error");
                return;
            }

            const btn = document.getElementById('submitBtn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري حفظ البيانات...';

            let phone = document.getElementById('salonPhone').value.trim();
            if (phone.startsWith('06') || phone.startsWith('07')) {
                phone = '+212' + phone.substring(1);
            }

            const serviceItems = servicesContainer.querySelectorAll('.dynamic-item');
            const services = Array.from(serviceItems).map(item => ({
                name: item.querySelector('.service-name').value.trim(),
                price: parseFloat(item.querySelector('.service-price').value)
            }));

            try {
                // حفظ مستند الصالون بـ UID الحقيقي المشفر للمستخدِم لمنع ضياع الجلسات
                await setDoc(doc(db, "salons", currentUser.uid), {
                    salonName: document.getElementById('salonName').value.trim(),
                    location: document.getElementById('salonLocation').value.trim(),
                    phone: phone,
                    salonType: document.getElementById('salonType').value,
                    services: services,
                    bookingType: document.getElementById('bookingType').value,
                    workDays: selectedDays,
                    workingHours: { 
                        open: document.getElementById('openTime').value, 
                        close: document.getElementById('closeTime').value 
                    },
                    onboardingStatus: "basic_done"
                }, { merge: true });

                // تحديث جدول المستخدمين العام لتمكين التعرف الفوري من الـ router.js
                await updateDoc(doc(db, "users", currentUser.uid), { onboardingStatus: "basic_done" });
                
                window.location.href = "setup-salon.html";
            } catch (err) {
                console.error("Salon setup saving process encountered an error:", err);
                showNotification("خطأ في الحفظ، يرجى المحاولة لاحقاً", "error");
                btn.disabled = false;
                btn.innerHTML = 'حفظ ومتابعة الإعداد';
            }
        };
    }
}

// تشغيل البناء فور استقرار الـ DOM لحماية الواجهة من الاختفاء
initDaysGrid();
setupUserInterfaceEvents();

// مراقب الجلسة الأمنية المنفصل والمسؤول فقط عن التحقق والتوثيق المباشر
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.replace("../../register/login.html");
        return;
    }
    currentUser = user;
});
