import { auth, db } from "../../core/firebase-init.js";
import { 
    signInWithEmailAndPassword,    
    sendPasswordResetEmail, 
    GoogleAuthProvider, 
    signInWithPopup,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { showNotification, showOtpModal } from "../../auth/js/notifications.js";

const loginForm = document.getElementById('loginForm');
const googleBtn = document.getElementById('googleBtn');
const submitBtn = document.getElementById('mainSubmitBtn');
const forgotModal = document.getElementById('forgotModal');
const backToHomeBtn = document.getElementById('backToHomeBtn');

const passwordGroup = document.getElementById('passwordGroup');
const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');

// دالة معالجة وتنسيق رقم الهاتف المغربي وتحويله إلى الصيغة الدولية المعتمدة (+212)
function formatMoroccanPhoneNumber(phone) {
    let cleaned = phone.replace(/\s+/g, '');
    if (cleaned.startsWith('06') || cleaned.startsWith('07')) {
        return '+212' + cleaned.substring(1);
    }
    return cleaned;
}

// دالة فحص وجود الحساب في قاعدة بيانات Firestore لمنع الاختراقات العشوائية واستدعاء الخاطئ للـ OTP
async function checkUserAccountExists(identifier) {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("contactInfo", "==", identifier));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            return { exists: true, data: querySnapshot.docs[0].data() };
        }
        return { exists: false, data: null };
    } catch (error) {
        console.error("Error checking account existence:", error);
        return { exists: false, data: null };
    }
}

loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const identifier = loginEmailInput.value.trim();

    // فحص الخطوة الحالية: إذا كانت الحقول غير مخفية، إذن المستخدم يقوم بإدخال كلمة المرور للبريد
    if (!passwordGroup.classList.contains('hidden-step')) {
        const password = loginPasswordInput.value;
        if (!password) {
            showNotification("يرجى إدخال كلمة المرور الخاصة بك", "error");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تسجيل الدخول...';

        try {
            const userCred = await signInWithEmailAndPassword(auth, identifier, password);
            await routeUserByRole(userCred.user.uid);
        } catch (error) {
            showNotification("خطأ في البيانات، تأكد من صحة الحساب وكلمة المرور", "error");
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>تسجيل الدخول</span> <i class="fas fa-sign-in-alt"></i>';
        }
        return;
    }

    // --- الخطوة الأولى: التحقق الأولي الآمن من نوع وهوية المدخل ---
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق من الحساب...';

    if (identifier.includes('@')) {
        const accountCheck = await checkUserAccountExists(identifier);
        
        if (!accountCheck.exists) {
            showNotification("هذا البريد الإلكتروني غير مسجل لدينا! قم بإنشاء حساب جديد أولاً.", "error");
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>متابعة</span> <i class="fas fa-arrow-left"></i>';
            return;
        }

        // إظهار حقل كلمة المرور بشكل متوافق وسلس باستخدام فئة الحركة المعتمدة لديك
        loginEmailInput.disabled = true;
        passwordGroup.classList.remove('hidden-step');
        passwordGroup.classList.add('show-step-animation');
        loginPasswordInput.required = true;
        loginPasswordInput.focus();
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>تسجيل الدخول</span> <i class="fas fa-sign-in-alt"></i>';

    } else {
        const formattedPhone = formatMoroccanPhoneNumber(identifier);
        
        if (!formattedPhone.startsWith('+212') || formattedPhone.length < 13) {
            showNotification("يرجى إدخال بريد إلكتروني صحيح أو رقم هاتف مغربي يبدأ بـ 06 أو 07", "error");
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>متابعة</span> <i class="fas fa-arrow-left"></i>';
            return;
        }

        const accountCheck = await checkUserAccountExists(formattedPhone);
        
        if (!accountCheck.exists) {
            showNotification("رقم الهاتف هذا غير مسجل لدينا! يرجى النقر على إنشاء حساب لتسجيله.", "error");
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>متابعة</span> <i class="fas fa-arrow-left"></i>';
            return;
        }

        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري إرسال الرمز...';

        try {
            if (!window.recaptchaVerifier) {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    'size': 'invisible'
                });
            }

            const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
            const code = await showOtpModal();
            
            if (code) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق من الرمز...';
                const result = await confirmationResult.confirm(code);
                await routeUserByRole(result.user.uid);
            } else {
                showNotification("تم إلغاء عملية التحقق بالرمز", "info");
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>متابعة</span> <i class="fas fa-arrow-left"></i>';
            }
        } catch (error) {
            showNotification("فشل إرسال الرمز، يرجى التحقق من الرقم والمحاولة مجدداً", "error");
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>متابعة</span> <i class="fas fa-arrow-left"></i>';
        }
    }
};

async function routeUserByRole(uid) {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
        const role = userDoc.data().role;
        
        // تم استبدال رتبة vendor بـ store لتوجيه ملفات البروفايل بشكل متوافق
        const routes = {
            'salon': "../profiles/profile-salon.html",
            'customer': "../profiles/profile-customer.html",
            'store': "../profiles/profile-store.html"
        };
        
        window.location.replace(routes[role] || "../index.html");
    } else {
        showNotification("تم تسجيل الدخول بنجاح، ولكن لم نجد دوراً مسجلاً لحسابك.", "warning");
    }
}

// التحكم بنافذة استعادة كلمة المرور المحدثة والمنظفة بالكامل
document.getElementById('forgotPassBtn').onclick = () => {
    forgotModal.classList.remove('hidden-step');
    forgotModal.classList.add('show-step-animation');
};

const hideModal = () => {
    forgotModal.classList.add('hidden-step');
    forgotModal.classList.remove('show-step-animation');
};

document.getElementById('closeModal').onclick = hideModal;

document.getElementById('sendResetBtn').onclick = async () => {
    const identifier = document.getElementById('resetIdentifier').value.trim();
    if (!identifier) return showNotification("يرجى إدخال البريد الإلكتروني الخاص بك", "error");

    try {
        if (identifier.includes('@')) {
            await sendPasswordResetEmail(auth, identifier);
            showNotification("تم إرسال رابط التعيين الفوري لبريدك الإلكتروني", "success");
            hideModal();
        } else {
            showNotification("الحسابات المرتبطة بأرقام الهواتف تعتمد على الـ OTP فقط ولا تمتلك كلمات مرور تقليدية", "warning");
        }
    } catch (error) {
        showNotification("لم نتمكن من العثور على الحساب أو معالجة الطلب", "error");
    }
};

if (googleBtn) {
    googleBtn.onclick = async (e) => {
        e.stopPropagation();
        googleBtn.disabled = true;
        googleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الاتصال...';

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            
            const userDoc = await getDoc(doc(db, "users", result.user.uid));
            
            if (userDoc.exists()) {
                await routeUserByRole(result.user.uid);
            } else {
                showNotification("أهلاً بك! يرجى تحديد نوع الحساب لإكمال تسجيلك السريع عبر Google.", "info");
                showRegisterOptionsModalForGoogle(result.user);
            }
        } catch (error) {
            showNotification("فشل الارتباط الآمن مع خوادم Google", "error");
            googleBtn.disabled = false;
            googleBtn.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google"> <span>Google</span>';
        }
    };
}

// دالة مخصصة لِحقن الحسابات الجديدة القادمة من Google مع تعديل الـ data-role إلى store
const showRegisterOptionsModalForGoogle = (firebaseUser) => {
    const oldOverlay = document.getElementById('registerOptionsModalOverlay');
    if (oldOverlay) oldOverlay.remove();

    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'registerOptionsModalOverlay';
    modalOverlay.className = 'modal-overlay show-step-animation';

    const modalContent = document.createElement('div');
    modalContent.className = 'auth-container';

    modalContent.innerHTML = `
        <h2>تحديد نوع الحساب</h2>
        <p class="step-desc">اختر دورك في المنصة لإكمال إعداد حسابك الآمن عبر Google</p>
        
        <div class="suggestion-grid">
            <button type="button" class="suggest-link google-role-select-btn" data-role="customer">
                <i class="fas fa-user"></i>
                <span>حساب عميل</span>
            </button>
            <button type="button" class="suggest-link google-role-select-btn" data-role="salon">
                <i class="fas fa-scissors"></i>
                <span>صالون تجميل</span>
            </button>
            <button type="button" class="suggest-link google-role-select-btn" data-role="store">
                <i class="fas fa-store"></i>
                <span>متجر تجاري</span>
            </button>
        </div>
        <button type="button" id="closeRegisterModal" class="back-link-btn">إلغاء الخروج</button>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    document.getElementById('closeRegisterModal').onclick = () => {
        modalOverlay.remove();
        googleBtn.disabled = false;
        googleBtn.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google"> <span>Google</span>';
    };

    modalContent.querySelectorAll('.google-role-select-btn').forEach(button => {
        button.onclick = async () => {
            const role = button.getAttribute('data-role');
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التجهيز...';

            try {
                await setDoc(doc(db, "users", firebaseUser.uid), {
                    fullName: firebaseUser.displayName || "مستخدم Google",
                    contactInfo: firebaseUser.email,
                    authType: "google",
                    role: role,
                    createdAt: new Date(),
                    status: "new"
                });

                modalOverlay.remove();
                window.location.replace(`../onboarding/welcome.html?uid=${firebaseUser.uid}`);
            } catch (error) {
                showNotification("حدث خطأ أثناء حفظ الصلاحيات، يرجى إعادة المحاولة", "error");
                button.disabled = false;
            }
        };
    });
};

// توليد النافذة المنبثقة العادية للتسجيل التقليدي بـ data-role="store"
const showRegisterOptionsModal = () => {
    const oldOverlay = document.getElementById('registerOptionsModalOverlay');
    if (oldOverlay) oldOverlay.remove();

    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'registerOptionsModalOverlay';
    modalOverlay.className = 'modal-overlay show-step-animation';

    const modalContent = document.createElement('div');
    modalContent.className = 'auth-container';

    modalContent.innerHTML = `
        <h2>إنشاء حساب جديد</h2>
        <p class="step-desc">اختر نوع الحساب للانتقال إلى استمارة التسجيل الموحدة</p>
        
        <div class="suggestion-grid">
            <button type="button" class="suggest-link select-role-action-btn" data-role="customer">
                <i class="fas fa-user"></i>
                <span>حساب  عميل</span>
            </button>
            <button type="button" class="suggest-link select-role-action-btn" data-role="salon">
                <i class="fas fa-scissors"></i>
                <span>صالون تجميل</span>
            </button>
            <button type="button" class="suggest-link select-role-action-btn" data-role="store">
                <i class="fas fa-store"></i>
                <span>متجر تجاري</span>
            </button>
        </div>
        <button type="button" id="closeRegisterModal" class="back-link-btn">إلغاء ومراجعة البيانات</button>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    document.getElementById('closeRegisterModal').onclick = () => {
        modalOverlay.remove();
    };

    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) modalOverlay.remove();
    };

    modalContent.querySelectorAll('.select-role-action-btn').forEach(button => {
        button.onclick = () => {
            const role = button.getAttribute('data-role');
            modalOverlay.remove();
            window.location.href = `register.html?role=${role}`;
        };
    });
};

const showRegisterOptions = document.getElementById('showRegisterOptions');
if (showRegisterOptions) {
    showRegisterOptions.onclick = () => {
        showRegisterOptionsModal();
    };
}

if (backToHomeBtn) {
    backToHomeBtn.onclick = () => {
        window.location.href = '../index.html';
    };
}
