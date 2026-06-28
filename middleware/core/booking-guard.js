/**
 * middleware/core/booking-guard.js
 * حارس الحجوزات - التحقق من توفر الأوقات ومنع التكرار
 */
import { db } from "../../core/firebase-init.js";
import { 
    collection, 
    query, 
    where, 
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * التحقق من توفر وقت الحجز (منع Double Booking)
 * @param {string} salonId - معرف الصالون
 * @param {string} date - التاريخ (YYYY-MM-DD)
 * @param {string} time - الوقت (HH:MM)
 * @returns {Promise<boolean>}
 */
export const isSlotAvailable = async (salonId, date, time) => {
    try {
        const bookingsRef = collection(db, "bookings");
        
        // البحث عن حجوزات موجودة في نفس الوقت والتاريخ
        const q = query(
            bookingsRef,
            where("salonId", "==", salonId),
            where("date", "==", date),
            where("time", "==", time),
            where("status", "in", ["confirmed", "pending"]) // استبعاد الملغاة
        );

        const querySnapshot = await getDocs(q);
        
        // إذا لم توجد نتائج، الوقت متاح
        return querySnapshot.empty;
    } catch (error) {
        console.error("Error checking slot availability:", error);
        return false; // في حالة الخطأ، نمنع الحجز للأمان
    }
};

/**
 * التحقق من صحة بيانات الحجز قبل الإرسال
 * @param {Object} data - بيانات الحجز
 * @returns {Object} { isValid: boolean, message: string }
 */
export const validateBookingData = (data) => {
    // 1. التحقق من الحقول الإلزامية
    const requiredFields = ['salonId', 'date', 'time', 'customerId', 'customerName'];
    for (const field of requiredFields) {
        if (!data[field] || data[field].trim() === '') {
            return {
                isValid: false,
                message: `الحقل "${field}" مطلوب.`
            };
        }
    }

    // 2. التحقق من أن التاريخ ليس في الماضي
    const bookingDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDate < today) {
        return {
            isValid: false,
            message: "لا يمكن الحجز في تاريخ مضى."
        };
    }

    // 3. التحقق من صيغة الوقت
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(data.time)) {
        return {
            isValid: false,
            message: "صيغة الوقت غير صحيحة. استخدم HH:MM (مثال: 14:30)"
        };
    }

    // 4. التحقق من أن الحجز ليس في نفس اللحظة (للحجز الفوري)
    if (data.isInstantBooking && bookingDate.getTime() < Date.now() + 3600000) {
        return {
            isValid: false,
            message: "يجب أن يكون الحجز قبل ساعة على الأقل من الوقت المحدد."
        };
    }

    return { isValid: true, message: "البيانات صحيحة" };
};

/**
 * التحقق من أن الصالون مفتوح في وقت الحجز
 * @param {Object} workingHours - أوقات العمل {open: "09:00", close: "21:00"}
 * @param {string} time - وقت الحجز
 * @param {string} day - اليوم (اختياري)
 * @returns {boolean}
 */
export const isWithinWorkingHours = (workingHours, time, day = null) => {
    if (!workingHours?.open || !workingHours?.close) return true;

    // التحقق من أن اليوم ضمن أيام العمل (إذا تم تحديدها)
    if (day && workingHours.workDays && !workingHours.workDays.includes(day)) {
        return false;
    }

    const [hour, minute] = time.split(':').map(Number);
    const [openHour, openMinute] = workingHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = workingHours.close.split(':').map(Number);

    const bookingMinutes = hour * 60 + minute;
    const openMinutes = openHour * 60 + openMinute;
    const closeMinutes = closeHour * 60 + closeMinute;

    // التعامل مع الصالونات التي تعمل حتى بعد منتصف الليل
    if (closeMinutes < openMinutes) {
        return bookingMinutes >= openMinutes || bookingMinutes < closeMinutes;
    }

    return bookingMinutes >= openMinutes && bookingMinutes < closeMinutes;
};

/**
 * الحصول على الأوقات المتاحة ليوم معين
 * @param {string} salonId 
 * @param {string} date 
 * @param {Object} workingHours 
 * @returns {Promise<string[]>} قائمة الأوقات المتاحة
 */
export const getAvailableSlots = async (salonId, date, workingHours) => {
    try {
        const availableSlots = [];
        
        // توليد الأوقات كل 30 دقيقة
        const [openHour, openMinute] = workingHours.open.split(':').map(Number);
        const [closeHour, closeMinute] = workingHours.close.split(':').map(Number);
        
        let currentHour = openHour;
        let currentMinute = openMinute;
        
        while (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)) {
            const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
            
            const isAvailable = await isSlotAvailable(salonId, date, timeString);
            if (isAvailable) {
                availableSlots.push(timeString);
            }
            
            // إضافة 30 دقيقة
            currentMinute += 30;
            if (currentMinute >= 60) {
                currentMinute = 0;
                currentHour++;
            }
        }
        
        return availableSlots;
    } catch (error) {
        console.error("Error getting available slots:", error);
        return [];
    }
};

