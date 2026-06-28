/**
حزمة عرض تفاصيل الصالون
المسار: home/js/details-salon.js
*/
import { db, auth } from "../../core/firebase-init.js";
import { doc, getDoc, updateDoc, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ✅ تعريف المتغيرات مرة واحدة فقط
const urlParams = new URLSearchParams(window.location.search);
const salonId = urlParams.get('id');
console.log('[Details] 🆔 معرف الصالون المستلم:', salonId);

/**
✅ محاولة العرض الفوري من Cache (قبل تحميل Firebase)
*/
function tryShowFromCache() {
    if (!salonId) return null;
    
    let cachedData = sessionStorage.getItem(`salon_${salonId}`);
    if (!cachedData) {
        cachedData = localStorage.getItem(`salon_full_${salonId}`);
    }
    
    if (cachedData) {
        try {
            const salon = JSON.parse(cachedData);
            console.log('[Details] ✅ Cache موجود، عرض فوري');
            return salon;
        } catch (e) {
            console.warn('[Details] Cache parse error:', e);
        }
    }
    return null;
}

/**
الدالة الرئيسية لبدء التطبيق
*/
async function start() {
    if (!salonId) {
        console.error('[Details] ❌ لا يوجد معرف صالون في الرابط!');
        showErrorPage('الرابط غير صالح، لم يتم تحديد الصالون.');
        return;
    }

    // ✅ محاولة العرض الفوري من Cache أولاً
    const cachedSalon = tryShowFromCache();
    if (cachedSalon && document.getElementById('salonName')) {
        await renderInfo(cachedSalon);
        console.log('[Details] ⚡ تم العرض من Cache');
    }

    // ✅ ثم تحميل البيانات المحدثة من Firebase
    try {
        console.log('[Details] 📡 جاري جلب البيانات المحدثة من Firestore...');
        const snap = await getDoc(doc(db, "salons", salonId));
        
        if (!snap.exists()) {
            // إذا لم يكن هناك Cache، اعرض صفحة خطأ
            if (!cachedSalon) {
                console.error('[Details] ❌ الوثيقة غير موجودة');
                showErrorPage('هذا الصالون غير موجود أو تم حذفه.');
                return;
            }
            console.warn('[Details] ⚠️ الوثيقة غير موجودة، نحتفظ بالـ Cache');
            return;
        }
        
        const data = snap.data();
        console.log('[Details] ✅ تم جلب البيانات المحدثة');
        
        // تحديث العرض بالبيانات الجديدة
        if (document.getElementById('salonName')) {
            await renderInfo(data);
            await fetchReviews();
        } else {
            console.error('[Details] ❌ عناصر HTML غير موجودة!');
        }
        
    } catch (error) {
        console.error('[Details] ❌ خطأ فني:', error);
        // إذا كان لدينا Cache، لا نعرض خطأ
        if (!cachedSalon) {
            showErrorPage('حدث خطأ تقني أثناء تحميل البيانات.');
        }
    }
}

function showErrorPage(message) {
    document.body.innerHTML = `
        <div style="text-align:center; padding:50px; color:#fff; font-family:Tajawal; background:#1a1a1a; height:100vh;">
            <i class="fas fa-exclamation-triangle" style="font-size:3rem; color:#f44; margin-bottom:20px;"></i>
            <h2>${message}</h2>
            <button onclick="window.history.back()" style="padding:10px 20px; margin-top:20px; background:#D4AF37; border:none; border-radius:8px; cursor:pointer; color:#1a1a1a; font-weight:bold;">العودة</button>
        </div>
    `;
}

async function renderInfo(data) {
    console.log('[Details] 🎨 بدء عرض البيانات...');

    // === 1. المعلومات الأساسية ===
    safeSetText('salonName', data.salonName || "صالون غير مسمى");
    safeSetText('salonAbout', data.description || data.about || "مرحباً بكم في صالوننا المميز.");

    const typesContainer = document.getElementById('typesContainer');
    if (typesContainer) {
        const typesHtml = Array.isArray(data.types) 
            ? data.types.map(t => `<span class="category-tag">${t}</span>`).join('')
            : `<span class="category-tag">${data.salonType || data.category || 'عام'}</span>`;
        typesContainer.innerHTML = typesHtml;
    }

    // === 2. صورة الغلاف ===
    const mainImg = data.coverImage || data.imageUrl || data.mainImage;
    const salonImgElement = document.getElementById('salonImage');
    const heroPlaceholder = document.getElementById('heroPlaceholder');

    if (salonImgElement && heroPlaceholder) {
        if (mainImg) {
            salonImgElement.src = mainImg;
            salonImgElement.style.display = 'block';
            heroPlaceholder.style.display = 'none';
        } else {
            salonImgElement.style.display = 'none';
            heroPlaceholder.style.display = 'flex';
        }
    }

    // === 3. شارة التوثيق ===
    const verifiedBadge = document.getElementById('verifiedBadge');
    if (verifiedBadge && data.verified) {
        verifiedBadge.style.display = 'inline-flex';
    }

    // === 4. الموقع ===
    safeSetText('locationValue', data.location || data.address || "غير محدد");

    // === 5. أوقات العمل ===
    const days = Array.isArray(data.workDays || data.workingDays) 
        ? (data.workDays || data.workingDays).join(' - ') 
        : 'غير محدد';
    safeSetText('workingDays', `أيامنا: ${days}`);

    const openTime = data.workingHours?.open || '00:00';
    const closeTime = data.workingHours?.close || '00:00';
    safeSetText('workingHours', `ساعاتنا: من ${openTime} إلى ${closeTime}`);

    const statusBadge = document.getElementById('currentStatusBadge');
    if (statusBadge && data.workingHours?.open && data.workingHours?.close) {
        const now = new Date();
        const curr = now.getHours() * 60 + now.getMinutes();
        const [oh, om] = openTime.split(':').map(Number);
        const [ch, cm] = closeTime.split(':').map(Number);
        const ot = oh * 60 + om, ct = ch * 60 + cm;
        const isOpen = ct > ot ? (curr >= ot && curr < ct) : (curr >= ot || curr < ct);
        
        statusBadge.innerHTML = `<span class="status-tag ${isOpen ? 'is-open' : 'is-closed'}">${isOpen ? 'مفتوح الآن' : 'مغلق حالياً'}</span>`;
    }

    // === 6. أزرار التواصل ===
    const phone = data.phone || "";
    const btnCall = document.getElementById('btnCall');
    const btnWhatsapp = document.getElementById('btnWhatsapp');
    const btnMap = document.getElementById('btnMap');
    const btnEmail = document.getElementById('btnEmail');

    if (btnCall && phone) btnCall.href = `tel:${phone}`;
    if (btnWhatsapp && phone) btnWhatsapp.href = `https://wa.me/${phone.replace('+', '')}`;

    if (btnMap) {
        btnMap.onclick = () => {
            const addr = encodeURIComponent(data.location || data.address);
            window.open(`https://www.google.com/maps/search/?api=1&query=${addr}`, '_blank');
        };
    }

    if (btnEmail && data.email) {
        btnEmail.href = `mailto:${data.email}`;
        btnEmail.style.display = 'flex';
    }

    // === 7. بطاقة صاحب الصالون ===
    const ownerCard = document.getElementById('ownerCard');
    if (ownerCard) {
        try {
            const userSnap = await getDoc(doc(db, "users", salonId));
            if (userSnap.exists()) {
                const userData = userSnap.data();
                if (userData.fullName) {
                    safeSetText('ownerName', userData.fullName);
                    ownerCard.style.display = 'flex';
                    
                    if (userData.createdAt) {
                        const date = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt);
                        safeSetText('ownerSince', `عضو منذ ${date.getFullYear()}`);
                    }
                    
                    if (userData.contactInfo && userData.contactInfo.includes('@') && btnEmail) {
                        btnEmail.href = `mailto:${userData.contactInfo}`;
                        btnEmail.style.display = 'flex';
                    }
                }
            }
        } catch (e) { console.error('Error owner info:', e); }
    }

    // === 8. الخدمات والأسعار ===
    const servicesList = document.getElementById('servicesList');
    if (servicesList) {
        if (data.services && data.services.length > 0) {
            servicesList.innerHTML = data.services.map(s => `
                <div class="service-item">
                    <span class="service-name"><i class="fas fa-check-circle"></i> ${s.name}</span>
                    <span class="service-price">${s.price} DH</span>
                </div>
            `).join('');
        } else {
            servicesList.innerHTML = '<p class="empty-state">لا توجد خدمات مسجلة بعد</p>';
        }
    }

    // === 9. معرض الأعمال ===
    const gallerySlider = document.getElementById('gallerySlider');
    const scrollHint = document.querySelector('.scroll-hint');
    const gallery = data.portfolio || data.gallery;

    if (gallerySlider) {
        if (gallery && gallery.length > 0) {
            gallerySlider.innerHTML = gallery.map(url => `<img src="${url}" alt="معرض الأعمال">`).join('');
            if (scrollHint) scrollHint.style.display = 'block';
        } else {
            gallerySlider.innerHTML = `<div class="gallery-placeholder"><i class="fas fa-images"></i><span>سيتم إضافة صور المعرض قريباً</span></div>`;
            if (scrollHint) scrollHint.style.display = 'none';
        }
    }

    // === 10. الشهادات ===
    const certsContainer = document.getElementById('certificatesContainer');
    if (certsContainer) {
        const certs = data.certificate?.photos || data.certificates;
        if (certs && certs.length > 0) {
            certsContainer.innerHTML = certs.map(url => `
                <img src="${url}" class="cert-img" onclick="window.open('${url}', '_blank')">
            `).join('');
        } else {
            certsContainer.innerHTML = '<p class="empty-state">لا توجد شهادات معروضة</p>';
        }
    }

    // === 11. الإعجاب (Like) ===
    const favBtn = document.getElementById('favBtn');
    if (favBtn) {
        const heartIcon = favBtn.querySelector('i');
        let isLiked = Boolean(data.isLiked);
        
        const updateHeartUI = (liked) => {
            if (heartIcon) {
                heartIcon.classList.toggle('fas', liked);
                heartIcon.classList.toggle('far', !liked);
                if (liked) heartIcon.classList.add('active-heart');
                else heartIcon.classList.remove('active-heart');
            }
        };
        
        updateHeartUI(isLiked);

        favBtn.onclick = async () => {
            isLiked = !isLiked;
            updateHeartUI(isLiked);
            try {
                await updateDoc(doc(db, "salons", salonId), { isLiked });
            } catch (err) {
                console.error('Error updating favorite:', err);
                isLiked = !isLiked;
                updateHeartUI(isLiked);
            }
        };
    }

    // === 12. زر الحجز ===
    const bookingBtn = document.getElementById('mainBookingBtn');
    if (bookingBtn) {
        bookingBtn.onclick = () => {
            window.location.href = `../../customer/booking.html?id=${salonId}`;
        };
    }
}

function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

// === نظام التقييمات ===
async function fetchReviews() {
    const reviewsContainer = document.getElementById('reviewsContainer');
    if (!reviewsContainer) return;
    try {
        const q = query(collection(db, "salons", salonId, "reviews"), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        
        const reviews = snap.docs.map(doc => doc.data());
        
        if (reviews.length === 0) {
            reviewsContainer.innerHTML = '<p class="empty-state">لا توجد تقييمات بعد. كن أول من يقيّم!</p>';
            return;
        }

        reviewsContainer.innerHTML = reviews.map(r => `
            <div class="review-card">
                <div class="review-header">
                    <div class="user-avatar-small"><i class="fas fa-user"></i></div>
                    <div class="review-info">
                        <strong>${r.userName || 'زائر'}</strong>
                    </div>
                </div>
                <p class="review-text">${r.comment}</p>
            </div>
        `).join('');
    } catch (e) {
        console.error('Error fetching reviews:', e);
    }
}

// مستمعات الأحداث للمودال والتقييم
const modal = document.getElementById('reviewModal');
const openReviewBtn = document.getElementById('openReviewModal');
const closeModalBtn = document.getElementById('closeModal');
const submitReviewBtn = document.getElementById('submitReview');

if (openReviewBtn) openReviewBtn.onclick = () => modal.style.display = 'flex';
if (closeModalBtn) closeModalBtn.onclick = () => modal.style.display = 'none';

if (submitReviewBtn) {
    submitReviewBtn.onclick = async () => {
        const text = document.getElementById('reviewText').value.trim();
        if (!text) {
            alert('يرجى كتابة تقييمك');
            return;
        }
        let userName = "زائر";
        if (auth.currentUser) {
            try {
                const uSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
                if (uSnap.exists()) userName = uSnap.data().fullName || "مستخدم";
            } catch (e) {}
        }

        try {
            await addDoc(collection(db, "salons", salonId, "reviews"), {
                userName,
                comment: text,
                timestamp: serverTimestamp()
            });
            modal.style.display = 'none';
            document.getElementById('reviewText').value = "";
            await fetchReviews();
        } catch (e) {
            alert('حدث خطأ في إضافة التقييم');
        }
    };
}

// بدء التطبيق
start();

