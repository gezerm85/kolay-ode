"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { doc, setDoc, serverTimestamp, getDoc, addDoc, collection } from "firebase/firestore"
import { db } from "@/firebase/init"
import { Customer } from "@/types/customer"
import { Loader2, Save } from "lucide-react"

const customerFormSchema = z.object({
  name: z.string().min(3, { message: "Müşteri adı en az 3 karakter olmalıdır." }),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxOffice: z.string().optional(),
  taxNumber: z.string().optional(),
})

type CustomerFormValues = z.infer<typeof customerFormSchema>

interface CustomerFormProps {
  customer?: Customer | null
  onSuccess: () => void
}

export function CustomerForm({ customer, onSuccess }: CustomerFormProps) {
  const { toast } = useToast()
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: customer?.name || "",
      phone: customer?.phone || "",
      address: customer?.address || "",
      taxOffice: customer?.taxOffice || "",
      taxNumber: customer?.taxNumber || "",
    },
  })

  async function onSubmit(data: CustomerFormValues) {
    try {
      const isEditing = !!customer;
      const docRef = isEditing ? doc(db, "customers", customer.id) : doc(collection(db, "customers"));

      await setDoc(docRef, {
        ...data,
        createdAt: isEditing ? customer.createdAt : serverTimestamp(),
      }, { merge: true });

      toast({
        title: isEditing ? "Müşteri Güncellendi" : "Müşteri Oluşturuldu",
        description: `Müşteri bilgileri başarıyla ${isEditing ? 'güncellendi' : 'kaydedildi'}.`,
      });
      onSuccess();
    } catch (error) {
      console.error("Error saving customer:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Müşteri bilgileri kaydedilirken bir sorun oluştu.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ad Soyad</FormLabel>
              <FormControl>
                <Input placeholder="Ad Soyad" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefon Numarası</FormLabel>
              <FormControl>
                <Input placeholder="05XX XXX XX XX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adres</FormLabel>
              <FormControl>
                <Textarea placeholder="Müşteri adresi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="taxOffice"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Vergi Dairesi</FormLabel>
                <FormControl>
                    <Input placeholder="Vergi Dairesi" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="taxNumber"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Vergi Numarası</FormLabel>
                <FormControl>
                    <Input placeholder="Vergi veya TC Kimlik No" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {customer ? "Değişiklikleri Kaydet" : "Müşteri Oluştur"}
        </Button>
      </form>
    </Form>
  )
}
