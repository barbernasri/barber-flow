/**
 * نظام التنبيهات الموحد لـ BarberFlow-Pro
 * @param {string} message - نص الرسالة
 * @param {string} type - نوع التنبيه (success أو error)
 */
export function showNotification(message, type = "success") {
    const container = document.getElementById('notification-container');
    
    if (!container) {
        console.error("حاوية التنبيهات غير موجودة في ملف HTML");
        return;
    }

    // إنشاء عنصر التنبيه
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // اختيار الأيقونة حسب النوع
    const icon = type === "success" ? "fa-check-circle" : "fa-exclamation-circle";

    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(notification);

    // إزالة التنبيه تلقائياً بعد 4 ثوانٍ
    setTimeout(() => {
        notification.classList.add('fade-out');
        notification.addEventListener('animationend', () => {
            notification.remove();
        });
    }, 4000);
}
/**
 * نافذة منبثقة تفاعلية مشتركة لإدخال رمز التحقق OTP لـ BarberFlow-Pro
 * @returns {Promise<string|null>} يعيد الرمز المكون من 6 أرقام أو null في حالة الإلغاء
 */
export function showOtpModal() {
    return new Promise((resolve) => {
        // إنشاء حاوية النافذة المنبثقة
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 10000; display: flex; justify-content: center; align-items: center; padding: 20px;';

        // تصميم النافذة بالأسلوب الأسود والذهبي المتناسق مع الهوية العامة للمشروع
        modalOverlay.innerHTML = `
            <div class="auth-container" style="max-width: 400px; position: relative; width: 100%; background: #111; padding: 30px; border-radius: 16px; border: 1px solid rgba(212, 175, 55, 0.2); box-shadow: 0 15px 35px rgba(0,0,0,0.7);">
                <button type="button" id="globalCloseOtpBtn" class="back-link-btn" style="position: absolute; top: 15px; left: 20px; width: auto; font-size: 1.5rem; background: none; border: none; color: #fff; cursor: pointer;">&times;</button>
                <div class="auth-header" style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #d4af37; margin-bottom: 8px; font-size: 1.6rem;">رمز التحقق</h2>
                    <p class="step-desc" style="color: #aaa; font-size: 0.9rem;">أدخل الرمز المكون من 6 أرقام لإتمام تسجيل الدخول</p>
                </div>
                
                <div class="input-group" style="margin-bottom: 20px;">
                    <input type="text" id="globalOtpCodeInput" placeholder="123456" maxlength="6" style="width: 100%; padding: 12px; background: #1a1a1a; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 8px; color: #fff; text-align: center; font-size: 1.4rem; letter-spacing: 6px; outline: none;">
                </div>
                
                <button type="button" id="globalConfirmOtpBtn" class="auth-btn" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #d4af37, #aa841b); border: none; border-radius: 8px; color: #000; font-weight: bold; font-size: 1rem; cursor: pointer; transition: all 0.3s;">تأكيد الرمز</button>
            </div>
        `;

        document.body.appendChild(modalOverlay);

        const closeBtn = modalOverlay.querySelector('#globalCloseOtpBtn');
        const confirmBtn = modalOverlay.querySelector('#globalConfirmOtpBtn');
        const inputField = modalOverlay.querySelector('#globalOtpCodeInput');

        // تركيز المؤشر تلقائياً داخل الحقل
        inputField.focus();

        // حدث الضغط على تأكيد الرمز
        confirmBtn.onclick = () => {
            const enteredCode = inputField.value.trim();
            if (enteredCode.length === 6 && /^\d+$/.test(enteredCode)) {
                modalOverlay.remove();
                resolve(enteredCode);
            } else {
                showNotification("يرجى إدخال رمز صحيح مكون من 6 أرقام", "error");
            }
        };

        // حدث إغلاق النافذة عند الضغط على زر الإغلاق
        closeBtn.onclick = () => {
            modalOverlay.remove();
            resolve(null);
        };

        // إغلاق النافذة عند الضغط على الخلفية الخارجية المعتمة
        modalOverlay.onclick = (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
                resolve(null);
            }
        };
    });
}
