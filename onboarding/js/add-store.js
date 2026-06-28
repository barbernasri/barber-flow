import { auth, db } from "../../core/firebase-init.js";
import { doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "../../auth/js/notifications.js";

const categoriesContainer = document.getElementById('categoriesContainer');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const daysContainer = document.getElementById('daysSelector');
const storeForm = document.getElementById('addStoreForm');

const days = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
let selectedDays = [];
let currentUser = null;

// حماية متكاملة للجلسة لمنع ضياع حالة التاجر أثناء تعبئة بيانات المحل
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.replace("../../register/login.html");
        return;
    }
    
    currentUser = user;

    // بناء واجهة شيبس الأيام تفاعلياً داخل النطاق الآمن
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

    // إضافة الأقسام التجارية ديناميكياً بشكل متوافق تماماً مع الصالون
    if (addCategoryBtn && categoriesContainer) {
        addCategoryBtn.onclick = (e) => {
            e.preventDefault();
            const div = document.createElement('div');
            div.className = 'input-group dynamic-item';
            div.style = "display: flex; gap: 10px; margin-bottom: 10px; align-items: center;";
            
            div.innerHTML = `
                <input type="text" class="category-name" placeholder="مثال: أدوات كهربائية، كريمات..." style="flex:1;" required>
                <button type="button" class="delete-btn" style="background:#ff4d4d; color:white; border:none; border-radius:6px; padding:10px; cursor:pointer;"><i class="fas fa-trash"></i></button>
            `;
            
            div.querySelector('.delete-btn').addEventListener('click', () => div.remove());
            categoriesContainer.appendChild(div);
        };
    }

    // إرسال وحفظ نموذج المتجر التجاري بشكل نظيف
    if (storeForm) {
        storeForm.onsubmit = async (e) => {
            e.preventDefault();
            if (!currentUser) {
                showNotification("فقدان في تهيئة الاتصال بالجلسة، يرجى التحديث", "error");
                return;
            }

            const btn = document.getElementById('submitBtn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري حفظ المتجر...';

            try {
                const categoriesArray = Array.from(categoriesContainer.querySelectorAll('.category-name')).map(i => i.value.trim());

                await setDoc(doc(db, "stores", currentUser.uid), {
                    storeName: document.getElementById('storeName').value.trim(),
                    location: document.getElementById('storeLocation').value.trim(),
                    deliveryType: document.getElementById('deliveryType').value,
                    categories: categoriesArray,
                    workDays: selectedDays,
                    workingHours: {
                        open: document.getElementById('openTime').value,
                        close: document.getElementById('closeTime').value
                    },
                    onboardingStatus: "basic_done",
                    updatedAt: new Date()
                }, { merge: true });

                await updateDoc(doc(db, "users", currentUser.uid), { onboardingStatus: "basic_done" });
                
                // تمرير مباشر لصفحة الإعداد الفني للمظهر التابعة للتاجر
                window.location.href = "setup-store.html";
            } catch (error) {
                console.error("Store profile configuration failure:", error);
                showNotification("حدث خطأ أثناء حفظ الملف التجاري للمتجر", "error");
                btn.disabled = false;
                btn.innerHTML = 'حفظ ومتابعة إعداد المنتجات';
            }
        };
    }
});
