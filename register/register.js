import { auth, db } from "../../core/firebase-init.js";
import { 
    RecaptchaVerifier, signInWithPhoneNumber, GoogleAuthProvider, 
    signInWithPopup, createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { showNotification } from "../../auth/js/notifications.js";

let confirmationResult;
let timerInterval;
let selectedRole = null; 

const googleProvider = new GoogleAuthProvider();

const registerStep = document.getElementById('registerStep');
const verifyStep = document.getElementById('verifyStep');

const unifiedRegisterForm = document.getElementById('unifiedRegisterForm');
const submitBtn = document.getElementById('mainSubmitBtn');
const confirmOtpBtn = document.getElementById('confirmOtpBtn');
const googleBtn = document.getElementById('googleBtn');
const resendCodeBtn = document.getElementById('resendCodeBtn');
const backHomeBtn = document.getElementById('backHomeBtn');

const passwordGroup = document.getElementById('passwordGroup');
const regIdentifierInput = document.getElementById('regIdentifier');
const regPasswordInput = document.getElementById('regPassword');

// تعديل المفتاح هنا من 'vendor' إلى 'store' لتوحيد منطق المنصة
const roleLocalization = {
    'customer': {
        title: "حساب زبون جديد | BarberFlow Pro",
        heading: "انضم كزبون مميز",
        subheading: "احجز موعدك القادم في أرقى صالونات المغرب",
        labelName: "الاسم الكامل",
        placeholderName: "أدخل اسمك الكامل",
        btnText: "إنشاء حسابي كزبون",
        storageKey: "tempCustData"
    },
    'salon': {
        title: "إنشاء حساب صالون | BarberFlow Pro",
        heading: "إنشاء حساب لصالون جديد",
        subheading: "ابدأ بتنظيم مواعيدك وإدارة صالونك باحترافية",
        labelName: "الاسم الكامل للمالك",
        placeholderName: "أدخل اسم المالك الكامل",
        btnText: "إنشاء حساب الصالون",
        storageKey: "tempSalonData"
    },
    'store': {
        title: "انضم كتاجر | BarberFlow Pro",
        heading: "إنشاء حساب صاحب متجر",
        subheading: "ابدأ ببيع منتجاتك لآلاف الزبائن وصالونات الحلاقة",
        labelName: "اسم التاجر / الشركة",
        placeholderName: "أدخل اسمك الكامل أو اسم المتجر التجاري",
        btnText: "تسجيل كتاجر جديد",
        storageKey: "tempStoreData"
    }
};

const resetSubmitButton = () => {
    submitBtn.disabled = false;
    if (selectedRole && roleLocalization[selectedRole]) {
        submitBtn.innerHTML = `<span>${roleLocalization[selectedRole].btnText}</span> <i class="fas fa-arrow-left"></i>`;
    }
};

const resetOtpButton = () => {
    confirmOtpBtn.disabled = false;
    confirmOtpBtn.innerHTML = 'تأكيد وفتح الحساب';
};

const initRecaptcha = () => {
    if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
    }
    const container = document.getElementById('recaptcha-container');
    if (container) {
        container.innerHTML = '';
    }
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
    });
};

function formatMoroccanPhoneNumber(phone) {
    let cleaned = phone.replace(/\s+/g, '');
    if (cleaned.startsWith('06') || cleaned.startsWith('07')) {
        return '+212' + cleaned.substring(1);
    }
    return cleaned;
}

async function isIdentifierTaken(identifier) {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("contactInfo", "==", identifier));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error("Error verifying identifier:", error);
        return false;
    }
}

function startTimer() {
    let timeLeft = 60;
    resendCodeBtn.style.display = 'none';
    document.getElementById('timerContainer').style.display = 'block';
    document.getElementById('timer').textContent = timeLeft;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            document.getElementById('timerContainer').style.display = 'none';
            resendCodeBtn.style.display = 'inline-block';
        }
    }, 1000);
}

function setupRegistrationUI(role) {
    const config = roleLocalization[role];
    if (!config) {
        window.location.replace("login.html");
        return;
    }

    document.title = config.title;
    document.getElementById('registerHeading').textContent = config.heading;
    document.getElementById('registerSubheading').textContent = config.subheading;
    document.getElementById('labelName').textContent = config.labelName;
    document.getElementById('regName').placeholder = config.placeholderName;
    document.getElementById('submitBtnText').textContent = config.btnText;
    
    registerStep.classList.remove('hidden-step');
    registerStep.classList.add('show-step-animation');

    regIdentifierInput.value = '';
    regPasswordInput.value = '';
    regPasswordInput.required = false;
    passwordGroup.classList.add('hidden-step');
    passwordGroup.classList.remove('show-step-animation');
}

regIdentifierInput.addEventListener('input', () => {
    const value = regIdentifierInput.value.trim();
    if (value.includes('@')) {
        if (passwordGroup.classList.contains('hidden-step')) {
            passwordGroup.classList.remove('hidden-step');
            passwordGroup.classList.add('show-step-animation');
            regPasswordInput.required = true;
        }
    } else {
        passwordGroup.classList.add('hidden-step');
        passwordGroup.classList.remove('show-step-animation');
        regPasswordInput.required = false;
        regPasswordInput.value = ''; 
    }
});

unifiedRegisterForm.onsubmit = async (e) => {
    e.preventDefault();
    if (!selectedRole) return window.location.replace("login.html");

    const name = document.getElementById('regName').value.trim();
    const identifier = regIdentifierInput.value.trim();

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق من البيانات...';

    if (identifier.includes('@')) {
        const password = regPasswordInput.value;
        if (!password || password.length < 6) {
            showNotification("يرجى إدخال كلمة مرور صالحة لا تقل عن 6 أحرف", "error");
            resetSubmitButton();
            return;
        }

        const taken = await isIdentifierTaken(identifier);
        if (taken) {
            showNotification("البريد الإلكتروني المدخل مستخدم في حساب آخر!", "error");
            resetSubmitButton();
            return;
        }

        try {
            const result = await createUserWithEmailAndPassword(auth, identifier, password);
            await saveUserToDB(result.user.uid, name, identifier, selectedRole, "email");
            window.location.replace(`../onboarding/welcome.html?uid=${result.user.uid}`);
        } catch (error) {
            showNotification("فشل إنشاء الحساب، يرجى التحقق من صحة البيانات أو قوة كلمة المرور", "error");
            resetSubmitButton();
        }
    } else {
        const formattedPhone = formatMoroccanPhoneNumber(identifier);
        if (!formattedPhone.startsWith('+212') || formattedPhone.length < 13) {
            showNotification("يرجى إدخال بريد إلكتروني صحيح أو رقم هاتف مغربي يبدأ بـ 06 أو 07", "error");
            resetSubmitButton();
            return;
        }

        const taken = await isIdentifierTaken(formattedPhone);
        if (taken) {
            showNotification("رقم الهاتف هذا مسجل لدينا في حساب سابق!", "error");
            resetSubmitButton();
            return;
        }

        const config = roleLocalization[selectedRole];
        localStorage.setItem(config.storageKey, JSON.stringify({ name, phone: formattedPhone, role: selectedRole }));

        try {
            initRecaptcha();
            confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
            
            registerStep.classList.add('hidden-step');
            registerStep.classList.remove('show-step-animation');
            
            verifyStep.classList.remove('hidden-step');
            verifyStep.classList.add('show-step-animation');
            startTimer();
        } catch (error) {
            showNotification("فشل إرسال رمز التحقق لهاتفك، يرجى إعادة المحاولة لاحقاً", "error");
            resetSubmitButton();
        }
    }
};

confirmOtpBtn.onclick = async () => {
    const code = document.getElementById('otpCode').value.trim();
    if (code.length !== 6) return showNotification("يرجى كتابة الرمز المكون من 6 أرقام بالكامل", "error");

    confirmOtpBtn.disabled = true;
    confirmOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تأكيد الحساب الحصري...';

    const config = roleLocalization[selectedRole];
    const rawData = localStorage.getItem(config.storageKey);
    if (!rawData) {
        showNotification("انتهت صلاحية الجلسة الآمنة، أعد كتابة بياناتك مجدداً", "error");
        setTimeout(() => window.location.replace("login.html"), 2000);
        return;
    }

    const tempData = JSON.parse(rawData);

    try {
        const result = await confirmationResult.confirm(code);
        await saveUserToDB(result.user.uid, tempData.name, tempData.phone, tempData.role, "phone");
        localStorage.removeItem(config.storageKey);
        clearInterval(timerInterval);
        window.location.replace(`../onboarding/welcome.html?uid=${result.user.uid}`);
    } catch (error) { 
        showNotification("رمز تأكيد الهوية المدخل غير صحيح", "error"); 
        resetOtpButton();
    }
};

resendCodeBtn.onclick = async () => {
    const config = roleLocalization[selectedRole];
    const rawData = localStorage.getItem(config.storageKey);
    if (!rawData) return showNotification("لم نتمكن من استعادة البيانات لإعادة إرسال الرمز", "error");

    const tempData = JSON.parse(rawData);
    resendCodeBtn.disabled = true;

    try {
        initRecaptcha();
        confirmationResult = await signInWithPhoneNumber(auth, tempData.phone, window.recaptchaVerifier);
        showNotification("تم توليد وإرسال كود تحقق جديد بنجاح", "success");
        startTimer();
    } catch (error) {
        showNotification("فشلت عملية إعادة تفعيل الرمز المحدث", "error");
    } finally {
        resendCodeBtn.disabled = false;
    }
};

document.getElementById('backToRegisterBtn').onclick = () => {
    verifyStep.classList.add('hidden-step');
    verifyStep.classList.remove('show-step-animation');
    
    registerStep.classList.remove('hidden-step');
    registerStep.classList.add('show-step-animation');
    clearInterval(timerInterval);
    resetSubmitButton();
    resetOtpButton();
};

googleBtn.onclick = async () => {
    if (!selectedRole) return window.location.replace("login.html");
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const taken = await isIdentifierTaken(result.user.email);
        if (!taken) {
            await saveUserToDB(result.user.uid, result.user.displayName || "مستخدم جديد", result.user.email, selectedRole, "google");
        }
        window.location.replace(`../onboarding/welcome.html?uid=${result.user.uid}`);
    } catch (error) {
        showNotification("فشل تسجيل الدخول الفوري عبر خوادم Google", "error");
    }
};

async function saveUserToDB(uid, name, contact, role, type) {
    await setDoc(doc(db, "users", uid), {
        fullName: name,
        contactInfo: contact,
        authType: type,
        role: role,
        createdAt: new Date(),
        status: "new"
    });
}

if (backHomeBtn) {
    backHomeBtn.onclick = () => {
        window.location.href = '../index.html';
    };
}

window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get('role'); 
    const statusParam = urlParams.get('status');

    if (statusParam === 'pending') {
        for (const [role, config] of Object.entries(roleLocalization)) {
            if (localStorage.getItem(config.storageKey)) {
                selectedRole = role;
                setupRegistrationUI(selectedRole);
                registerStep.classList.add('hidden-step');
                registerStep.classList.remove('show-step-animation');
                
                verifyStep.classList.remove('hidden-step');
                verifyStep.classList.add('show-step-animation');
                showNotification("تم استرجاع بيانات التسجيل المعلقة، يمكنك النقر على إعادة الإرسال للحصول على رمز جديد.", "info");
                return;
            }
        }
    }

    if (roleParam && roleLocalization[roleParam]) {
        selectedRole = roleParam;
        setupRegistrationUI(selectedRole);
    } else {
        window.location.replace("login.html");
    }
});
