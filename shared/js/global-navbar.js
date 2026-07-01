/**
شريط التنقل العام - محدّث
المسار: shared/js/global-navbar.js
الدور: تحميل الشريط العلوي وإدارة جميع وظائفه
*/
import { auth, db } from "../../core/firebase-init.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { PATHS } from "./paths.js";
import { showNotification } from "./notifications.js";

// ============================================
// دوال مساعدة للمسارات
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
    
    // إذا كان المسار يبدأ بـ http أو # أو javascript، اتركه كما هو
    if (pathKey.startsWith('http') || pathKey.startsWith('#') || pathKey.startsWith('javascript:')) {
        return pathKey;
    }
    
    const prefix = getRelativePrefix();
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
        setupLanguageSelector();
        setupNotificationsToggle();
        setupPrivacyButton();
        setupHelpButton();
        setupUserState();
        setupCartBadge();
        setupSettingsDropdown();
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
        const resolvedPath = resolvePath(PATHS[pathKey] || pathKey);
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
// قائمة الإعدادات المنسدلة
// ============================================
function setupSettingsDropdown() {
    const settingsBtn = document.getElementById('settingsBtn');
    const dropdown = document.getElementById('settingsDropdown');
    
    if (!settingsBtn || !dropdown) return;

    // فتح/إغلاق القائمة
    settingsBtn.onclick = (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    };

    // إغلاق عند النقر خارج القائمة
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && e.target !== settingsBtn) {
            dropdown.classList.remove('show');
        }
    });

    // إغلاق بزر Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            dropdown.classList.remove('show');
        }
    });
}

// ============================================
// تبديل الثيم
// ============================================
function setupThemeToggle() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');

    // تحميل الثيم المحفوظ
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    if (themeToggleBtn) {
        themeToggleBtn.onclick = () => {
            const currentTheme = document.body.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
            
            showNotification(
                newTheme === 'dark' ? 'تم التبديل إلى الوضع الداكن' : 'تم التبديل إلى الوضع الفاتح',
                'success'
            );
        };
    }

    function applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        }
        
        if (themeText) {
            themeText.textContent = theme === 'dark' ? 'الوضع الداكن' : 'الوضع الفاتح';
        }
    }
}

// ============================================
// اختيار اللغة
// ============================================
function setupLanguageSelector() {
    const langItems = document.querySelectorAll('.submenu-item[data-lang]');
    
    // تحميل اللغة المحفوظة
    const savedLang = localStorage.getItem('language') || 'ar';
    updateLanguageUI(savedLang);

    langItems.forEach(item => {
        item.onclick = () => {
            const lang = item.getAttribute('data-lang');
            localStorage.setItem('language', lang);
            updateLanguageUI(lang);
            
            const langNames = {
                'ar': 'العربية',
                'fr': 'Français',
                'en': 'English'
            };
            
            showNotification(`تم تغيير اللغة إلى ${langNames[lang]}`, 'success');
            
            // هنا يمكن إضافة منطق تغيير اللغة الفعلي
            // window.location.reload();
        };
    });

    function updateLanguageUI(lang) {
        langItems.forEach(item => {
            item.classList.remove('active');
            const checkIcon = item.querySelector('.fa-check');
            if (checkIcon) checkIcon.remove();
            
            if (item.getAttribute('data-lang') === lang) {
                item.classList.add('active');
                const icon = document.createElement('i');
                icon.className = 'fas fa-check';
                item.appendChild(icon);
            }
        });
    }
}

// ============================================
// تبديل الإشعارات
// ============================================
function setupNotificationsToggle() {
    const notifToggleBtn = document.getElementById('notificationsToggleBtn');
    const notifIcon = document.getElementById('notifIcon');
    const notifText = document.getElementById('notifText');

    // تحميل الحالة المحفوظة
    const notificationsEnabled = localStorage.getItem('notifications') !== 'false';
    updateNotificationsUI(notificationsEnabled);

    if (notifToggleBtn) {
        notifToggleBtn.onclick = () => {
            const newState = !notificationsEnabled;
            localStorage.setItem('notifications', newState);
            updateNotificationsUI(newState);
            
            showNotification(
                newState ? 'تم تفعيل الإشعارات' : 'تم إيقاف الإشعارات',
                'success'
            );
        };
    }

    function updateNotificationsUI(enabled) {
        if (notifIcon) {
            notifIcon.className = enabled ? 'fas fa-bell' : 'fas fa-bell-slash';
        }
        
        if (notifText) {
            notifText.textContent = enabled ? 'إيقاف الإشعارات' : 'تفعيل الإشعارات';
        }
    }
}

// ============================================
// زر الخصوصية
// ============================================
function setupPrivacyButton() {
    const privacyBtn = document.getElementById('privacyBtn');
    
    if (privacyBtn) {
        privacyBtn.onclick = () => {
            showNotification('صفحة إعدادات الخصوصية قيد التطوير', 'info');
            // window.location.href = resolvePath(PATHS.PRIVACY);
        };
    }
}

// ============================================
// زر المساعدة
// ============================================
function setupHelpButton() {
    const helpBtn = document.getElementById('helpBtn');
    
    if (helpBtn) {
        helpBtn.onclick = () => {
            showNotification('صفحة المساعدة والدعم قيد التطوير', 'info');
            // window.location.href = resolvePath(PATHS.HELP);
        };
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
                        showNotification('تم تسجيل الخروج بنجاح', 'success');
                        window.location.href = resolvePath(PATHS.INDEX);
                    } catch (error) {
                        console.error('خطأ في تسجيل الخروج:', error);
                        showNotification('حدث خطأ أثناء تسجيل الخروج', 'error');
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

