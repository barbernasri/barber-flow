/**
شريط التنقل العام - محدّث
المسار: shared/js/global-navbar.js
*/
import { auth, db } from "../../core/firebase-init.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { PATHS } from "./paths.js";

// ============================================
// دالة حساب المسار النسبي
// ============================================
/**
حساب بادئة المسار النسبي من الصفحة الحالية إلى جذر المشروع
*/
function getRelativePrefix() {
    const path = window.location.pathname;
    const parts = path.split('/').filter(p => p);
    const depth = parts.length - 1;
    return '../'.repeat(depth);
}

/**
تحويل مسار من PATHS إلى مسار نسبي صحيح
*/
function resolvePath(pathKey) {
    if (!pathKey) return '#';
    const prefix = getRelativePrefix();
    // PATHS تحتوي على مسارات مثل '../register/login.html'
    // نحتاج لإزالة '../' وإضافة البادئة الصحيحة
    const cleanPath = pathKey.replace(/^\.\.\//g, '');
    return prefix + cleanPath;
}

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
        if (!response.ok) throw new Error("Navbar file not found");
        
        container.innerHTML = await response.text();
        
        // تحديث جميع المسارات
        updateAllPaths();
        
        // تشغيل المنطق
        setupNavigationLogic();
        setupThemeToggle();
        setupUserState();
        setupCartBadge();
        setupSettingsButton();
        highlightActivePage();
        
    } catch (error) {
        console.error("خطأ في تحميل الشريط:", error);
    }
});

// ============================================
// تحديث جميع المسارات
// ============================================
function updateAllPaths() {
    const container = document.getElementById('global-navbar-container');
    if (!container) return;

    // تحديث جميع الروابط التي تحتوي على data-path
    const links = container.querySelectorAll('[data-path]');
    links.forEach(link => {
        const pathKey = link.getAttribute('data-path');
        const resolvedPath = resolvePath(pathKey);
        link.setAttribute('href', resolvedPath);
    });
}

// ============================================
// منطق القائمة الجانبية
// ============================================
function setupNavigationLogic() {
    const menuBtn = document.getElementById("navMenuBtn");
    const closeBtn = document.getElementById("closeMenuBtn");
    const drawer = document.getElementById("sideDrawer");
    const overlay = document.getElementById("drawerOverlay");

    if (!menuBtn || !drawer || !overlay) return;

    const openDrawer = () => {
        drawer.classList.add("open");
        overlay.classList.add("active");
        document.body.style.overflow = 'hidden';
    };

    const closeDrawer = () => {
        drawer.classList.remove("open");
        overlay.classList.remove("active");
        document.body.style.overflow = '';
    };

    menuBtn.onclick = openDrawer;
    closeBtn.onclick = closeDrawer;
    overlay.onclick = closeDrawer;

    // إغلاق عند النقر على رابط
    drawer.querySelectorAll('.drawer-link').forEach(link => {
        link.onclick = closeDrawer;
    });

    // إغلاق بزر Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('open')) {
            closeDrawer();
        }
    });
}

// ============================================
// تبديل الثيم (أبيض/أسود)
// ============================================
function setupThemeToggle() {
    const drawerThemeBtn = document.getElementById('drawerThemeToggle');
    const drawerThemeText = document.getElementById('drawerThemeText');

    // تحميل الثيم المحفوظ
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    if (drawerThemeBtn) {
        drawerThemeBtn.onclick = () => toggleTheme();
    }

    function toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        
        if (drawerThemeText) {
            drawerThemeText.textContent = newTheme === 'dark' ? 'الوضع الداكن' : 'الوضع الفاتح';
        }
    }

    function applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        updateThemeIcons(theme);
        
        if (drawerThemeText) {
            drawerThemeText.textContent = theme === 'dark' ? 'الوضع الداكن' : 'الوضع الفاتح';
        }
    }

    function updateThemeIcons(theme) {
        const drawerIcon = drawerThemeBtn?.querySelector('i');
        const iconClass = theme === 'dark' ? 'fa-moon' : 'fa-sun';
        
        if (drawerIcon) drawerIcon.className = `fas ${iconClass}`;
    }
}

// ============================================
// حالة المستخدم (تسجيل الدخول/الخروج)
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
            // تحديث زر المستخدم في الـ navbar
            userBtn.href = resolvePath(PATHS.PROFILE_CUSTOMER);
            userBtn.setAttribute('aria-label', 'ملفي الشخصي');
            
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const userName = userData.fullName || userData.displayName || 'مستخدم';
                    const userRole = userData.role || 'customer';
                    
                    if (drawerUserInfo) drawerUserInfo.style.display = 'flex';
                    if (drawerUserName) drawerUserName.textContent = `مرحباً، ${userName}`;
                    
                    const roleText = {
                        'customer': 'زبون',
                        'salon': 'صاحب صالون', 
                        'store': 'صاحب متجر'
                    };
                    if (drawerUserRole) drawerUserRole.textContent = roleText[userRole] || 'زبون';
                    
                    // إظهار روابط لوحة التحكم والإعدادات لأصحاب الأعمال
                    if (userRole === 'salon' || userRole === 'store') {
                        if (drawerDashboardLink) drawerDashboardLink.style.display = 'flex';
                        if (drawerSettingsLink) drawerSettingsLink.style.display = 'flex';
                        
                        if (drawerDashboardLink) {
                            drawerDashboardLink.href = resolvePath(PATHS.APPOINTMENTS);
                        }
                        
                        if (drawerSettingsLink) {
                            const settingsPath = userRole === 'salon' 
                                ? PATHS.SETTINGS_SALON 
                                : PATHS.SETTINGS_STORE;
                            drawerSettingsLink.href = resolvePath(settingsPath);
                        }
                    }
                    
                    // تحديث رابط البروفايل حسب الدور
                    if (drawerProfileLink) {
                        const profileLinks = {
                            'customer': PATHS.PROFILE_CUSTOMER,
                            'salon': PATHS.PROFILE_SALON,
                            'store': PATHS.PROFILE_STORE
                        };
                        drawerProfileLink.href = resolvePath(profileLinks[userRole] || PATHS.PROFILE_CUSTOMER);
                    }
                }
            } catch (error) {
                console.error('خطأ في جلب بيانات المستخدم:', error);
            }
            
            if (drawerLoginLink) drawerLoginLink.style.display = 'none';
            if (drawerLogoutLink) drawerLogoutLink.style.display = 'flex';
            
            if (drawerLogoutLink) {
                drawerLogoutLink.onclick = async (e) => {
                    e.preventDefault();
                    try {
                        await signOut(auth);
                        window.location.href = resolvePath(PATHS.INDEX);
                    } catch (error) {
                        console.error('خطأ في تسجيل الخروج:', error);
                    }
                };
            }
            
        } else {
            // المستخدم غير مسجل
            userBtn.href = resolvePath(PATHS.LOGIN);
            userBtn.setAttribute('aria-label', 'تسجيل الدخول');
            
            if (drawerUserInfo) drawerUserInfo.style.display = 'none';
            if (drawerDashboardLink) drawerDashboardLink.style.display = 'none';
            if (drawerSettingsLink) drawerSettingsLink.style.display = 'none';
            if (drawerLoginLink) drawerLoginLink.style.display = 'flex';
            if (drawerLogoutLink) drawerLogoutLink.style.display = 'none';
        }
    });
}

// ============================================
// عداد سلة التسوق
// ============================================
function setupCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    badge.textContent = cart.length;

    window.addEventListener('cartUpdated', () => {
        const updatedCart = JSON.parse(localStorage.getItem('cart') || '[]');
        badge.textContent = updatedCart.length;
    });
}

// ============================================
// زر الإعدادات العامة
// ============================================
function setupSettingsButton() {
    const settingsBtn = document.getElementById('settingsBtn');
    if (!settingsBtn) return;

    settingsBtn.onclick = () => {
        const user = auth.currentUser;
        if (user) {
            // توجيه حسب دور المستخدم
            getDoc(doc(db, "users", user.uid)).then((userDoc) => {
                if (userDoc.exists()) {
                    const role = userDoc.data().role;
                    const settingsPath = role === 'store' 
                        ? PATHS.SETTINGS_STORE 
                        : PATHS.SETTINGS_SALON;
                    window.location.href = resolvePath(settingsPath);
                } else {
                    window.location.href = resolvePath(PATHS.SETTINGS_SALON);
                }
            });
        } else {
            window.location.href = resolvePath(PATHS.LOGIN);
        }
    };
}

// ============================================
// تمييز الصفحة النشطة
// ============================================
function highlightActivePage() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    const drawerLinks = document.querySelectorAll('.drawer-link');
    
    let activePage = 'home';

    if (currentPath.includes('explore-salon')) activePage = 'salons';
    else if (currentPath.includes('explore-store')) activePage = 'store';
    else if (currentPath.includes('about')) activePage = 'about';
    else if (currentPath.includes('contact')) activePage = 'contact';

    navLinks.forEach(link => {
        if (link.dataset.page === activePage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    drawerLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath.includes(href.split('/').pop())) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

