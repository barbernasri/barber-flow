/**
 * BarberFlow Pro - Survey Module Core Logic
 */

document.addEventListener("DOMContentLoaded", () => {
    // معالجة نموذج الاستبيان
    const form = document.getElementById("platformSurveyForm");
    form?.addEventListener("submit", (e) => {
        e.preventDefault();
        alert("شكراً لمشاركتك! تم حفظ استبيانك بنجاح.");
        form.reset();
    });
});
