document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("global-navbar-container");
    if (!container) return;

    try {
        // استخدام مسار نسبي لضمان العثور على الملف
        const response = await fetch("../shared/global-navbar.html");
        if (!response.ok) throw new Error("Navbar file not found");
        
        container.innerHTML = await response.text();
        document.body.style.paddingTop = "70px"; 
        
        // تشغيل المنطق فقط
        setupLogic();
        
        // الأزرار الآن موجودة في الـ HTML الخاص بـ global-navbar.html ولن تختفي
    } catch (error) {
        console.error("خطأ في تحميل الشريط:", error);
    }
});

function setupLogic() {
    const menuBtn = document.getElementById("navMenuBtn");
    const closeBtn = document.getElementById("closeMenuBtn");
    const dropdown = document.getElementById("premiumDropdownMenu");
    
    if(!menuBtn || !dropdown) return;

    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);

    menuBtn.onclick = () => {
        dropdown.classList.add("show-premium-dropdown");
        overlay.style.display = "block";
    };

    const close = () => {
        dropdown.classList.remove("show-premium-dropdown");
        overlay.style.display = "none";
    };

    closeBtn.onclick = close;
    overlay.onclick = close;
}
