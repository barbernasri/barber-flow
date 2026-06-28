/**
حزمة استكشاف وعرض الصالونات
المسار: home/js/explore-salon.js
*/
import { db } from "../../core/firebase-init.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { createSalonCard } from "../components/js/card-salon.js";

// عناصر DOM
const salonContainer = document.getElementById('salonContainer');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');

/**
عرض هيكل عظمي مؤقت أثناء التحميل
*/
function showSkeleton() {
    if (!salonContainer) return;
    salonContainer.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'salon-card skeleton';
        skeleton.innerHTML = `
            <div class="skeleton-image"></div>
            <div class="skeleton-content">
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
                <div class="skeleton-line"></div>
            </div>
        `;
        salonContainer.appendChild(skeleton);
    }
}

/**
تحميل وعرض الصالونات من قاعدة البيانات
@param {string} filterType - نوع التصفية
@param {string} searchText - نص البحث
*/
async function loadSalons(filterType = 'الكل', searchText = '') {
    try {
        showSkeleton();

        const salonsRef = collection(db, "salons");
        let q = salonsRef;

        // بناء الاستعلام حسب نوع التصفية
        if (filterType === 'المفضلة') {
            q = query(salonsRef, where("isLiked", "==", true));
        } else if (['يونيسكس', 'رجال', 'نسائي', 'أطفال'].includes(filterType)) {
            q = query(salonsRef, where("salonType", "==", filterType));
        }

        const querySnapshot = await getDocs(q);

        if (!salonContainer) return;
        salonContainer.innerHTML = '';

        if (querySnapshot.empty) {
            salonContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>لا توجد صالونات تطابق هذا القسم حالياً.</p>
                </div>
            `;
            return;
        }

        // تحويل البيانات إلى مصفوفة
        let salonsList = querySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        }));

        // ترتيب حسب الأكثر رواجاً
        if (filterType === 'الأكثر رواجاً') {
            salonsList.sort((a, b) => (b.isLiked || 0) - (a.isLiked || 0));
        }

        // تصفية حسب البحث
        const search = searchText.toLowerCase().trim();
        const filteredSalons = salonsList.filter(salonData => {
            const name = (salonData.salonName || "").toLowerCase();
            const location = (salonData.location || "").toLowerCase();
            return !search || name.includes(search) || location.includes(search);
        });

        if (filteredSalons.length === 0) {
            salonContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>لم يتم العثور على صالونات مطابقة لبحثك.</p>
                </div>
            `;
            return;
        }

        // ✅ التحميل المتوازي (أسرع بكثير!)
        const cardPromises = filteredSalons.map(async (salonData) => {
            try {
                return await createSalonCard(salonData, salonData.id);
            } catch (cardError) {
                console.error("خطأ في إنشاء البطاقة:", cardError);
                return null;
            }
        });

        const cards = await Promise.all(cardPromises);
        cards.forEach(card => {
            if (card) salonContainer.appendChild(card);
        });

    } catch (error) {
        console.error("خطأ أثناء جلب البيانات:", error);
        if (salonContainer) {
            salonContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>حدث خطأ أثناء تحميل الصالونات. يرجى المحاولة لاحقاً.</p>
                </div>
            `;
        }
    }
}

// إعداد أزرار التصفية
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.getAttribute('data-type');
        loadSalons(type, searchInput ? searchInput.value : '');
    });
});

// إعداد البحث مع تأخير (Debounce)
if (searchInput) {
    let timeout = null;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const activeBtn = document.querySelector('.filter-btn.active');
            const currentType = activeBtn ? activeBtn.getAttribute('data-type') : 'الكل';
            loadSalons(currentType, e.target.value);
        }, 300);
    });
}

// التحميل الأولي
loadSalons();

