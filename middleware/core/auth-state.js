// middleware/core/auth-state.js
import { auth, db } from "../../core/firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export const getCurrentUser = () => {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                resolve(null);
                return;
            }
            // جلب بيانات المستخدم الكاملة من Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));
            resolve(userDoc.exists() ? { uid: user.uid, ...userDoc.data() } : null);
        });
    });
};
