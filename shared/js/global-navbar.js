/**
 * شريط التنقل العام
 * المسار: shared/js/global-navbar.js
 */
import { auth, db } from "../../core/firebase-init.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { PATHS, resolvePath } from "./paths.js";

// ============================================
// التحميل الأولي
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("global-navbar-container");
    if (!container) return;

    try {
        const currentScriptUrl = new URL(import.meta.url);
        const navbarPath = new URL('../global-navbar.html', currentScriptUrl).href;

        const response = await fetch(navbarPath);
        if (!response.ok) throw new Error("Navbar HTML not found");

        container.innerHTML = await response.text();

        updateAllPaths();
        setupNavigationLogic();
        setupSettingsDropdown();
        setupThemeToggle();
        setupUserState();
        setupCartBadge();
        highlightActivePage();

    } catch (error) {
        console.error("❌ خطأ في تحميل الشريط:", error);
    }
});

// ============================================
// تحديث جميع المسارات
// ============================================
function updateAllPaths() {
    const container = document.getElementById('global-navbar-container');
    if (!container) return;

    const links = container.querySelectorAll('[data-path]');
    links.forEach(link => {
        const key = link.getAttribute('data-path');
        link.setAttribute('href', resolvePath(key));
    });
}

// ============================================
// القائمة الجانبية
// ============================================
function setupNavigationLogic() {
    const menuBtn = document.getElementById("navMenuBtn");
    const closeBtn = document.getElementById("closeMenuBtn");
    const drawer = document.getElementById("sideDrawer");
    const overlay = document.getElementById("drawerOverlay");

    if (!menuBtn || !drawer || !overlay) return;

    const open = () => {
        drawer.classList.add("open");
        overlay.classList.add("active");
        document.body.style.overflow = 'hidden';
    };

    const close = () => {
        drawer.classList.remove("open");
        overlay.classList.remove("active");
        document.body.style.overflow = '';
    };

    menuBtn.onclick = open;
    closeBtn.onclick = close;
    overlay.onclick = close;

    drawer.querySelectorAll('.drawer-link').forEach(link => {
        link.onclick = close;
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('open')) close();
    });
}

// ============================================
// ✅ قائمة الإعدادات المنسدلة
// ============================================
function setupSettingsDropdown() {
    const settingsBtn = document.getElementById('settingsBtn');
    const dropdown = document.getElementById('settingsDropdown');

    if (!settingsBtn || !dropdown) return;

    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('show');
        
        // إغلاق أي قائمة مفتوحة
        document.querySelectorAll('.dropdown-menu.show').forEach(d => {
            d.classList.remove('show');
        });

        if (!isOpen) {
            dropdown.classList.add('show');
        }
    });

    // إغلاق عند النقر خارجاً
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !settingsBtn.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });

    // زر الثيم في القائمة المنسدلة
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            toggleTheme();
            dropdown.classList.remove('show');
        });
    }
}

// ============================================
// تبديل الثيم (يعمل على global.css)
// ============================================
function setupThemeToggle() {
    // تحميل الثيم المحفوظ وتطبيقه
    const savedTheme = localStorage.getItem('bf-theme') || 'dark';
    applyTheme(savedTheme);

    // زر الثيم في القائمة الجانبية
    const drawerThemeBtn = document.getElementById('drawerThemeToggle');
    if (drawerThemeBtn) {
        drawerThemeBtn.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = current === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('bf-theme', newTheme);
}

function applyTheme(theme) {
    // تطبيق على html element (أهم من body)
    document.documentElement.setAttribute('data-theme', theme);
    // تطبيق على body أيضاً
    document.body.setAttribute('data-theme', theme);

    // تحديث أيقونات ونصوص الثيم
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    const drawerThemeText = document.getElementById('drawerThemeText');
    const drawerIcon = document.querySelector('#drawerThemeToggle i');

    if (themeIcon) themeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    if (themeText) themeText.textContent = theme === 'dark' ? 'الوضع الداكن' : 'الوضع الفاتح';
    if (drawerThemeText) drawerThemeText.textContent = theme === 'dark' ? 'الوضع الداكن' : 'الوضع الفاتح';
    if (drawerIcon) drawerIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}

// ============================================
// حالة المستخدم
// ============================================
function setupUserState() {
    const userBtn = document.getElementById('userBtn');
    const drawerUserInfo = document.getElementById('drawerUserInfo');
    const drawerUserName = document.getElementById('drawerUserName');
    const drawerUserRole = document.getElementById('drawerUserRole');
    const drawerProfileLink = document.getElementById('drawerProfileLink');
    const drawerDashboardLink = document.getElementById('drawerDashboardLink');
    const drawerSettingsLink = document.getElementById('drawerSettingsLink');
    const drawerLoginLink = document.getElementById('drawerLoginLink');
    const drawerLogoutLink = document.getElementById('drawerLogoutLink');

    if (!userBtn) return;

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            userBtn.href = resolvePath('PROFILE_CUSTOMER');

            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    const userName = data.fullName || data.displayName || 'مستخدم';
                    const role = data.role || 'customer';

                    if (drawerUserInfo) drawerUserInfo.style.display = 'flex';
                    if (drawerUserName) drawerUserName.textContent = `مرحباً، ${userName}`;

                    const roleNames = { customer: 'زبون', salon: 'صاحب صالون', store: 'صاحب متجر' };
                    if (drawerUserRole) drawerUserRole.textContent = roleNames[role] || 'زبون';

                    const profileMap = {
                        customer: 'PROFILE_CUSTOMER',
                        salon: 'PROFILE_SALON',
                        store: 'PROFILE_STORE'
                    };
                    if (drawerProfileLink) drawerProfileLink.href = resolvePath(profileMap[role] || 'PROFILE_CUSTOMER');

                    if (role === 'salon' || role === 'store') {
                        if (drawerDashboardLink) {
                            drawerDashboardLink.style.display = 'flex';
                            drawerDashboardLink.href = resolvePath('APPOINTMENTS');
                        }
                        if (drawerSettingsLink) {
                            drawerSettingsLink.style.display = 'flex';
                            drawerSettingsLink.href = resolvePath(role === 'salon' ? 'SETTINGS_SALON' : 'SETTINGS_STORE');
                        }
                    }
                }
            } catch (error) {
                console.error('خطأ في جلب بيانات المستخدم:', error);
            }

            if (drawerLoginLink) drawerLoginLink.style.display = 'none';
            if (drawerLogoutLink) {
                drawerLogoutLink.style.display = 'flex';
                drawerLogoutLink.onclick = async (e) => {
                    e.preventDefault();
                    await signOut(auth);
                    window.location.href = resolvePath('INDEX');
                };
            }

        } else {
            userBtn.href = resolvePath('LOGIN');

            if (drawerUserInfo) drawerUserInfo.style.display = 'none';
            if (drawerDashboardLink) drawerDashboardLink.style.display = 'none';
            if (drawerSettingsLink) drawerSettingsLink.style.display = 'none';
            if (drawerLoginLink) drawerLoginLink.style.display = 'flex';
            if (drawerLogoutLink) drawerLogoutLink.style.display = 'none';
        }
    });
}

// ============================================
// عداد السلة
// ============================================
function setupCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;

    const updateBadge = () => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        badge.textContent = cart.length;
        badge.style.display = cart.length > 0 ? 'flex' : 'none';
    };

    updateBadge();
    window.addEventListener('cartUpdated', updateBadge);
}

// ============================================
// تمييز الصفحة النشطة
// ============================================
function highlightActivePage() {
    const path = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    const pageMap = [
        { key: 'explore-salon', page: 'salons' },
        { key: 'explore-store', page: 'store' },
        { key: 'details-salon', page: 'salons' },
        { key: 'details-store', page: 'store' },
        { key: 'about', page: 'about' },
        { key: 'contact', page: 'contact' }
    ];

    let activePage = 'home';
    for (const item of pageMap) {
        if (path.includes(item.key)) {
            activePage = item.page;
            break;
        }
    }

    navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.page === activePage);
    });
}

