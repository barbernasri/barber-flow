/**
 * منطق صفحة المتجر - جلب وتصفية المنتجات
 * المسار: home/js/explore-store.js
 */
import { db } from "../../core/firebase-init.js";
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let allProducts = [];
const grid = document.getElementById('productsGrid');
const searchInput = document.getElementById('searchInput');
const catButtons = document.querySelectorAll('.cat-btn');

// === 1. جلب جميع المنتجات ===
async function fetchProducts() {
    try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        
        allProducts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderProducts(allProducts);
        
    } catch (err) {
        console.error('[Store] خطأ في جلب المنتجات:', err);
        grid.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>تعذر تحميل المنتجات. تحقق من الاتصال.</p>
                <button onclick="location.reload()">إعادة المحاولة</button>
            </div>`;
    }
}

// === 2. عرض المنتجات ===
function renderProducts(products) {
    if (products.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <p>لا توجد منتجات مطابقة لبحثك</p>
            </div>`;
        return;
    }

    grid.innerHTML = products.map(p => `
        <div class="product-card" data-id="${p.id}">
            <div class="product-img-wrapper">
                <img src="${p.imageUrl || '../../assets/images/product-placeholder.png'}" alt="${p.name}" loading="lazy">
                ${p.discount ? `<span class="discount-badge">-${p.discount}%</span>` : ''}
            </div>
            <div class="product-details">
                <span class="product-category">${getCategoryName(p.category)}</span>
                <h3 class="product-name">${p.name}</h3>
                <div class="product-footer">
                    <div class="price-group">
                        ${p.oldPrice ? `<span class="old-price">${p.oldPrice} د.م.</span>` : ''}
                        <span class="current-price">${p.price} د.م.</span>
                    </div>
                    <button class="add-to-cart-btn" onclick="addToCart('${p.id}')">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// === 3. التصفية والبحث ===
function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const activeCat = document.querySelector('.cat-btn.active')?.dataset.cat || 'all';

    const filtered = allProducts.filter(p => {
        const matchesSearch = p.name?.toLowerCase().includes(searchTerm) || 
                              p.brand?.toLowerCase().includes(searchTerm);
        const matchesCat = activeCat === 'all' || p.category === activeCat;
        return matchesSearch && matchesCat;
    });

    renderProducts(filtered);
}

// === مستمعي الأحداث ===
searchInput.addEventListener('input', filterProducts);

catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        catButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterProducts();
    });
});

// === دوال مساعدة ===
function getCategoryName(cat) {
    const map = {
        tools: 'أدوات', cosmetics: 'مستحضرات', haircare: 'شعر',
        skincare: 'بشرة', accessories: 'إكسسوارات'
    };
    return map[cat] || cat || 'عام';
}

// مؤقت - إضافة للسلة
window.addToCart = (productId) => {
    alert('تمت الإضافة للسلة! (قيد التطوير)');
    // TODO: تنفيذ منطق السلة الحقيقي
};

// === البدء ===
fetchProducts();

