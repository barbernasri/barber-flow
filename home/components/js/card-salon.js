/**
حزمة إدارة مكون بطاقة الصالون
المسار: home/components/js/card-salon.js
*/
import { db } from "../../../core/firebase-init.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ✅ Template HTML مدمج مباشرة (لا حاجة لملف منفصل)
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
إنشاء بطاقة صالون
@param {Object} salon - بيانات الصالون
@param {string} id - معرف الصالون
@returns {HTMLElement|null}
*/
export async function createSalonCard(salon, id) {
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
        // صورة الغلاف - مع أيقونة بديلة
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

        // زر الإعجاب
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

        // زر عرض التفاصيل - رابط مباشر مع مسار نسبي
        const viewDetailsBtn = card.querySelector('.view-details-btn');
        if (viewDetailsBtn) {
            viewDetailsBtn.href = `details-salon.html?id=${salonId}`;
            
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

