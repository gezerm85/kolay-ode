'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Link as LinkIcon, Copy, Loader2, Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from '@/firebase/init';
import type { Customer } from '@/types/customer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';


const formSchema = z.object({
  customer: z.object({
    id: z.string().optional(),
    name: z.string().min(3, { message: 'Müşteri adı en az 3 karakter olmalıdır.' }),
  }),
  amount: z.coerce.number().positive({ message: 'Tutar pozitif bir sayı olmalıdır.' }).min(1, 'Tutar en az 1 TL olmalıdır.'),
  installments: z.array(z.number()).refine((value) => value.length > 0, {
    message: 'En az bir taksit seçeneği belirlemelisiniz.',
  }),
  bank: z.string({ required_error: "Lütfen bir banka seçin."}),
});

const banks = [
  "Türkiye İş Bankası",
  "Akbank",
  "Garanti BBVA",
  "Şekerbank",
  "QNB Finansbank",
  "Vakıfbank"
];

export function CreatePaymentLink() {
  const [generatedLink, setGeneratedLink] = useState<{url: string; customerName: string; customerPhone?: string | null} | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [comboboxSearch, setComboboxSearch] = useState('');
  const [availableInstallments, setAvailableInstallments] = useState<{ id: number; label: string }[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer: { id: '', name: ''},
      installments: [],
      amount: undefined,
      bank: undefined,
    },
  });

  useEffect(() => {
    const fetchPrerequisites = async () => {
        // Fetch customers
        const customerQuery = query(collection(db, "customers"), orderBy("name"));
        const customersSnapshot = await getDocs(customerQuery);
        const customersData = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
        setCustomers(customersData);

        // Fetch installment options
        try {
            const settingsRef = doc(db, "settings", "installments");
            const settingsSnap = await getDoc(settingsRef);
            let options = [1, 2, 3, 4, 5, 6]; // Default options
            if (settingsSnap.exists() && Array.isArray(settingsSnap.data().options) && settingsSnap.data().options.length > 0) {
                options = settingsSnap.data().options;
            }
            const formattedOptions = options.map(i => ({ id: i, label: i === 1 ? 'Tek Çekim' : `${i} Taksit` }));
            setAvailableInstallments(formattedOptions);

        } catch (error) {
            console.error("Could not fetch installment options, using defaults.", error);
        } finally {
            setLoadingSettings(false);
        }
    };
    fetchPrerequisites();
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!comboboxSearch) return customers;
    return customers.filter(c => c.name.toLowerCase().includes(comboboxSearch.toLowerCase()));
  }, [customers, comboboxSearch]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setGeneratedLink(null);
    try {
      let customerId = values.customer.id;
      let customerPhone: string | undefined | null = undefined;
      
      if (customerId) {
        customerPhone = customers.find(c => c.id === customerId)?.phone;
      } 
      else {
        const newCustomerRef = await addDoc(collection(db, "customers"), {
          name: values.customer.name,
          phone: "",
          address: "",
          taxOffice: "",
          taxNumber: "",
          createdAt: serverTimestamp(),
        });
        customerId = newCustomerRef.id;
        customerPhone = null;
      }

      const paymentData = {
        customerId: customerId,
        customerName: values.customer.name,
        amount: values.amount,
        installments: values.installments.sort((a,b) => a-b),
        status: 'Bekliyor',
        createdAt: serverTimestamp(),
        bank: values.bank,
      };
      
      const docRef = await addDoc(collection(db, "payments"), paymentData);
      const link = `${window.location.origin}/pay/${docRef.id}`;
      
      setGeneratedLink({
        url: link,
        customerName: values.customer.name,
        customerPhone: customerPhone,
      });

      form.reset({
        customer: { id: '', name: ''},
        installments: [],
        amount: undefined,
        bank: undefined,
      });

      toast({
        title: "Link Oluşturuldu!",
        description: "Yeni ödeme linki başarıyla oluşturuldu.",
      });
    } catch (error) {
        console.error("Error creating payment link: ", error);
        toast({
            variant: "destructive",
            title: "Hata",
            description: "Ödeme linki oluşturulurken bir sorun oluştu.",
        });
    }
  }
  
  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink.url);
      toast({
        title: "Kopyalandı!",
        description: "Ödeme linki panoya kopyalandı.",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Yeni Ödeme Linki Oluştur</CardTitle>
        <CardDescription>
          Müşterinizin ödeme yapabilmesi için bilgileri doldurun.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="customer.name"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Müşteri</FormLabel>
                   <Popover open={openCombobox} onOpenChange={(isOpen) => {
                       setOpenCombobox(isOpen);
                       if (!isOpen) {
                           setComboboxSearch('');
                       }
                   }}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? field.value
                            : "Müşteri seçin veya yeni oluşturun"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                         <CommandInput 
                            placeholder="Müşteri ara..."
                            value={comboboxSearch}
                            onValueChange={setComboboxSearch}
                          />
                        <CommandList>
                            {filteredCustomers.length === 0 && comboboxSearch.length > 0 ? (
                                <CommandItem
                                    key="create-new"
                                    value={comboboxSearch}
                                    onSelect={() => {
                                        field.onChange(comboboxSearch);
                                        form.setValue('customer.id', undefined);
                                        setOpenCombobox(false);
                                        setComboboxSearch('');
                                    }}
                                >
                                   <PlusCircle className="mr-2 h-4 w-4" /> Oluştur: "{comboboxSearch}"
                                </CommandItem>
                            ) : <CommandEmpty>Müşteri bulunamadı.</CommandEmpty>}

                            <CommandGroup>
                            {filteredCustomers.map((c) => (
                                <CommandItem
                                value={c.name}
                                key={c.id}
                                onSelect={() => {
                                    field.onChange(c.name);
                                    form.setValue("customer.id", c.id)
                                    setOpenCombobox(false)
                                    setComboboxSearch('');
                                }}
                                >
                                <Check
                                    className={cn(
                                    "mr-2 h-4 w-4",
                                    form.getValues('customer.id') === c.id ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {c.name}
                                </CommandItem>
                            ))}
                            </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                        <SelectValue placeholder="Sanal POS için bir banka seçin" />
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

            <FormField
              control={form.control}
              name="installments"
              render={() => (
                <FormItem>
                   <div>
                     <FormLabel className="text-base">Taksit Seçenekleri</FormLabel>
                     <FormDescription>
                       Müşteriye sunmak istediğiniz taksit seçeneklerini işaretleyin.
                     </FormDescription>
                   </div>
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
                     {availableInstallments.map((item) => (
                       <FormField
                         key={item.id}
                         control={form.control}
                         name="installments"
                         render={({ field }) => {
                           return (
                             <FormItem
                               key={item.id}
                               className="flex flex-row items-start space-x-3 space-y-0"
                             >
                               <FormControl>
                                 <Checkbox
                                   checked={field.value?.includes(item.id)}
                                   onCheckedChange={(checked) => {
                                     return checked
                                       ? field.onChange([...(field.value || []), item.id])
                                       : field.onChange(
                                           field.value?.filter(
                                             (value) => value !== item.id
                                           )
                                         )
                                   }}
                                 />
                               </FormControl>
                               <FormLabel className="font-normal">
                                 {item.label}
                               </FormLabel>
                             </FormItem>
                           )
                         }}
                       />
                     ))}
                   </div>
                   <FormMessage />
                 </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LinkIcon className="mr-2 h-4 w-4" />
              )}
              {form.formState.isSubmitting ? "Oluşturuluyor..." : "Link Oluştur"}
            </Button>
          </form>
        </Form>
        {generatedLink && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-2">Oluşturulan Ödeme Linki:</p>
            <div className="flex items-center gap-2">
                <Input readOnly value={generatedLink.url} className="bg-background" />
                <Button variant="outline" size="icon" onClick={copyToClipboard} aria-label="Lİnki kopyala">
                    <Copy className="h-4 w-4" />
                </Button>
                {generatedLink.customerPhone && (
                    <Button asChild variant="success" size="icon" title="WhatsApp ile Gönder">
                    <a 
                        href={`https://wa.me/${generatedLink.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Merhaba, ${generatedLink.customerName} ödemenizi linkten kolay ve hızlı yapabilirsiniz: ${generatedLink.url}`)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        aria-label="WhatsApp ile gönder"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="h-5 w-5" viewBox="0 0 16 16">
                            <path d="M13.601 2.326A7.854 7.854 0 0 0 8 0C3.58 0 0 3.58 0 8c0 1.432.37 2.783 1.04 3.986l-1.04 3.844 3.958-1.036A7.854 7.854 0 0 0 8 16c4.42 0 8-3.58 8-8a7.854 7.854 0 0 0-2.399-5.674zM8 14.516A6.516 6.516 0 0 1 3.29 13.18l-.226-.135-1.635.426.436-1.6l-.145-.232A6.516 6.516 0 0 1 1.5 8c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5c0 3.59-2.91 6.5-6.5 6.5zm3.615-4.935c-.195-.098-1.155-.572-1.334-.638-.18-.066-.31-.098-.437.098-.128.195-.504.638-.618.764-.114.125-.227.141-.42.047-.192-.098-.81-.297-1.542-.967-.57-.525-.955-1.17-1.07-1.354-.114-.183-.012-.28.087-.378.088-.087.195-.223.294-.33.1-.104.13-.182.195-.308.065-.125.033-.238-.016-.33-.05-.098-.437-1.054-.6-1.436-.164-.38-.328-.328-.455-.332-.114-.004-.246-.004-.377-.004a.723.723 0 0 0-.525.246c-.18.195-.693.677-.693 1.625 0 .947.71 1.875.81 2.01.1.132 1.38 2.113 3.35 2.95.462.198.82.315 1.103.402.472.152.89.125 1.22.077.368-.055 1.155-.473 1.32-0.918.165-.444.165-.82.115-.918-.05-.098-.18-.149-.375-.246z"/>
                        </svg>
                    </a>
                    </Button>
                )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
