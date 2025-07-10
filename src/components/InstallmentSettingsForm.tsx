"use client"

import { useEffect } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Save } from "lucide-react"

const installmentOptions = [
  { id: 1, label: 'Tek Çekim' },
  { id: 2, label: '2 Taksit' },
  { id: 3, label: '3 Taksit' },
  { id: 4, label: '4 Taksit' },
  { id: 5, label: '5 Taksit' },
  { id: 6, label: '6 Taksit' },
  { id: 7, label: '7 Taksit' },
  { id: 8, label: '8 Taksit' },
  { id: 9, label: '9 Taksit' },
  { id: 10, label: '10 Taksit' },
  { id: 11, label: '11 Taksit' },
  { id: 12, label: '12 Taksit' },
] as const;

const FormSchema = z.object({
  options: z.array(z.number()).refine((value) => value.length > 0, {
    message: "En az bir taksit seçeneği belirlemelisiniz.",
  }),
})

export function InstallmentSettingsForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      options: [1, 2, 3, 4, 5, 6],
    },
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "installments");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.options) {
             form.reset({ options: data.options });
          }
        }
      } catch (error) {
        console.error("Error fetching installment settings:", error);
        toast({
          variant: "destructive",
          title: "Ayarlar Yüklenemedi",
          description: "Taksit ayarları yüklenirken bir hata oluştu.",
        });
      }
    };

    fetchSettings();
  }, [form]);

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      const docRef = doc(db, "settings", "installments");
      const sortedData = { options: data.options.sort((a, b) => a - b) };
      await setDoc(docRef, sortedData);
      toast({
        title: "Ayarlar Kaydedildi",
        description: "Taksit seçenekleriniz başarıyla güncellendi.",
      });
    } catch (error) {
      console.error("Error saving installment settings:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Ayarlar kaydedilirken bir sorun oluştu.",
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Taksit Seçenekleri</CardTitle>
        <CardDescription>
          Ödeme linki oluştururken sunulacak taksit seçeneklerini belirleyin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="options"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Aktif Taksitler</FormLabel>
                    <FormDescription>
                      Müşterilerinize sunmak istediğiniz taksit sayılarını seçin. "Tek Çekim" zorunludur.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {installmentOptions.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="options"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.id)}
                                  disabled={item.id === 1}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, item.id])
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
            <Button type="submit" disabled={form.formState.isSubmitting}>
                <Save className="mr-2 h-4 w-4"/>
                Ayarları Kaydet
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
