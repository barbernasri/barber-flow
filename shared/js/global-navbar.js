/**
 * شريط التنقل العام - محدّث
 * المسار: shared/js/global-navbar.js
 */

import { auth, db } from "../../core/firebase-init.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("global-navbar-container");
    if (!container) return;
    
    try {
        const response = await fetch("../shared/global-navbar.html");
        if (!response.ok) throw new Error("Navbar file not found");
        
        container.innerHTML = await response.text();
        
        // لا نضيف padding لأن الـ Navbar أصبح جزءاً من الصفحة
        // document.body.style.paddingTop = "70px"; // تم حذفه
        
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
    const themeBtn = document.getElementById('themeToggleBtn');
    const drawerThemeBtn = document.getElementById('drawerThemeToggle');
    const drawerThemeText = document.getElementById('drawerThemeText');
    
    // تحميل الثيم المحفوظ
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);
    
    // زر الثيم في الهيدر
    if (themeBtn) {
        themeBtn.onclick = () => toggleTheme();
    }
    
    // زر الثيم في القائمة الجانبية
    if (drawerThemeBtn) {
        drawerThemeBtn.onclick = () => toggleTheme();
    }
    
    function toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        
        // تحديث نص الزر في القائمة الجانبية
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
        const headerIcon = themeBtn?.querySelector('i');
        const drawerIcon = drawerThemeBtn?.querySelector('i');
        
        const iconClass = theme === 'dark' ? 'fa-moon' : 'fa-sun';
        
        if (headerIcon) headerIcon.className = `fas ${iconClass}`;
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
            // المستخدم مسجل الدخول
            userBtn.href = 'profiles/profile-customer.html';
            userBtn.setAttribute('aria-label', 'ملفي الشخصي');
            
            // جلب بيانات المستخدم من Firestore
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const userName = userData.fullName || 'مستخدم';
                    const userRole = userData.role || 'customer';
                    
                    // تحديث معلومات المستخدم في القائمة الجانبية
                    if (drawerUserInfo) drawerUserInfo.style.display = 'flex';
                    if (drawerUserName) drawerUserName.textContent = `مرحباً، ${userName}`;
                    
                    const roleText = {
                        'customer': 'زبون',
                        'salon': 'صاحب صالون',
                        'store': 'صاحب متجر'
                    };
                    if (drawerUserRole) drawerUserRole.textContent = roleText[userRole] || 'زبون';
                    
                    // إظهار/إخفاء الروابط حسب الدور
                    if (userRole === 'salon' || userRole === 'store') {
                        if (drawerDashboardLink) drawerDashboardLink.style.display = 'flex';
                        if (drawerSettingsLink) drawerSettingsLink.style.display = 'flex';
                        
                        // تحديث رابط لوحة التحكم حسب الدور
                        if (drawerDashboardLink) {
                            drawerDashboardLink.href = userRole === 'salon' 
                                ? 'dashboard/appointment.html' 
                                : 'dashboard/appointment.html';
                        }
                        
                        // تحديث رابط الإعدادات حسب الدور
                        if (drawerSettingsLink) {
                            drawerSettingsLink.href = userRole === 'salon' 
                                ? 'dashboard/settings-salon.html' 
                                : 'dashboard/settings-salon.html';
                        }
                    }
                    
                    // تحديث رابط الملف الشخصي حسب الدور
                    if (drawerProfileLink) {
                        const profileLinks = {
                            'customer': 'profiles/profile-customer.html',
                            'salon': 'profiles/profile-salon.html',
                            'store': 'profiles/profile-store.html'
                        };
                        drawerProfileLink.href = profileLinks[userRole] || 'profiles/profile-customer.html';
                    }
                }
            } catch (error) {
                console.error('خطأ في جلب بيانات المستخدم:', error);
            }
            
            // إظهار زر تسجيل الخروج
            if (drawerLoginLink) drawerLoginLink.style.display = 'none';
            if (drawerLogoutLink) drawerLogoutLink.style.display = 'flex';
            
            // حدث تسجيل الخروج
            if (drawerLogoutLink) {
                drawerLogoutLink.onclick = async (e) => {
                    e.preventDefault();
                    try {
                        await signOut(auth);
                        window.location.href = 'index.html';
                    } catch (error) {
                        console.error('خطأ في تسجيل الخروج:', error);
                    }
                };
            }
            
        } else {
            // المستخدم غير مسجل
            userBtn.href = 'register/login.html';
            userBtn.setAttribute('aria-label', 'تسجيل الدخول');
            
            // إخفاء معلومات المستخدم
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
    
    // جلب عدد عناصر السلة من localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    badge.textContent = cart.length;
    
    // تحديث عند تغيير السلة
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
        // يمكن فتح نافذة إعدادات منبثقة أو التوجيه لصفحة الإعدادات
        // حالياً سنوجه لصفحة الإعدادات إذا كان المستخدم مسجل دخول
        const user = auth.currentUser;
        if (user) {
            window.location.href = 'dashboard/settings-salon.html';
        } else {
            window.location.href = 'register/login.html';
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
    
    // تحديد الصفحة النشطة بناءً على المسار
    let activePage = 'home';
    
    if (currentPath.includes('explore-salon')) activePage = 'salons';
    else if (currentPath.includes('explore-store')) activePage = 'store';
    else if (currentPath.includes('home-services')) activePage = 'services';
    else if (currentPath.includes('about')) activePage = 'about';
    else if (currentPath.includes('contact')) activePage = 'contact';
    
    // تمييز الرابط النشط
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

