'use server';

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/init';
import type { Payment } from '@/types/payment';

type IsbankPaymentResult = {
    htmlContent: string;
    error?: undefined;
} | {
    error: string;
    htmlContent?: undefined;
};

async function getClientIp() {
    try {
        const { headers } = await import('next/headers');
        const ip = headers().get('x-forwarded-for') || '127.0.0.1';
        return ip.split(',')[0].trim();
    } catch (e) {
        return '127.0.0.1';
    }
}

export async function startIsbankPayment(paymentId: string): Promise<IsbankPaymentResult> {
    try {
        const settingsRef = doc(db, "settings", "bankApi");
        const settingsSnap = await getDoc(settingsRef);
        if (!settingsSnap.exists()) {
            throw new Error("Banka API ayarları bulunamadı.");
        }
        const settings = settingsSnap.data();
        const clientId = settings.isbank_clientId;
        const storeKey = settings.isbank_storeKey;
        const username = settings.isbank_username;
        const password = settings.isbank_password;

        if (!clientId || !storeKey || !username || !password) {
            return { error: "İş Bankası API ayarları eksik. Lütfen tüm alanları doldurun." };
        }

        const paymentRef = doc(db, "payments", paymentId);
        const paymentSnap = await getDoc(paymentRef);
        if (!paymentSnap.exists()) {
            throw new Error("Ödeme kaydı bulunamadı.");
        }
        const payment = paymentSnap.data() as Payment;

        const amount = payment.amount.toFixed(2);
        const installment = (payment.chosenInstallment && payment.chosenInstallment > 1) ? String(payment.chosenInstallment) : '';
        const orderId = `KOLAY${paymentId}`.slice(0, 24);

        const host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:9002';
        const successUrl = `${host}/api/isbank/callback`;
        const failUrl = `${host}/api/isbank/callback`;

        const ip = await getClientIp();

        const hashstr = `${clientId}${orderId}${amount}949${successUrl}${failUrl}3d_pay_hosting${installment}${storeKey}`;
        const hash = require('crypto').createHash('sha1').update(hashstr).digest('base64');

        const xml = `<?xml version="1.0" encoding="ISO-8859-9"?>
<CC5Request>
<Name>${username}</Name>
<Password>${password}</Password>
<ClientId>${clientId}</ClientId>
<IPAddress>${ip}</IPAddress>
<Email>destek@kereste.com.tr</Email>
<Mode>P</Mode>
<OrderId>${orderId}</OrderId>
<GroupId></GroupId>
<TransId></TransId>
<UserId></UserId>
<Type>Auth</Type>
<Currency>949</Currency>
<Taksit>${installment}</Taksit>
<Amount>${amount}</Amount>
<OkUrl>${successUrl}</OkUrl>
<FailUrl>${failUrl}</FailUrl>
<StoreType>3d_pay_hosting</StoreType>
<Hash>${hash}</Hash>
<Lang>tr</Lang>
<Extra></Extra>
</CC5Request>`;
        
        const singleLineXml = xml.replace(/(\r\n|\n|\r)/gm, "").replace(/>\s+</g, '><');

        const response = await fetch("https://spos.isbank.com.tr/servlet/est3Dgate", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `data=${encodeURIComponent(singleLineXml)}`
        });

        if (!response.ok) {
            throw new Error(`Banka sunucusuyla iletişim kurulamadı. Status: ${response.status}`);
        }

        const responseText = await response.text();
        
        if (responseText.includes("<form")) {
             return { htmlContent: responseText };
        } 
        
        const match = responseText.match(/<ErrorMessage>(.*?)<\/ErrorMessage>/);
        const errorMessage = match ? match[1] : 'Bilinmeyen bir banka hatası oluştu.';
        return { error: `Banka Hatası: ${errorMessage}` };

    } catch (err: any) {
        console.error("İş Bankası ödeme başlatma hatası:", err);
        const errorMessage = err.message || "Bilinmeyen bir sunucu hatası oluştu.";
         if (err.cause) { 
             return { error: `Ödeme işlemi başlatılırken bir ağ hatası oluştu. Banka sunucusuna ulaşılamıyor. Lütfen sistem yöneticinizle görüşün.` };
        }
        return { error: `Ödeme işlemi başlatılırken sunucuda bir hata oluştu. Detaylar: ${errorMessage}` };
    }
}
