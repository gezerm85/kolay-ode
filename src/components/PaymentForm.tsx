'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CreditCard, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';
import { doc, updateDoc, serverTimestamp, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/init';
import type { Payment } from '@/types/payment';

const paymentFormSchema = z.object({
  cardNumber: z.string()
    .min(19, "Geçerli bir kart numarası girin (16 hane).")
    .max(19, "Geçerli bir kart numarası girin (16 hane)."),
  cardName: z.string().min(2, "Kart üzerindeki adı girin."),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\s?\/\s?\d{2}$/, "Geçerli bir son kullanma tarihi girin (AA / YY)."),
  cvc: z.string().min(3, "CVC 3 veya 4 haneli olmalıdır.").max(4),
  chosenInstallment: z.coerce.number({invalid_type_error: "Lütfen bir taksit seçeneği belirleyin."}),
});

interface PaymentFormProps {
    paymentId: string;
    installmentOptions: number[];
}

export function PaymentForm({ paymentId, installmentOptions }: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const isSingleInstallment = installmentOptions.length === 1;

  const form = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      cardNumber: '',
      cardName: '',
      expiryDate: '',
      cvc: '',
      chosenInstallment: isSingleInstallment ? installmentOptions[0] : undefined
    },
    mode: 'onTouched'
  });

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatExpiryDate = (value: string) => {
    let cleanValue = value.replace(/[^0-9]/g, '');
    if (cleanValue.length > 2) {
      cleanValue = cleanValue.substring(0, 2) + ' / ' + cleanValue.substring(2, 4);
    }
    return cleanValue;
  }
  
  const createCustomerFromPayment = async (paymentData: Payment) => {
      if (paymentData.customerId) return; // Already linked to a customer

      try {
          const customerRef = await addDoc(collection(db, "customers"), {
              name: paymentData.customerName,
              phone: "",
              address: "",
              taxOffice: "",
              taxNumber: "",
              createdAt: serverTimestamp()
          });
          
          const paymentRef = doc(db, "payments", paymentId);
          await updateDoc(paymentRef, {
              customerId: customerRef.id
          });
          console.log(`New customer created with ID: ${customerRef.id} and linked to payment.`);
      } catch (error) {
          console.error("Error auto-creating customer: ", error);
          // We don't show a toast here to not confuse the user who just paid successfully.
      }
  };

  async function onSubmit(values: z.infer<typeof paymentFormSchema>) {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const isError = Math.random() > 0.8;
    if (isError) {
        toast({
            variant: "destructive",
            title: "Ödeme Başarısız",
            description: "Lütfen kart bilgilerinizi kontrol edip tekrar deneyin.",
        })
    } else {
        try {
            const paymentRef = doc(db, "payments", paymentId);
            await updateDoc(paymentRef, {
                status: "Ödendi",
                paidAt: serverTimestamp(),
                payerName: values.cardName,
                cardLast4: values.cardNumber.slice(-4),
                chosenInstallment: values.chosenInstallment,
            });
            setIsSuccess(true);
            
            const paymentSnap = await getDoc(paymentRef);
            if (paymentSnap.exists()) {
                const paymentData = paymentSnap.data() as Payment;
                // Since installments is an array, we must add chosenInstallment to satisfy the type.
                await createCustomerFromPayment({ ...paymentData, chosenInstallment: values.chosenInstallment });
            }

        } catch (error) {
            console.error("Error updating payment status: ", error);
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Ödeme durumu güncellenirken bir sorun oluştu.",
            })
        }
    }

    setIsLoading(false);
  }

  if (isSuccess) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-success/10 dark:bg-success/20 rounded-lg min-h-[300px]">
            <CheckCircle className="w-16 h-16 text-success mb-4"/>
            <h3 className="text-xl font-bold text-success">Ödeme Başarılı!</h3>
            <p className="text-muted-foreground mt-2">Ödemeniz başarıyla alındı. Teşekkür ederiz.</p>
        </div>
    )
  }

  return (
    <div>
        <Separator className="my-4" />
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {!isSingleInstallment && (
              <FormField
                control={form.control}
                name="chosenInstallment"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Taksit Seçenekleri</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {installmentOptions.map((option) => (
                          <Button
                            key={option}
                            type="button"
                            variant={field.value === option ? 'accent' : 'outline'}
                            onClick={() => field.onChange(option)}
                            className="h-12 text-base justify-center"
                          >
                            {option === 1 ? 'Tek Çekim' : `${option} Taksit`}
                          </Button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
            control={form.control}
            name="cardName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Kart Üzerindeki İsim</FormLabel>
                <FormControl>
                    <Input placeholder="AD SOYAD" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="cardNumber"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Kart Numarası</FormLabel>
                <FormControl>
                    <Input placeholder="0000 0000 0000 0000" {...field} onChange={(e) => field.onChange(formatCardNumber(e.target.value))} maxLength={19}/>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Son K. T.</FormLabel>
                    <FormControl>
                        <Input placeholder="AA / YY" {...field} onChange={(e) => field.onChange(formatExpiryDate(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="cvc"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>CVC</FormLabel>
                    <FormControl>
                        <Input placeholder="123" {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <Button type="submit" variant="accent" className="w-full mt-6 !h-12 text-base" disabled={isLoading || !form.formState.isValid}>
                {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                    <CreditCard className="mr-2 h-5 w-5" />
                )}
                Ödemeyi Tamamla
            </Button>
        </form>
        </Form>
    </div>
  );
}
