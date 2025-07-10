'use server';

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/init';

type TestConnectionResult = {
    success: boolean;
    message: string;
};

export async function testIsbankConnection(): Promise<TestConnectionResult> {
    try {
        const settingsRef = doc(db, "settings", "bankApi");
        const settingsSnap = await getDoc(settingsRef);

        if (!settingsSnap.exists()) {
            return { success: false, message: "Banka API ayarları bulunamadı." };
        }
        const settings = settingsSnap.data();
        const clientId = settings.isbank_clientId;
        const username = settings.isbank_username;
        const password = settings.isbank_password;

        if (!clientId || !username || !password) {
            return { success: false, message: "İş Bankası için Mağaza Numarası, API Kullanıcı Adı ve Şifre alanları zorunludur." };
        }

        const xml = `<?xml version="1.0" encoding="utf-8"?>
<CC5Request>
<Name>${username}</Name>
<Password>${password}</Password>
<ClientId>${clientId}</ClientId>
<Type>puan</Type>
<Total>1</Total>
<Currency>949</Currency>
</CC5Request>`;
        
        const singleLineXml = xml.replace(/(\r\n|\n|\r)/gm, "").replace(/>\s+</g, '><');

        const response = await fetch("https://spos.isbank.com.tr/servlet/cc5ApiServer", {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(singleLineXml)}`,
        });

        if (!response.ok) {
            return { success: false, message: `Banka sunucusuna ulaşılamadı. HTTP Durumu: ${response.status}` };
        }
        
        const responseText = await response.text();

        if (responseText.includes("<Response>Approved</Response>")) {
             return { success: true, message: "İş Bankası API bilgileri doğrulandı." };
        }

        if (responseText.includes("<Response>Error</Response>") || responseText.includes("<ProcReturnCode>99</ProcReturnCode>")) {
            const match = responseText.match(/<ErrorMessage>(.*?)<\/ErrorMessage>/);
            const detail = match ? match[1] : 'Geçersiz kullanıcı adı veya şifre.';
            return { success: false, message: `Bağlantı başarısız. Banka Yanıtı: ${detail}` };
        }

        if (responseText.includes("<ProcReturnCode>54</ProcReturnCode>")) {
            return { success: false, message: "Bağlantı başarısız. Banka Yanıtı: Kart hatalı." };
        }

        return { success: false, message: "Banka beklenmedik bir yanıt döndürdü. Lütfen bilgileri kontrol edin." };

    } catch (err: any) {
        console.error("İş Bankası bağlantı testi hatası:", err);
         if (err.cause) { 
            return { success: false, message: `Ağ hatası: Banka sunucusuna ulaşılamıyor. Sistem yöneticinizle görüşün.` };
        }
        return { success: false, message: `Sunucu hatası: ${err.message}` };
    }
}
