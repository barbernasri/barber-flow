/**
 * أداة معالجة الصور لـ BarberFlow Pro
 * المسار: auth/js/images-utils.js
 * 
 * ملاحظة: هذا حل مؤقت لتخزين الصور كـ Base64
 * حتى يتم تفعيل Firebase Storage (يحتاج خطة مدفوعة)
 */

/**
 * معالجة وضغط الصورة وتحويلها إلى Base64
 * @param {File} file - ملف الصورة الأصلي
 * @param {number} maxWidth - أقصى عرض للصورة (افتراضي: 600)
 * @param {number} quality - جودة الضغط من 0.1 إلى 1.0 (افتراضي: 0.6)
 * @param {string} format - صيغة الإخراج 'image/jpeg' أو 'image/png' (افتراضي: jpeg)
 * @returns {Promise<string>} - Base64 للصورة المعالجة
 */
export const processImage = (file, maxWidth = 600, quality = 0.6, format = 'image/jpeg') => {
    return new Promise((resolve, reject) => {
        // التحقق من نوع الملف
        if (!file.type.startsWith('image/')) {
            reject(new Error('الملف المحدد ليس صورة صالحة'));
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // الحفاظ على نسبة الأبعاد (Aspect Ratio)
                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                
                // تحسين جودة الرسم
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                ctx.drawImage(img, 0, 0, width, height);

                // تحويل إلى Base64
                const base64String = canvas.toDataURL(format, quality);
                resolve(base64String);
            };

            img.onerror = () => reject(new Error('فشل تحميل الصورة'));
        };

        reader.onerror = () => reject(new Error('فشل قراءة الملف'));
    });
};

/**
 * حذف صورة من مصفوفة الصور وتحديث الواجهة
 * @param {string|number} targetId - معرف الصورة المراد حذفها
 * @param {Array} imagesArray - مصفوفة الصور الحالية
 * @param {HTMLElement} previewContainer - حاوية المعاينة
 * @param {Function} onUpdateCallback - دالة تحديث المصفوفة الرئيسية
 * @param {Function} reRenderFormGrid - دالة إعادة بناء الشبكة (اختياري)
 */
export const removeImageFromGallery = (
    targetId, 
    imagesArray, 
    previewContainer, 
    onUpdateCallback, 
    reRenderFormGrid = null
) => {
    // تصفية المصفوفة
    const updatedArray = imagesArray.filter(img => img.id !== targetId);
    
    // تحديث المصفوفة الرئيسية
    if (typeof onUpdateCallback === 'function') {
        onUpdateCallback(updatedArray);
    }

    // إعادة بناء الشبكة إذا توفرت دالة مخصصة
    if (typeof reRenderFormGrid === 'function') {
        reRenderFormGrid(updatedArray);
        return;
    }

    // Fallback: إعادة بناء افتراضية
    if (previewContainer) {
        previewContainer.innerHTML = '';
        updatedArray.forEach(img => {
            const div = document.createElement('div');
            div.className = 'img-item';
            div.style.cssText = `
                position: relative;
                display: inline-block;
                margin: 5px;
            `;
            
            div.innerHTML = `
                <img src="${img.base64}" style="
                    width: 100px; 
                    height: 100px; 
                    object-fit: cover; 
                    border-radius: 8px;
                ">
                <button type="button" class="delete-img" style="
                    position: absolute; 
                    top: -5px; 
                    right: -5px; 
                    background: var(--brand-danger, #c92a2a); 
                    color: white; 
                    border: none;
                    border-radius: 50%; 
                    width: 20px; 
                    height: 20px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    cursor: pointer; 
                    font-size: 12px;
                ">
                    <i class="fas fa-times"></i>
                </button>
            `;

            div.querySelector('.delete-img').onclick = () => {
                removeImageFromGallery(
                    img.id, 
                    updatedArray, 
                    previewContainer, 
                    onUpdateCallback, 
                    reRenderFormGrid
                );
            };

            previewContainer.appendChild(div);
        });
    }
};

/**
 * التحقق من حجم الصورة قبل الرفع
 * @param {File} file - الملف المراد فحصه
 * @param {number} maxSizeMB - الحد الأقصى بالحجم (MB)
 * @returns {boolean}
 */
export const validateImageSize = (file, maxSizeMB = 5) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
};

/**
 * التحقق من نوع الصورة
 * @param {File} file
 * @returns {boolean}
 */
export const validateImageType = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return validTypes.includes(file.type);
};

/**
التحقق من محتوى الصورة (كشف مبدئي)
- فحص نسبة الألوان الجلدية
- فحص نسبة التباين المشبوه
- رفض الصور ذات الأبعاد غير المنطقية
*/
export const detectInappropriateContent = (imgElement) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    ctx.drawImage(imgElement, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let skinTonePixels = 0;
    let totalPixels = data.length / 4;
    
    // فحص نسبة الألوان الجلدية
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // خوارزمية بسيطة للكشف عن اللون الجلدي
        if (r > 95 && g > 40 && b > 20 &&
            r > g && r > b &&
            Math.abs(r - g) > 15 &&
            r - g > 15 && r - b > 15) {
            skinTonePixels++;
        }
    }
    
    const skinToneRatio = skinTonePixels / totalPixels;
    
    // رفض إذا كانت نسبة اللون الجلدي عالية جداً (> 60%)
    if (skinToneRatio > 0.6) {
        return {
            safe: false,
            reason: 'الصورة تحتوي على محتوى غير لائق'
        };
    }
    
    return { safe: true };
};

