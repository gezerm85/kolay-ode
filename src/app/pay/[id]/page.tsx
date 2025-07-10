'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/init';
import { PaymentForm } from '@/components/PaymentForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2, User, Landmark, CheckCircle, CreditCard, CalendarDays } from 'lucide-react';
import { Logo } from '@/components/Logo';

type PaymentDetailsData = {
  amount: number;
  installments: number[];
  customerName: string;
  bank: string;
  status: 'Ödendi' | 'Bekliyor';
  createdAt: Timestamp;
};

type PaymentDetailsProps = {
    paymentId: string;
    data: PaymentDetailsData;
}

function PaymentDetailsDisplay({ paymentId, data }: PaymentDetailsProps) {
    const { amount, installments, customerName, bank, status } = data;

    if (status === 'Ödendi') {
         return (
            <Card>
                <CardHeader>
                    <CardTitle>Ödeme Tamamlandı</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center text-center p-8 bg-success/10 dark:bg-success/20 rounded-lg">
                        <CheckCircle className="w-16 h-16 text-success mb-4"/>
                        <h3 className="text-xl font-bold text-success">Ödeme Daha Önce Alınmış</h3>
                        <p className="text-muted-foreground mt-2">Bu link ile ilişkili ödeme zaten tamamlanmış.</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className='text-center mb-6'>
                    <CardDescription>Toplam Ödenecek Tutar</CardDescription>
                    <p className="text-3xl font-bold text-primary sm:text-4xl">₺{amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>

                <div className='space-y-3 rounded-lg border p-4'>
                    <div className="flex justify-between items-center text-sm">
                        <span className='flex items-center gap-2 text-muted-foreground'><User className="h-4 w-4" /> Müşteri Adı</span>
                        <span className="font-semibold text-foreground">{customerName}</span>
                    </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className='flex items-center gap-2 text-muted-foreground'><Landmark className="h-4 w-4" /> Banka</span>
                        <span className="font-semibold text-foreground">{bank}</span>
                    </div>
                     <div className="flex justify-between items-center text-sm">
                       <span className='flex items-center gap-2 text-muted-foreground'><CalendarDays className="h-4 w-4" /> İşlem Tarihi</span>
                       <span className="font-semibold text-foreground">
                           {new Date().toLocaleDateString('tr-TR')}
                        </span>
                    </div>
                </div>

            </CardHeader>
            <CardContent>
                <PaymentForm paymentId={paymentId} installmentOptions={installments} />
            </CardContent>
        </Card>
    )
}

export default function PaymentPage() {
  const params = useParams<{ id: string }>();
  const [paymentData, setPaymentData] = useState<PaymentDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const paymentId = params.id;
    if (!paymentId) {
        setError("Geçersiz Ödeme Linki: ID bulunamadı.");
        setLoading(false);
        return;
    };

    const fetchPaymentDetails = async () => {
        try {
            const docRef = doc(db, "payments", paymentId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setPaymentData(docSnap.data() as PaymentDetailsData);
            } else {
                setError("Bu ödeme linki geçerli değil. Lütfen linki kontrol edin veya yeni bir link isteyin.");
            }
        } catch (err)
        {
            console.error(err);
            setError("Ödeme bilgileri alınırken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    fetchPaymentDetails();
  }, [params.id]);

  const renderContent = () => {
    if (loading) {
        return (
            <Card className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </Card>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Geçersiz Ödeme Linki</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }
    
    if (paymentData) {
        return <PaymentDetailsDisplay paymentId={params.id} data={paymentData} />;
    }

    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
            <Logo />
        </div>
        {renderContent()}
      </div>
    </div>
  );
}
