/**
 * الملف الرئيسي للصفحة الرئيسية
 * يستدعي الوحدات المنفصلة لجلب وعرض كل نوع من المحتوى
 * المسار: home/js/index.js
 */
import { renderOfferCards } from './components/card-offer.js';
import { renderStoreCards } from './components/card-stor.js';
import { renderConciergeCards } from './components/card-Concierge.js';
import { db } from "../../core/firebase-init.js";
import { collection, getDocs, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { createSalonCard } from "./card.js";

console.log('[Index] 🏠 جاري تحميل الصفحة الرئيسية...');

// ============================
// 1. تحميل العروض
// ============================
async function loadOffers() {
    const container = document.getElementById('offersContainer');
    if (!container) return;
    
    try {
        console.log('[Index] 📦 جاري جلب العروض...');
        const html = await renderOfferCards();
        container.innerHTML = html;
        console.log('[Index] ✅ تم تحميل العروض');
    } catch (error) {
        console.error('[Index] ❌ خطأ في تحميل العروض:', error);
        container.innerHTML = '<p style="color:#999; text-align:center; padding:20px;">تعذر تحميل العروض حالياً</p>';
    }
}

// ============================
// 2. تحميل الصالونات المميزة
// ============================
async function loadFeaturedSalons() {
    const container = document.getElementById('featuredSalonsContainer');
    if (!container) return;
    
    try {
        console.log('[Index] 📦 جاري جلب الصالونات المميزة...');
        const q = query(collection(db, 'salons'), limit(4));
        const snapshot = await getDocs(q);
        
        container.innerHTML = '';
        
        if (snapshot.empty) {
            container.innerHTML = '<p style="color:#999; text-align:center; padding:20px;">لا توجد صالونات مسجلة بعد</p>';
            return;
        }
        
        for (const docSnap of snapshot.docs) {
            const salon = docSnap.data();
            const card = await createSalonCard(salon, docSnap.id);
            if (card) container.appendChild(card);
        }
        
        console.log('[Index] ✅ تم تحميل الصالونات');
    } catch (error) {
        console.error('[Index] ❌ خطأ في تحميل الصالونات:', error);
        container.innerHTML = '<p style="color:#999; text-align:center; padding:20px;">تعذر تحميل الصالونات</p>';
    }
}

// ============================
// 3. تحميل المنتجات المميزة
// ============================
async function loadFeaturedProducts() {
    const container = document.getElementById('featuredProductsContainer');
    if (!container) return;
    
    try {
        console.log('[Index] 📦 جاري جلب المنتجات...');
        const html = await renderStoreCards();
        container.innerHTML = html;
        console.log('[Index] ✅ تم تحميل المنتجات');
    } catch (error) {
        console.error('[Index] ❌ خطأ في تحميل المنتجات:', error);
        container.innerHTML = '<p style="color:#999; text-align:center; padding:20px;">تعذر تحميل المنتجات</p>';
    }
}

// ============================
// 4. تحميل الخدمات المنزلية
// ============================
async function loadConciergeServices() {
    const container = document.getElementById('conciergeContainer');
    if (!container) return;
    
    try {
        console.log('[Index] 📦 جاري جلب الخدمات المنزلية...');
        const html = await renderConciergeCards();
        container.innerHTML = html;
        console.log('[Index] ✅ تم تحميل الخدمات المنزلية');
    } catch (error) {
        console.error('[Index] ❌ خطأ في تحميل الخدمات:', error);
        container.innerHTML = '<p style="color:#999; text-align:center; padding:20px;">تعذر تحميل الخدمات</p>';
    }
}

// ============================
// التشغيل عند جاهزية الصفحة
// ============================
document.addEventListener('DOMContentLoaded', () => {
    loadOffers();
    loadFeaturedSalons();
    loadFeaturedProducts();
    loadConciergeServices();
});

