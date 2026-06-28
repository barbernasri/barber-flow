import { auth, db } from "../../core/firebase-init.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showNotification } from "../../auth/js/notifications.js";
import { initGlobalNavigation } from "./navbar.js";

const urlParams = new URLSearchParams(window.location.search);
const profileId = urlParams.get('id');

onAuthStateChanged(auth, async (user) => {
    const targetId = profileId || (user ? user.uid : null);

    if (targetId) {
        try {
            const storeDoc = await getDoc(doc(db, "stores", targetId));
            
            if (storeDoc.exists()) {
                const storeData = storeDoc.data();
                
                // التحقق مما إذا كان المستخدم الحالي هو مالك هذا المتجر
                const isOwner = user && user.uid === targetId;
                
                // تحديث واجهة المستخدم بالبيانات فوراً
                updateStoreUI(storeData);
                
                // استدعاء الملاحة المركزية وتمرير متغير الملكية لحماية المتجر
                await initGlobalNavigation({
                    role: "store",
                    displayName: storeData.storeName || "متجر غير مسمى",
                    title: "لوحة تحكم المتجر",
                    isOwner: isOwner
                });
                
                if (isOwner) {
                    document.body.classList.add('is-owner');
                }
            } else {
                console.error("لا توجد تفاصيل لهذا المتجر في مجموعة stores");
                showNotification("لم يتم العثور على بيانات إعداد المتجر", "error");
            }
        } catch (error) {
            console.error("خطأ أثناء جلب بيانات مستند المتجر التجاري:", error);
        }
    }
});

function updateStoreUI(data) {
    const nameDisplay = document.getElementById('storeNameDisplay');
    if (nameDisplay) {
        nameDisplay.innerText = data.storeName || "متجر غير مسمى";
    }

    const logoImg = document.getElementById('storeLogo');
    if (logoImg && data.coverImage) {
        logoImg.src = data.coverImage;
    }

    const categoryDisplay = document.getElementById('storeCategory');
    if (categoryDisplay && data.categories && data.categories.length > 0) {
        categoryDisplay.innerText = data.categories.join(' / ');
    }
}
