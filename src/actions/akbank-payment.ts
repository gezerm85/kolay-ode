'use server';

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/init';
import { createHash, randomBytes } from 'crypto';
import type { Payment } from '@/types/payment';

type AkbankPaymentResult = {
    redirectUrl: string;
    redirectData: Record<string, string>;
    error?: undefined;
} | {
    error: string;
    redirectUrl?: undefined;
    redirectData?: undefined;
};

// Generates a unique order ID for Akbank, which must be between 20-24 characters.
function generateOrderId(paymentId: string) {
    const randomPart = randomBytes(4).toString('hex').toUpperCase();
    const truncatedPaymentId = paymentId.slice(0, 15);
    return `KRS${truncatedPaymentId}${randomPart}`.slice(0, 24);
}

export async function startAkbankPayment(paymentId: string): Promise<AkbankPaymentResult> {
    try {
        // 1. Get Bank API settings from Firestore
        const settingsRef = doc(db, "settings", "bankApi");
        const settingsSnap = await getDoc(settingsRef);
        if (!settingsSnap.exists()) {
            throw new Error("Banka API ayarları bulunamadı.");
        }
        const settings = settingsSnap.data();
        const merchantId = settings.akbank_merchantId;
        const terminalNo = settings.akbank_terminalNo;
        const posnetId = settings.akbank_posnetId;
        const storeKey = settings.akbank_storeKey;

        if (!merchantId || !terminalNo || !posnetId || !storeKey) {
            return { error: "Akbank API ayarları eksik. Lütfen tüm alanları doldurun." };
        }

        // 2. Get Payment details from Firestore
        const paymentRef = doc(db, "payments", paymentId);
        const paymentSnap = await getDoc(paymentRef);
        if (!paymentSnap.exists()) {
            throw new Error("Ödeme kaydı bulunamadı.");
        }
        const payment = paymentSnap.data() as Payment;

        // 3. Prepare data for Akbank Pay Hosting
        const orderId = generateOrderId(paymentId);
        await updateDoc(paymentRef, { akbankOrderId: orderId });
        
        // Amount must be in cents (kurus), e.g., 123.45 TL -> "12345"
        const amount = (payment.amount * 100).toFixed(0);
        const currencyCode = "949"; // 949 is the numeric code for TRY
        
        // Installment count. '00' or empty for single payment.
        const installment = (payment.chosenInstallment && payment.chosenInstallment > 1) 
            ? `${String(payment.chosenInstallment).padStart(2, '0')}` 
            : '00';
        
        const host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:9002';
        const merchantReturnURL = `${host}/api/akbank/callback`;
        
        // 4. Calculate the security hash (digest)
        const hashStr = `${terminalNo}${orderId}${amount}${currencyCode}${merchantId}${storeKey}`;
        const digest = createHash('sha256').update(hashStr).digest('base64');

        // 5. Prepare data for the form post to Akbank
        const redirectUrl = "https://virtualpospaymentgateway.akbank.com/payhosting";
        const redirectData = {
            mid: merchantId,
            tid: terminalNo,
            posnetID: posnetId,
            posnetData: orderId,
            posnetData2: '',
            digest: digest,
            amount: amount,
            currencyCode: currencyCode,
            taksit: installment,
            tranType: 'Sale',
            merchantReturnURL: merchantReturnURL,
            lang: 'tr',
            openNewWindow: '1',
        };
        
        return { redirectUrl, redirectData };

    } catch (err: any) {
        console.error("Akbank ödeme başlatma hatası:", err);
        const errorMessage = err.message || "Bilinmeyen bir sunucu hatası oluştu.";
        if (err.cause) { 
            return { error: `Ödeme işlemi başlatılırken bir ağ hatası oluştu. Banka sunucusuna ulaşılamıyor. Lütfen sistem yöneticinizle görüşün.` };
        }
        return { error: `Ödeme işlemi başlatılırken sunucuda bir hata oluştu. Detaylar: ${errorMessage}` };
    }
}
