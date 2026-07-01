/**
 * BarberFlow Pro - المنطق الرئيسي للصفحة الرئيسية
 * المسار: home/js/index.js
 */

import { db } from "../../core/firebase-init.js";
import { 
    collection, 
    getDocs, 
    query, 
    where, 
    limit,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { createSalonCard } from "../components/js/card-salon.js";
import { createStoreCard } from "../components/js/card-store.js";
import { createOfferCard } from "../components/js/card-offer.js";
import { createConciergeCard } from "../components/js/card-Concierge.js";
import { showNotification } from "../../auth/js/notifications.js";

// ============================================
// المتغيرات العامة
// ============================================
let allSalons = [];
let allStores = [];
let currentSalonFilter = 'all';
let currentStoreFilter = 'all';

// ============================================
// بيانات العروض الثابتة (يمكن نقلها لـ Firestore لاحقاً)
// ============================================
const OFFERS_DATA = [
    {
        id: 1,
        discount: "خصم 20%",
        title: "أول حجز لك معنا",
        description: "احجز موعدك الأول في أي صالون VIP واحصل على خصم فوري ومباشر.",
        ctaText: "احجز الآن",
        ctaLink: "home/explore-salon.html",
        icon: "fa-cut"
    },
    {
        id: 2,
        discount: "شحن مجاني",
        title: "باقة العناية المتكاملة",
        description: "اطلب منتجات بقيمة 300 درهم أو أكثر واحصل على توصيل مجاني.",
        ctaText: "تصفح المتجر",
        ctaLink: "home/explore-store.html",
        icon: "fa-truck"
    },
    {
        id: 3,
        discount: "خصم 35%",
        title: "باقة العروس",
        description: "خصومات حصرية تصل إلى 35% على خدمات تصفيف الشعر والمكياج المتكامل.",
        ctaText: "اكتشفي العروض",
        ctaLink: "home/explore-salon.html?type=women",
        icon: "fa-gem"
    },
    {
        id: 4,
        discount: "هدية مجانية",
        title: "كوبون متجدد",
        description: "احصل على مستحضر مجاني للعناية بالبشرة عند حجز خدمات تزيد عن 200 درهم.",
        ctaText: "استخدم الكوبون",
        ctaLink: "home/explore-store.html?cat=cosmetics",
        icon: "fa-gift"
    }
];

// ============================================
// بيانات الخدمات المنزلية
// ============================================
const CONCIERGE_DATA = [
    {
        id: 1,
        icon: "fa-spa",
        title: "خدمة تصفيف ومكياج للمناسبات",
        description: "نصلك أينما كنتِ بالمنزل أو الفندق بأرقى خدمات التجميل.",
        ctaText: "طلب الخدمة المنزلية",
        ctaLink: "home/home-services.html?id=1"
    },
    {
        id: 2,
        icon: "fa-male",
        title: "جلسات مساج وعناية متكاملة للرجال",
        description: "معدات واحترافية متكاملة في بيتك لتجربة استرخاء فاخرة.",
        ctaText: "طلب الخدمة المنزلية",
        ctaLink: "home/home-services.html?id=2"
    },
    {
        id: 3,
        icon: "fa-child",
        title: "حلاقة أطفال مريحة في المنزل",
        description: "نوفر تجربة حلاقة آمنة وممتعة لأطفالك في بيئة مألوفة.",
        ctaText: "طلب الخدمة المنزلية",
        ctaLink: "home/home-services.html?id=3"
    }
];

// ============================================
// تهيئة الصفحة عند تحميل DOM
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    initializeHeaderScroll();
    initializeSearch();
    initializeFilters();
    
    // تحميل البيانات بالتوازي
    await Promise.all([
        loadSalons(),
        loadStores(),
        renderOffers(),
        renderConciergeServices(),
        loadStatistics()
    ]);
});

// ============================================
// تأثير التمرير على الهيدر
// ============================================
function initializeHeaderScroll() {
    const header = document.getElementById('
