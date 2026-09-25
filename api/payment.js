// api/payment.js

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const API_KEY = process.env.TZ_API_KEY || 'IBqczPjssNoCKEP2';
    const { action } = req.query;

    try {
        if (action === 'create' && req.method === 'POST') {
            const { cus_name, cus_email, cus_number, amount, success_url, cancel_url } = req.body;

            // লাইভ ডোমেইন নিশ্চিত করা (যদি লোকালহোস্টে থাকেন)
            const fallbackDomain = 'https://used-mail-shop.firebaseapp.com';
            const validSuccessUrl = (success_url && success_url.startsWith('http')) ? success_url : fallbackDomain;
            const validCancelUrl = (cancel_url && cancel_url.startsWith('http')) ? cancel_url : fallbackDomain;

            const payload = {
                api_key: API_KEY,
                cus_name: cus_name || 'Customer',
                cus_email: cus_email || 'test@mail.com',
                cus_number: cus_number || '01711111111',
                amount: Number(amount),
                success_url: validSuccessUrl,
                cancel_url: validCancelUrl,
                callback_url: validSuccessUrl,
                redirect: true
            };

            const response = await fetch('https://tzsmmpay.com/api/payment/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const textResponse = await response.text();
            let data;
            try {
                data = JSON.parse(textResponse);
            } catch (e) {
                return res.status(500).json({ 
                    status: false, 
                    message: 'Gateway returned non-JSON response', 
                    raw: textResponse 
                });
            }

            return res.status(response.status).json(data);
        }

        else if (action === 'verify') {
            const trx_id = req.query.trx_id || (req.body && req.body.trx_id);

            if (!trx_id) {
                return res.status(400).json({ status: false, message: 'trx_id প্রদান করা হয়নি' });
            }

            const response = await fetch(`https://tzsmmpay.com/api/payment/verify?api_key=${API_KEY}&trx_id=${encodeURIComponent(trx_id)}`, {
                headers: { 'Accept': 'application/json' }
            });

            const data = await response.json();
            return res.status(response.status).json(data);
        }

        return res.status(400).json({ status: false, message: 'Invalid Action' });

    } catch (error) {
        return res.status(500).json({ 
            status: false, 
            message: error.message || 'সার্ভার কানেকশনে সমস্যা' 
        });
    }
}
