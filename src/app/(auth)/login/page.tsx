"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/firebase/init"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/Logo"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/dashboard")
    } catch (error: any) {
      console.error(error)
      if (error.code && (error.code === 'auth/invalid-api-key' || error.code === 'auth/api-key-not-valid')) {
        toast({
            variant: "destructive",
            title: "Firebase Yapılandırma Hatası",
            description: "Firebase API anahtarı geçersiz. Lütfen proje ayarlarınızı kontrol edin.",
        })
      } else if (error.code === 'auth/invalid-credential') {
        toast({
            variant: "destructive",
            title: "Giriş Başarısız",
            description: "E-posta veya şifre hatalı. Lütfen tekrar deneyin.",
        })
      }
      else {
        toast({
            variant: "destructive",
            title: "Giriş Başarısız",
            description: "E-posta veya şifre hatalı. Lütfen tekrar deneyin.",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl text-center">Yönetici Girişi</CardTitle>
          <CardDescription>
            Devam etmek için e-posta ve şifrenizi girin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Şifre</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Giriş Yap
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
