// api/payment.js

export default async function handler(req, res) {
    // CORS হেডার যুক্ত করা (যাতে যেকোনো ডোমেন বা লোকালহোস্ট থেকে কাজ করে)
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // প্রি-ফ্লাইট OPTIONS রিকোয়েস্ট হ্যান্ডেল করা
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Only POST method is allowed' });
    }

    const { action } = req.query;
    const API_KEY = process.env.TZ_API_KEY || 'IBqczPjssNoCKEP2';

    try {
        // ১. পেমেন্ট তৈরি করার রিকোয়েস্ট (action=create)
        if (!action || action === 'create') {
            const { 
                amount, 
                cus_name, 
                cus_email, 
                cus_number, 
                success_url, 
                cancel_url, 
                callback_url 
            } = req.body;

            if (!amount || parseFloat(amount) <= 0) {
                return res.status(400).json({ success: false, message: 'সঠিক এমাউন্ট প্রদান করুন' });
            }

            // TZ SMMPAY-এর জন্য পে-লোড প্রস্তুত করা
            const payload = {
                api_key: API_KEY,
                cus_name: cus_name || 'Customer',
                cus_email: cus_email || 'customer@gmail.com',
                cus_number: cus_number || '01700000000',
                amount: parseFloat(amount),
                success_url: success_url,
                cancel_url: cancel_url,
                callback_url: callback_url || success_url,
                redirect: false // API থেকে JSON রেসপন্স পাওয়ার জন্য
            };

            // TZ SMMPAY API-তে সার্ভার টু সার্ভার কল
            const gatewayRes = await fetch('https://tzsmmpay.com/api/payment/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await gatewayRes.json();
            return res.status(200).json(data);
        }

        // ২. পেমেন্ট ভেরিফাই করার রিকোয়েস্ট (action=verify)
        if (action === 'verify') {
            const { transaction_id } = req.body;

            if (!transaction_id) {
                return res.status(400).json({ success: false, message: 'Transaction ID প্রয়োজন' });
            }

            // TZ SMMPAY এর ভেরিফিকেশন কল
            const verifyRes = await fetch('https://tzsmmpay.com/api/payment/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    api_key: API_KEY,
                    transaction_id: transaction_id
                })
            });

            const verifyData = await verifyRes.json();
            return res.status(200).json(verifyData);
        }

        return res.status(400).json({ success: false, message: 'Invalid action parameter' });

    } catch (error) {
        console.error('Payment API Error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'সার্ভার ইন্টারনাল এরর হয়েছে', 
            error: error.message 
        });
    }
}
