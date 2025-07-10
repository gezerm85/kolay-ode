'use server';

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/init';
import { createHash } from 'crypto';
import type { Payment } from '@/types/payment';

type GarantiPaymentResult = {
    redirectUrl: string;
    redirectData: Record<string, string>;
    error?: undefined;
} | {
    error: string;
    redirectUrl?: undefined;
    redirectData?: undefined;
};

// Generates a unique order ID for Garanti
function generateOrderId(paymentId: string) {
    // Garanti order IDs are typically just alphanumeric.
    // We can use the paymentId directly if it fits length requirements,
    // or truncate/hash it. We will use a prefix and truncate.
    return `KOLAY${paymentId}`.slice(0, 24);
}

export async function startGarantiPayment(paymentId: string): Promise<GarantiPaymentResult> {
    try {
        // 1. Get Bank API settings from Firestore
        const settingsRef = doc(db, "settings", "bankApi");
        const settingsSnap = await getDoc(settingsRef);

        if (!settingsSnap.exists()) {
            throw new Error("Banka API ayarları bulunamadı.");
        }
        const settings = settingsSnap.data();
        const merchantId = settings.garanti_merchantId;
        const terminalId = settings.garanti_terminalId;
        const provUserId = settings.garanti_provUserId;
        const password = settings.garanti_password;
        
        if (!merchantId || !terminalId || !provUserId || !password) {
            return { error: "Garanti API ayarları eksik. Lütfen tüm alanları doldurun." };
        }
        
        // 2. Get Payment details from Firestore
        const paymentRef = doc(db, "payments", paymentId);
        const paymentSnap = await getDoc(paymentRef);
        if (!paymentSnap.exists()) {
            throw new Error("Ödeme kaydı bulunamadı.");
        }
        const payment = paymentSnap.data() as Payment;

        // 3. Prepare data for Garanti Pay Hosting
        const orderId = generateOrderId(paymentId);
        
        // Amount must be in cents (kurus), e.g., 123.45 TL -> "12345"
        const amount = (payment.amount * 100).toFixed(0);
        const currencyCode = "949"; // 949 is for TRY

        const installment = (payment.chosenInstallment && payment.chosenInstallment > 1) 
            ? `${String(payment.chosenInstallment).padStart(2, '0')}` 
            : ''; // Empty for single payment
        
        const host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:9002';
        const successUrl = `${host}/api/garanti/callback`;
        const errorUrl = `${host}/api/garanti/callback`;
        const tranType = 'sales';

        // 4. Calculate the security hash (securecode)
        // Format: SHA1(password + terminalId)
        const terminalHashStr = password + terminalId.padStart(9, '0');
        const terminalHash = createHash('sha1').update(terminalHashStr).digest('hex').toUpperCase();
        
        // Format: SHA1(terminalId + orderId + amount + successUrl + errorUrl + tranType + storekey)
        const securityDataStr = `${terminalId}${orderId}${amount}${successUrl}${errorUrl}${tranType}${password}`;
        const secureCode = createHash('sha1').update(securityDataStr).digest('hex').toUpperCase();

        // 5. Prepare data for the form post to Garanti
        const redirectUrl = "https://sanalposprov.garanti.com.tr/servlet/Paygate";
        const redirectData = {
            mode: "PROD", // or "TEST"
            apiversion: "v0.01",
            terminalid: terminalId,
            terminalmerchantid: merchantId,
            terminalprovuserid: provUserId,
            terminaluserid: provUserId, // Often same as provuserid
            txntype: tranType,
            txnamount: amount,
            txncurrencycode: currencyCode,
            txninstallmentcount: installment,
            orderid: orderId,
            successurl: successUrl,
            errorurl: errorUrl,
            customeremailaddress: '',
            customeripaddress: '127.0.0.1', // Should be the user's actual IP
            securecode: secureCode,
        };
        
        return { redirectUrl, redirectData };

    } catch (err: any) {
        console.error("Garanti ödeme başlatma hatası:", err);
        const errorMessage = err.message || "Bilinmeyen bir sunucu hatası oluştu.";
        if (err.cause) { 
             return { error: `Ödeme işlemi başlatılırken bir ağ hatası oluştu. Banka sunucusuna ulaşılamıyor. Lütfen sistem yöneticinizle görüşün.` };
        }
        return { error: `Ödeme işlemi başlatılırken sunucuda bir hata oluştu. Detaylar: ${errorMessage}` };
    }
}
