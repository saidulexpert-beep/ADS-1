async function initiatePayment() {
    if (!currentUser) return showToastPopup('প্রথমে লগইন করুন');
    const amount = document.getElementById('amountInput').value.trim();
    if (!amount || parseFloat(amount) <= 0) return showToastPopup('সঠিক এমাউন্ট লিখুন');

    const btn = document.getElementById('btnPayGateway');
    btn.disabled = true; 
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';

    const returnUrl = window.location.origin + window.location.pathname;

    const payload = {
        cus_name: currentUser.email.split('@')[0] || 'User',
        cus_email: currentUser.email,
        cus_number: '01700000000',
        success_url: returnUrl + "?status=success",
        cancel_url: returnUrl + "?status=cancel",
        callback_url: returnUrl + "?status=callback",
        amount: parseFloat(amount)
    };

    try {
        const res = await fetch('/api/payment?action=create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        let payUrl = data.payment_url || data.url || (data.data && (data.data.payment_url || data.data.url));

        if (payUrl) {
            window.location.href = payUrl;
        } else {
            showToastPopup(data.message || 'পেমেন্ট গেটওয়েতে সমস্যা হচ্ছে!');
            btn.disabled = false; 
            btn.innerHTML = '<i class="fa-solid fa-lock" style="color: #facc15;"></i> Continue to Payment';
        }
    } catch (err) {
        showToastPopup('সার্ভার কানেকশন ব্যর্থ হয়েছে');
        btn.disabled = false; 
        btn.innerHTML = '<i class="fa-solid fa-lock" style="color: #facc15;"></i> Continue to Payment';
    }
}
