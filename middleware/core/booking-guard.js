/**
 * حارس الحجوزات (Booking Guard)
 * وظيفته التأكد من سلامة بيانات الحجز ومنع الحجوزات المكررة (Double Booking)
 */

import { db } from "../../core/firebase-init.js";
import { doc, getDoc, query, collection, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * دالة التحقق من توفر وقت الحجز
 * @param {string} salonId - معرف الصالون
 * @param {string} date - تاريخ الحجز
 * @param {string} time - وقت الحجز
 */
export const isSlotAvailable = async (salonId, date, time) => {
    try {
        const bookingsRef = collection(db, "bookings");
        
        // البحث عن أي حجز موجود في نفس الصالون والوقت والتاريخ
        const q = query(
            bookingsRef, 
            where("salonId", "==", salonId),
            where("date", "==", date),
            where("time", "==", time)
        );

        const querySnapshot = await getDocs(q);
        
        // إذا كان حجم المصفوفة 0، فهذا يعني أن الوقت متاح
        return querySnapshot.empty;
    } catch (error) {
        console.error("Error checking availability:", error);
        return false; // نمنع الحجز في حال حدوث خطأ تقني لزيادة الأمان
    }
};

/**
 * دالة التحقق من صلاحية بيانات الحجز (قبل إرسالها)
 */
export const validateBookingData = (data) => {
    if (!data.salonId || !data.date || !data.time || !data.customerId) {
        return { isValid: false, message: "بيانات الحجز ناقصة." };
    }
    
    // يمكنك إضافة المزيد من التحققات هنا، مثلاً التأكد من أن التاريخ ليس في الماضي
    return { isValid: true };
};
