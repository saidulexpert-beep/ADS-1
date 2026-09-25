// api/payment.js
export default async function handler(req, res) {
    // CORS হেডার
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const API_KEY = process.env.TZ_API_KEY || 'IBqczPjssNoCKEP2';
    const { action } = req.query;

    try {
        // ১. পেমেন্ট তৈরি (action=create)
        if (action === 'create' && req.method === 'POST') {
            const { cus_name, cus_email, cus_number, amount, success_url, cancel_url } = req.body;

            if (!amount || parseFloat(amount) <= 0) {
                return res.status(400).json({ status: false, message: 'সঠিক অ্যামাউন্ট প্রদান করুন' });
            }

            // লাইভ ডোমেইন নিশ্চিত করা
            const safeDomain = 'https://used-mail-shop.firebaseapp.com';
            const sUrl = (success_url && success_url.startsWith('http')) ? success_url : `${safeDomain}?status=success`;
            const cUrl = (cancel_url && cancel_url.startsWith('http')) ? cancel_url : `${safeDomain}?status=cancel`;

            const payload = {
                api_key: API_KEY,
                cus_name: cus_name || 'Customer',
                cus_email: cus_email || 'customer@gmail.com',
                cus_number: cus_number || '01700000000',
                amount: parseFloat(amount),
                success_url: sUrl,
                cancel_url: cUrl,
                callback_url: sUrl,
                redirect: true
            };

            // redirect: 'manual' দেওয়া হয়েছে যাতে 302 রিডাইরেক্ট ক্যাচ করা যায়
            const response = await fetch('https://tzsmmpay.com/api/payment/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload),
                redirect: 'manual'
            });

            // যদি গেটওয়ে সরাসরি 302 রিডাইরেক্ট করে
            if (response.status >= 300 && response.status < 400) {
                const redirectUrl = response.headers.get('location');
                if (redirectUrl) {
                    return res.status(200).json({ status: true, payment_url: redirectUrl });
                }
            }

            const rawText = await response.text();
            let data;
            try {
                data = JSON.parse(rawText);
            } catch (err) {
                return res.status(500).json({ 
                    status: false, 
                    message: 'গেটওয়ে থেকে অপ্রত্যাশিত রেসপন্স এসেছে', 
                    raw: rawText.substring(0, 150) 
                });
            }

            return res.status(response.status).json(data);
        }

        // ২. পেমেন্ট ভেরিফাই (action=verify)
        else if (action === 'verify') {
            const trx_id = req.query.trx_id || (req.body && req.body.trx_id);

            if (!trx_id) {
                return res.status(400).json({ status: false, message: 'Transaction ID (trx_id) পাওয়া যায়নি' });
            }

            const verifyUrl = `https://tzsmmpay.com/api/payment/verify?api_key=${API_KEY}&trx_id=${encodeURIComponent(trx_id)}`;
            
            const response = await fetch(verifyUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            const rawText = await response.text();
            let data;
            try {
                data = JSON.parse(rawText);
            } catch (err) {
                return res.status(500).json({ 
                    status: false, 
                    message: 'ভেরিফিকেশন রেসপন্স ত্রুটিপূর্ণ', 
                    raw: rawText.substring(0, 150) 
                });
            }

            return res.status(response.status).json(data);
        }

        return res.status(404).json({ status: false, message: 'Invalid Action' });

    } catch (error) {
        return res.status(500).json({ 
            status: false, 
            message: 'সার্ভার এরর: ' + error.message 
        });
    }
}
