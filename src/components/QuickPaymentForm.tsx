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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bolt, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from '@/firebase/init';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from './ui/separator';

const formSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Tutar pozitif bir sayı olmalıdır.' }).min(1, 'Tutar en az 1 TL olmalıdır.'),
  bank: z.string({ required_error: "Lütfen bir banka seçin." }),
  cardName: z.string().min(2, "Kart üzerindeki adı girin."),
  cardNumber: z.string()
    .min(19, "Geçerli bir kart numarası girin (16 hane).")
    .max(19, "Geçerli bir kart numarası girin (16 hane)."),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\s?\/\s?\d{2}$/, "Geçerli bir son kullanma tarihi girin (AA / YY)."),
  cvc: z.string().min(3, "CVC 3 veya 4 haneli olmalıdır.").max(4),
  installment: z.coerce.number().min(1, { message: "Lütfen bir taksit seçeneği belirleyin." }),
});

const banks = [
  "Türkiye İş Bankası",
  "Akbank",
  "Garanti BBVA",
  "Şekerbank",
  "QNB Finansbank",
  "Vakıfbank"
];

const installmentOptions = Array.from({ length: 6 }, (_, i) => i + 1).map(i => ({
    id: i,
    label: i === 1 ? 'Tek Çekim' : `${i} Taksit`
}));

export function QuickPaymentForm() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      installment: 1,
      amount: undefined,
      bank: undefined,
      cardName: '',
      cardNumber: '',
      expiryDate: '',
      cvc: '',
    },
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
        const paymentData = {
            customerName: values.cardName,
            amount: values.amount,
            installments: [values.installment],
            chosenInstallment: values.installment,
            status: 'Ödendi' as const,
            createdAt: serverTimestamp(),
            paidAt: serverTimestamp(),
            bank: values.bank,
            payerName: values.cardName,
            cardLast4: values.cardNumber.slice(-4),
        };
      
        await addDoc(collection(db, "payments"), paymentData);
        await new Promise(resolve => setTimeout(resolve, 1500));

        toast({
            title: "Demo Ödeme Başarılı",
            description: `₺${values.amount.toFixed(2)} tutarındaki ödeme başarıyla simüle edildi.`,
            variant: "success" as const,
        });

        form.reset({
            installment: 1,
            amount: undefined,
            bank: undefined,
            cardName: '',
            cardNumber: '',
            expiryDate: '',
            cvc: '',
        });

    } catch (error: any) {
        console.error("Error creating demo payment: ", error);
        toast({
            variant: "destructive",
            title: "Demo Ödeme Hatası",
            description: "Demo ödeme oluşturulurken bir sorun oluştu.",
        });
    } finally {
        setLoading(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Sanal POS Ekranı</CardTitle>
        <CardDescription>
          Bu ekranı kullanarak anlık olarak demo ödeme alabilirsiniz.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Ödeme Tutarı (TL)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" placeholder="Örn: 250.50" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            
            <FormField
              control={form.control}
              name="bank"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banka Seçimi</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Ödeme alınacak Sanal POS bankasını seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {banks.map(bank => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />
            <h3 className="text-lg font-medium">Kart Bilgileri</h3>
            
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


            <FormField
              control={form.control}
              name="installment"
              render={({ field }) => (
                 <FormItem className="space-y-3">
                    <FormLabel>Taksit Seçeneği</FormLabel>
                    <FormDescription>
                       Müşterinin yapacağı taksit sayısını seçin.
                    </FormDescription>
                    <FormControl>
                        <RadioGroup
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={String(field.value)}
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2"
                        >
                        {installmentOptions.map((item) => (
                            <FormItem key={item.id} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                                <RadioGroupItem value={String(item.id)} />
                            </FormControl>
                            <FormLabel className="font-normal">
                                {item.label}
                            </FormLabel>
                            </FormItem>
                        ))}
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Bolt className="mr-2 h-4 w-4" />
              )}
              {loading ? "İşleniyor..." : "Ödeme Al"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
