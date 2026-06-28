import { db, auth } from "../core/firebase-init.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function initProfile() {
    const user = auth.currentUser;
    if (!user) return;

    const docSnap = await getDoc(doc(db, "salons", user.uid));
    if (docSnap.exists()) {
        const data = docSnap.data();
        
        // تحديث النصوص
        document.getElementById('salonName').innerText = data.salonName;
        document.getElementById('salonType').innerText = `نوع الصالون: ${data.salonType}`;
        
        // عرض أوقات العمل
        if(data.workingHours) {
            document.getElementById('workingHours').innerHTML = 
                `<p>من: ${data.workingHours.open} إلى: ${data.workingHours.close}</p>`;
        }

        // عرض الصور إذا وجدت
        renderGallery(data.galleryImages);
        // عرض الشهادات
        renderCertificates(data.certificateImages);
    }
}

function renderGallery(images) {
    const container = document.getElementById('gallery-container');
    if (!images || images.length === 0) return;
    
    container.innerHTML = images.map(src => `<img src="${src}" class="img-frame" style="object-fit:cover">`).join('');
}

initProfile();
