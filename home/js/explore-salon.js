/**
حزمة استكشاف وعرض الصالونات
المسار: home/js/explore-salon.js
*/
import { db } from "../../core/firebase-init.js";
import { collection, getDocs, query, where, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// عناصر DOM
const salonContainer = document.getElementById('salonContainer');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');

// ✅ Template HTML للبطاقة (مدمج مباشرة - لا حاجة لملف منفصل)
const SALON_CARD_TEMPLATE = `
<div class="salon-card">
    <div class="card-image-container">
        <div class="salon-img-placeholder">
            <i class="fas fa-store"></i>
        </div>
        <img class="salon-img" alt="صورة الصالون" style="display:none;" />
        <button class="heart-btn" aria-label="إضافة للمفضلة">
            <i class="heart-icon far fa-heart"></i>
        </button>
        <span class="status-badge open">مفتوح الآن</span>
    </div>
    <div class="card-content">
        <h3 class="salon-name">اسم الصالون</h3>
        <div class="card-info">
            <div class="info-item">
                <i class="fas fa-star"></i>
                <span class="rating-value">5.0</span>
            </div>
            <div class="info-item">
                <i class="fas fa-map-marker-alt"></i>
                <span class="location-val">الموقع</span>
            </div>
        </div>
        <div class="card-footer">
            <div class="price-info">
                <span class="label">يبدأ من</span>
                <span class="amount">0 DH</span>
            </div>
            <a class="view-details-btn" href="#">التفاصيل</a>
        </div>
    </div>
</div>
`;

/**
✅ إنشاء بطاقة صالون (مدمجة مباشرة)
*/
function createSalonCard(salon, id) {
    const salonId = id || salon?.id;
    if (!salonId) {
        console.error('[Card] ❌ المعرف (id) غير مُعرّف!');
        return null;
    }

    // إنشاء العنصر من الـ template
    const parser = new DOMParser();
    const doc = parser.parseFromString(SALON_CARD_TEMPLATE, 'text/html');
    const card = doc.querySelector('.salon-card');

    try {
        // ✅ صورة الغلاف - مع أيقونة بديلة
        const img = card.querySelector('.salon-img');
        const placeholder = card.querySelector('.salon-img-placeholder');
        
        if (img && placeholder) {
            if (salon.coverImage) {
                img.src = salon.coverImage;
                img.style.display = 'block';
                placeholder.style.display = 'none';
                
                img.onerror = () => {
                    img.style.display = 'none';
                    placeholder.style.display = 'flex';
                    img.onerror = null;
                };
            } else {
                img.style.display = 'none';
                placeholder.style.display = 'flex';
            }
        }

        // اسم الصالون
        const nameElement = card.querySelector('.salon-name');
        if (nameElement) {
            nameElement.textContent = salon.salonName || "صالون غير مسمى";
        }

        // الموقع
        const locationElement = card.querySelector('.location-val');
        if (locationElement) {
            locationElement.textContent = salon.location || "الموقع غير محدد";
        }

        // التقييم
        const ratingElement = card.querySelector('.rating-value');
        if (ratingElement) {
            ratingElement.textContent = salon.rating || "5.0";
        }

        // أقل سعر
        const minPriceElement = card.querySelector('.amount');
        if (minPriceElement) {
            let minPrice = "0";
            if (salon.services && salon.services.length > 0) {
                const prices = salon.services.map(s => parseFloat(s.price) || 0);
                minPrice = Math.min(...prices).toString();
            }
            minPriceElement.textContent = `${minPrice} DH`;
        }

        // حالة الصالون
        const statusBadge = card.querySelector('.status-badge');
        if (statusBadge) {
            const isOpen = isSalonOpen(salon.workingHours);
            statusBadge.textContent = isOpen ? 'مفتوح الآن' : 'مغلق حالياً';
            statusBadge.className = `status-badge ${isOpen ? 'open' : 'closed'}`;
        }

        // ✅ زر الإعجاب
        const heartBtn = card.querySelector('.heart-btn');
        const heartIcon = heartBtn?.querySelector('.heart-icon');
        let isLiked = Boolean(salon.isLiked);

        const updateHeartUI = (liked) => {
            if (heartIcon) {
                heartIcon.classList.toggle('fas', liked);
                heartIcon.classList.toggle('far', !liked);
            }
        };

        updateHeartUI(isLiked);

        if (heartBtn) {
            heartBtn.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                isLiked = !isLiked;
                updateHeartUI(isLiked);

                try {
                    await updateDoc(doc(db, "salons", salonId), { isLiked: isLiked });
                    salon.isLiked = isLiked;
                } catch (err) {
                    console.error("Error updating favorite:", err);
                    isLiked = !isLiked;
                    updateHeartUI(isLiked);
                }
            };
        }

        // ✅ زر عرض التفاصيل - رابط مباشر مع مسار نسبي
        const viewDetailsBtn = card.querySelector('.view-details-btn');
        if (viewDetailsBtn) {
            // ✅ استخدام مسار نسبي بسيط (نفس المجلد)
            viewDetailsBtn.href = `details-salon.html?id=${salonId}`;
            
            // منع انتشار الحدث
            viewDetailsBtn.onclick = (e) => {
                e.stopPropagation();
            };
        }

        return card;
    } catch (error) {
        console.error("Critical Processing Error:", error);
        return null;
    }
}

/**
التحقق من حالة الصالون (مفتوح/مغلق)
*/
function isSalonOpen(hours) {
    if (!hours?.open || !hours?.close) return true;
    const now = new Date();
    const curr = now.getHours() * 60 + now.getMinutes();
    const [oh, om] = hours.open.split(':').map(Number);
    const [ch, cm] = hours.close.split(':').map(Number);
    const ot = oh * 60 + om;
    const ct = ch * 60 + cm;
    return ct > ot ? (curr >= ot && curr < ct) : (curr >= ot || curr < ct);
}

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
                return createSalonCard(salonData, salonData.id);
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

