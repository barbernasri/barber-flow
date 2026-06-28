/**
أداة معالجة الصور: تقوم بضغط الصور وتحويلها إلى Base64
@param {File} file - ملف الصورة الأصلي من مدخلات HTML
@param {number} maxWidth - أقصى عرض للصورة
@param {number} quality - جودة الضغط من 0.1 إلى 1.0
@returns {Promise<string>} - تعيد نص Base64 للصورة المعالجة
*/
export const processImage = (file, maxWidth = 600, quality = 0.6) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // الحفاظ على أبعاد الصورة (Aspect Ratio) عند تغيير الحجم
                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // تحويل الصورة إلى Base64 بصيغة JPEG لضمان أفضل ضغط وتقليل الحجم
                const base64String = canvas.toDataURL('image/jpeg', quality);
                resolve(base64String);
            };

            img.onerror = (error) => reject(error);
        };

        reader.onerror = (error) => reject(error);
    });
};

/**
دالة حذف صورة من مصفوفة الصور وتحديث الحاوية في الواجهة وإبلاغ الملف الرئيسي بالتحديث
@param {string|number} targetId - المعرف الفريد للصورة المراد حذفها
@param {Array} imagesArray - مصفوفة الصور الحالية التي تحتوي على الكائنات {id, base64}
@param {HTMLElement} previewContainer - عنصر HTML (الحاوية) المسؤولة عن عرض الصور
@param {Function} onUpdateCallback - دالة تراجع لتحديث مصفوفة البيانات في الملف الأساسي
@param {Function} reRenderFormGrid - دالة اختيارية لإعادة بناء الشبكة المخصصة للصفحة الحالية لمنع تشويه التنسيق
*/
export const removeImageFromGallery = (targetId, imagesArray, previewContainer, onUpdateCallback, reRenderFormGrid = null) => {
    // تصفية مصفوفة الصور وحذف العنصر المطابق للمعرف
    const updatedArray = imagesArray.filter(img => img.id !== targetId);
    
    // إبلاغ وتحديث المصفوفة الرئيسية في ملفك الخارجي بالبيانات الجديدة
    if (typeof onUpdateCallback === 'function') {
        onUpdateCallback(updatedArray);
    }
    
    // إذا كانت هناك دالة إعادة بناء مخصصة من الصفحة الأصلية لتأمين التنسيق نقوم باستدعائها
    if (typeof reRenderFormGrid === 'function') {
        reRenderFormGrid(updatedArray);
        return;
    }
    
    // fallback للتحديث الافتراضي القديم في حال لم تتوفر دالة مخصصة
    previewContainer.innerHTML = "";
    updatedArray.forEach(img => {
        const div = document.createElement('div');
        div.className = 'img-item';
        div.style.position = 'relative';
        div.style.display = 'inline-block';
        
        div.innerHTML = `
            <img src="${img.base64}" style="width:100px; height:100px; object-fit:cover; border-radius:8px;">
            <span class="delete-img" style="position:absolute; top:-5px; right:-5px; background:red; color:white; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:12px;">&times;</span>
        `;

        div.querySelector('.delete-img').onclick = () => {
            removeImageFromGallery(img.id, updatedArray, previewContainer, onUpdateCallback, reRenderFormGrid);
        };

        previewContainer.appendChild(div);
    });
};

