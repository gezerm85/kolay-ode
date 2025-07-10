"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/firebase/init"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion"
import { Landmark, Save, Loader2, TestTubeDiagonal } from "lucide-react"
import { testIsbankConnection } from "@/actions/isbank-test"

const bankSettingsSchema = z.object({
  // Akbank
  akbank_merchantId: z.string().optional(),
  akbank_terminalNo: z.string().optional(),
  akbank_posnetId: z.string().optional(),
  akbank_storeKey: z.string().optional(),

  // Garanti
  garanti_merchantId: z.string().optional(),
  garanti_terminalId: z.string().optional(),
  garanti_provUserId: z.string().optional(),
  garanti_password: z.string().optional(),
  
  // İş Bankası
  isbank_clientId: z.string().optional(),
  isbank_storeKey: z.string().optional(),
  isbank_username: z.string().optional(),
  isbank_password: z.string().optional(),

  // Diğer Bankalar (Şimdilik generic)
  sekerbank_apiKey: z.string().optional(),
  sekerbank_secret: z.string().optional(),
  qnb_apiKey: z.string().optional(),
  qnb_secret: z.string().optional(),
  vakifbank_apiKey: z.string().optional(),
  vakifbank_secret: z.string().optional(),
})

type BankSettingsFormValues = z.infer<typeof bankSettingsSchema>

export function BankSettingsForm() {
  const form = useForm<BankSettingsFormValues>({
    resolver: zodResolver(bankSettingsSchema),
    defaultValues: {},
  })

  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
        try {
            const docRef = doc(db, "settings", "bankApi");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                form.reset(docSnap.data() as BankSettingsFormValues);
            }
        } catch (error) {
            console.error("Error fetching bank settings:", error);
            toast({
                variant: "destructive",
                title: "Ayarlar Yüklenemedi",
                description: "Banka ayarları yüklenirken bir hata oluştu.",
            });
        }
    };

    fetchSettings();
  }, [form]);

  async function onSubmit(data: BankSettingsFormValues) {
    try {
        const docRef = doc(db, "settings", "bankApi");
        await setDoc(docRef, data, { merge: true });
        toast({
            title: "Ayarlar Kaydedildi",
            description: "Banka API ayarlarınız başarıyla güncellendi.",
        })
    } catch (error) {
        console.error("Error saving bank settings:", error);
        toast({
            variant: "destructive",
            title: "Hata",
            description: "Ayarlar kaydedilirken bir sorun oluştu.",
        });
    }
  }

  const handleTestIsbank = async () => {
    setIsTesting(true);
    const result = await testIsbankConnection();
    setIsTesting(false);
    if (result.success) {
        toast({
            variant: "success",
            title: "Bağlantı Başarılı!",
            description: result.message,
        });
    } else {
        toast({
            variant: "destructive",
            title: "Bağlantı Başarısız",
            description: result.message,
        });
    }
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>Sanal POS Ayarları</CardTitle>
            <CardDescription>Banka sanal POS entegrasyonları için gerekli bilgileri buraya girin.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Accordion type="single" collapsible className="w-full" defaultValue="akbank">
                    <AccordionItem value="akbank">
                        <AccordionTrigger><div className="flex items-center gap-2"><Landmark className="h-4 w-4" />Akbank</div></AccordionTrigger>
                        <AccordionContent>
                           <div className="space-y-4 p-2">
                                <FormField control={form.control} name="akbank_merchantId" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Üye İşyeri Numarası (MID)</FormLabel>
                                        <FormControl><Input placeholder="Akbank tarafından sağlanan MID" {...field} value={field.value ?? ''} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                 <FormField control={form.control} name="akbank_terminalNo" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Terminal Numarası (TID)</FormLabel>
                                        <FormControl><Input placeholder="Akbank tarafından sağlanan TID" {...field} value={field.value ?? ''} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="akbank_posnetId" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Posnet ID</FormLabel>
                                        <FormControl><Input placeholder="Akbank tarafından sağlanan Posnet ID" {...field} value={field.value ?? ''} /></FormControl>
                                        <FormDescription>Ortak Ödeme Sayfası için zorunlu alandır.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="akbank_storeKey" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Güvenlik Anahtarı (Store Key)</FormLabel>
                                        <FormControl><Input type="password" placeholder="******************" {...field} value={field.value ?? ''} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                           </div>
                        </AccordionContent>
                    </AccordionItem>

                     <AccordionItem value="garanti">
                        <AccordionTrigger><div className="flex items-center gap-2"><Landmark className="h-4 w-4" />Garanti BBVA</div></AccordionTrigger>
                        <AccordionContent>
                           <div className="space-y-4 p-2">
                               <FormField control={form.control} name="garanti_merchantId" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Üye İşyeri Numarası</FormLabel>
                                        <FormControl><Input placeholder="Garanti tarafından sağlanan numara" {...field} value={field.value ?? ''} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="garanti_terminalId" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Terminal ID</FormLabel>
                                        <FormControl><Input placeholder="Garanti tarafından sağlanan Terminal ID" {...field} value={field.value ?? ''} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                 <FormField control={form.control} name="garanti_provUserId" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Terminal Kullanıcı ID (Prov User ID)</FormLabel>
                                        <FormControl><Input placeholder="Genellikle 'PROVAUT'" {...field} value={field.value ?? ''} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="garanti_password" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Terminal Şifresi</FormLabel>
                                        <FormControl><Input type="password" placeholder="******************" {...field} value={field.value ?? ''} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                           </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="isbank">
                        <AccordionTrigger><div className="flex items-center gap-2"><Landmark className="h-4 w-4" />Türkiye İş Bankası</div></AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4 p-2">
                                <FormField control={form.control} name="isbank_clientId" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mağaza Numarası (Client ID)</FormLabel>
                                        <FormControl><Input placeholder="İş Bankası tarafından sağlanan numara" {...field} value={field.value ?? ''} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="isbank_storeKey" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mağaza Anahtarı (Store Key)</FormLabel>
                                        <FormControl><Input type="password" placeholder="******************" {...field} value={field.value ?? ''} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                 <FormField control={form.control} name="isbank_username" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>API Kullanıcı Adı</FormLabel>
                                        <FormControl><Input placeholder="İş Bankası tarafından sağlanan kullanıcı adı" {...field} value={field.value ?? ''} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="isbank_password" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>API Şifresi</FormLabel>
                                        <FormControl><Input type="password" placeholder="******************" {...field} value={field.value ?? ''} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <Button type="button" variant="outline" onClick={handleTestIsbank} disabled={isTesting}>
                                    {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <TestTubeDiagonal className="mr-2 h-4 w-4"/>}
                                    Bağlantıyı Test Et
                                </Button>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <div className="pt-4 flex justify-end">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        <Save className="mr-2 h-4 w-4"/>
                        Tüm Ayarları Kaydet
                    </Button>
                </div>
            </form>
            </Form>
        </CardContent>
    </Card>
  )
}
