/**
 * نظام التنبيهات الموحد لـ BarberFlow Pro
 * المسار: auth/js/notifications.js
 * 
 * المميزات:
 * - تنبيهات تلقائية تختفي بعد 4 ثوانٍ
 * - إمكانية السحب للإخفاء (Swipe to Dismiss)
 * - دعم 4 أنواع: success, error, info, warning
 * - نافذة OTP منبثقة
 */

import { showNotification as showGlobalNotification } from "../../middleware/index.js";

/**
 * عرض تنبيه جديد
 * @param {string} message - نص الرسالة
 * @param {string} type - نوع التنبيه (success, error, info, warning)
 * @param {number} duration - مدة الظهور بالمللي ثانية (افتراضي: 4000)
 */
export function showNotification(message, type = "success", duration = 4000) {
    const container = document.getElementById('notification-container');
    if (!container) {
        console.error("❌ حاوية التنبيهات غير موجودة في HTML");
        return;
    }

    // إنشاء عنصر التنبيه
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // اختيار الأيقونة حسب النوع
    const icons = {
        success: "fa-check-circle",
        error: "fa-exclamation-circle",
        info: "fa-info-circle",
        warning: "fa-exclamation-triangle"
    };
    
    const icon = icons[type] || icons.success;
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
        <button class="notification-close" aria-label="إغلاق">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(notification);

    // إضافة ميزة السحب للإخفاء
    enableSwipeToDismiss(notification);

    // زر الإغلاق اليدوي
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.onclick = () => dismissNotification(notification);
    }

    // الإخفاء التلقائي
    if (duration > 0) {
        setTimeout(() => {
            dismissNotification(notification);
        }, duration);
    }
}

/**
 * إخفاء التنبيه بأنيميشن
 * @param {HTMLElement} notification - عنصر التنبيه
 */
function dismissNotification(notification) {
    if (notification.classList.contains('fade-out')) return;
    
    notification.classList.add('fade-out');
    notification.addEventListener('animationend', () => {
        notification.remove();
    });
}

/**
 * تفعيل ميزة السحب للإخفاء
 * @param {HTMLElement} notification - عنصر التنبيه
 */
function enableSwipeToDismiss(notification) {
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isDragging = false;
    let startTime = 0;

    const handleStart = (e) => {
        isDragging = true;
        startTime = Date.now();
        
        if (e.type === 'touchstart') {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        } else {
            startX = e.clientX;
            startY = e.clientY;
        }
        
        notification.classList.add('dragging');
    };

    const handleMove = (e) => {
        if (!isDragging) return;
        
        e.preventDefault();
        
        if (e.type === 'touchmove') {
            currentX = e.touches[0].clientX;
            currentY = e.touches[0].clientY;
        } else {
            currentX = e.clientX;
            currentY = e.clientY;
        }
        
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        
        // تطبيق الحركة
        notification.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    };

    const handleEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        
        notification.classList.remove('dragging');
        
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        const deltaTime = Date.now() - startTime;
        
        // حساب السرعة
        const velocityX = Math.abs(deltaX) / deltaTime;
        const velocityY = Math.abs(deltaY) / deltaTime;
        
        // تحديد اتجاه السحب
        const threshold = 100; // بكسل
        const velocityThreshold = 0.5; // بكسل/مللي ثانية
        
        if (Math.abs(deltaX) > threshold || velocityX > velocityThreshold) {
            // سحب أفقي
            if (deltaX > 0) {
                notification.classList.add('swipe-right');
            } else {
                notification.classList.add('swipe-left');
            }
        } else if (deltaY < -threshold || velocityY > velocityThreshold) {
            // سحب للأعلى
            notification.classList.add('swipe-up');
        } else {
            // إرجاع للمكان الأصلي
            notification.style.transform = '';
        }
        
        notification.addEventListener('animationend', () => {
            notification.remove();
        });
        
        // إعادة تعيين
        startX = 0;
        startY = 0;
        currentX = 0;
        currentY = 0;
    };

    // أحداث الماوس
    notification.addEventListener('mousedown', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    
    // أحداث اللمس
    notification.addEventListener('touchstart', handleStart, { passive: true });
    notification.addEventListener('touchmove', handleMove, { passive: false });
    notification.addEventListener('touchend', handleEnd);
}

/**
 * نافذة OTP المنبثقة
 * @returns {Promise<string|null>} الرمز المدخل أو null
 */
export function showOtpModal() {
    return new Promise((resolve) => {
        // إنشاء الحاوية
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'global-otp-overlay';
        
        modalOverlay.innerHTML = `
            <div class="global-otp-modal">
                <button type="button" class="global-otp-close" aria-label="إغلاق">
                    <i class="fas fa-times"></i>
                </button>
                
                <div class="global-otp-icon">
                    <i class="fas fa-shield-alt"></i>
                </div>
                
                <h2 class="global-otp-title">رمز التحقق</h2>
                <p style="color: var(--text-muted, #aaa); font-size: 0.9rem; margin-bottom: 20px;">
                    أدخل الرمز المكون من 6 أرقام
                </p>

                <div class="global-otp-input-container">
                    <input 
                        type="text" 
                        class="global-otp-input" 
                        placeholder="123456" 
                        maxlength="6"
                        inputmode="numeric"
                        pattern="[0-9]*"
                        autocomplete="one-time-code"
                    >
                </div>

                <button 
                    type="button" 
                    class="btn btn-accent" 
                    style="width: 100%; padding: 14px; font-size: 1rem;"
                >
                    تأكيد الرمز
                </button>
            </div>
        `;

        document.body.appendChild(modalOverlay);

        const closeBtn = modalOverlay.querySelector('.global-otp-close');
        const confirmBtn = modalOverlay.querySelector('button.btn-accent');
        const inputField = modalOverlay.querySelector('.global-otp-input');

        // تركيز تلقائي
        setTimeout(() => inputField.focus(), 100);

        // تأكيد الرمز
        confirmBtn.onclick = () => {
            const enteredCode = inputField.value.trim();
            if (enteredCode.length === 6 && /^\d+$/.test(enteredCode)) {
                modalOverlay.remove();
                resolve(enteredCode);
            } else {
                showNotification("يرجى إدخال رمز صحيح مكون من 6 أرقام", "error");
                inputField.focus();
            }
        };

        // إغلاق النافذة
        const closeModal = () => {
            modalOverlay.remove();
            resolve(null);
        };

        closeBtn.onclick = closeModal;
        
        modalOverlay.onclick = (e) => {
            if (e.target === modalOverlay) closeModal();
        };

        // Enter للتأكيد
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirmBtn.click();
            }
        });
    });
}

/**
 * عرض تنبيه تأكيد قبل إجراء مهم
 * @param {string} message - رسالة التأكيد
 * @returns {Promise<boolean>}
 */
export function showConfirmDialog(message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'global-otp-overlay';
        
        overlay.innerHTML = `
            <div class="global-otp-modal">
                <div class="global-otp-icon">
                    <i class="fas fa-question-circle"></i>
                </div>
                
                <h2 class="global-otp-title">تأكيد الإجراء</h2>
                <p style="color: var(--text-muted); margin: 20px 0; line-height: 1.6;">
                    ${message}
                </p>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <button class="btn btn-outline cancel-btn" style="padding: 12px;">
                        إلغاء
                    </button>
                    <button class="btn btn-accent confirm-btn" style="padding: 12px;">
                        تأكيد
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const cancelBtn = overlay.querySelector('.cancel-btn');
        const confirmBtn = overlay.querySelector('.confirm-btn');

        cancelBtn.onclick = () => {
            overlay.remove();
            resolve(false);
        };

        confirmBtn.onclick = () => {
            overlay.remove();
            resolve(true);
        };

        overlay.onclick = (e) => {
            if (e.target === overlay) {
                overlay.remove();
                resolve(false);
            }
        };
    });
}

