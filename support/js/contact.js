/**
 * BarberFlow Pro - Contact Module Core Logic
 */

document.addEventListener("DOMContentLoaded", () => {
    // معالجة نموذج التواصل
    const form = document.getElementById("contactSupportForm");
    form?.addEventListener("submit", (e) => {
        e.preventDefault();
        alert("تم إرسال تذكرتك بنجاح! فريق الدعم سيتواصل معك قريباً.");
        form.reset();
    });
});
