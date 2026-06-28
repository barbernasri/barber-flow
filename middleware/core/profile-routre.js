// استيراد الـ auth من مجلد core في الجذر
import { auth } from '../../core/firebase-init.js'; 
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const db = getFirestore();

window.navigateToUserDashboard = async () => {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = '/register/login.html';
        return;
    }

    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const role = userDoc.exists() ? userDoc.data().role : "customer"; 

        const routes = {
            "salon": "/profiles/profile-salon.html",
            "store": "/profiles/profile-store.html",
            "customer": "/profiles/profile-customer.html"
        };
        window.location.href = routes[role] || routes["customer"];
    } catch (error) {
        console.error("خطأ في التوجيه:", error);
    }
};
