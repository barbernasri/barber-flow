import { db } from "../../core/firebase-init.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * دالة وسيطة لحماية التعديلات
 * تمنع أي شخص من تعديل مستند لا يملكه حتى لو حاول حقن كود في المتصفح
 */
export const secureUpdate = async (collectionName, docId, userId, newData) => {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error("Document not found");

    // "التحقق الأمني": التأكد من أن صاحب المستند هو المستخدم الحالي
    if (docSnap.data().ownerId !== userId) {
        throw new Error("Security Violation: You are not the owner of this data.");
    }

    // إذا مر التحقق، ننفذ التعديل
    return await updateDoc(docRef, newData);
};
