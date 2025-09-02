<div align="center">

# 💳 Kolay Öde - Ödeme Sistemi Platformu

**Next.js, Firebase ve AI ile Geliştirilmiş Modern Ödeme Yönetim Sistemi**

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.9.1-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[🚀 Demo](#-demo) • [📋 Özellikler](#-özellikler) • [🛠️ Teknolojiler](#️-teknolojiler) • [🚀 Kurulum](#-kurulum)

</div>

---

## 📖 Hakkında

**Kolay Öde**, modern web teknolojileri kullanılarak geliştirilmiş kapsamlı bir ödeme yönetim sistemidir. Next.js, Firebase ve AI entegrasyonu ile oluşturulmuş olup, işletmelerin ödeme süreçlerini kolaylaştıran, güvenli ve ölçeklenebilir bir platform sunmaktadır.

### 🎯 Projenin Amacı

- 💳 **Ödeme Yönetimi** - Kapsamlı ödeme süreç yönetimi
- 🏦 **Banka Entegrasyonu** - Akbank, Garanti, İş Bankası entegrasyonları
- 📊 **Dashboard** - Gerçek zamanlı ödeme analitikleri
- 🤖 **AI Desteği** - Google Gemini ile akıllı özellikler
- 🔒 **Güvenlik** - PCI DSS uyumlu güvenli ödeme işlemleri
- 📱 **Responsive** - Tüm cihazlarda uyumlu arayüz

---

## 🚀 Demo

**🔗 [Canlı Demo](https://your-demo-url.com)**

Uygulama şu anda geliştirme aşamasındadır. Demo linki yakında eklenecektir.

---

## 🚀 Kurulum

### Gereksinimler

- **Node.js** (v18 veya üzeri)
- **npm** veya **yarn**
- **Firebase** hesabı
- **Google AI API** anahtarı

### Adım Adım Kurulum

1. **Depoyu klonlayın**
   ```bash
   git clone https://github.com/your-username/kolay-ode.git
   cd kolay-ode
   ```

2. **Bağımlılıkları yükleyin**
   ```bash
   npm install
   # veya
   yarn install
   ```

3. **Environment Variables**
   ```bash
   cp .env.example .env.local
   ```
   
   `.env.local` dosyasını düzenleyin:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   GOOGLE_AI_API_KEY=your_google_ai_api_key
   ```

4. **Firebase yapılandırması**
   - Firebase Console'da proje oluşturun
   - Firestore Database'i etkinleştirin
   - Authentication'ı yapılandırın

5. **Uygulamayı başlatın**
   ```bash
   # Development server
   npm run dev
   
   # AI development server
   npm run genkit:dev
   
   # Production build
   npm run build
   npm start
   ```

### Build Komutları

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type checking
npm run typecheck

# Linting
npm run lint
```

---

## 📋 Geliştirdiğim Özellikler

### 💳 Ödeme Sistemi
- [x] **Çoklu Banka Desteği** - Akbank, Garanti, İş Bankası entegrasyonları
- [x] **Taksit Seçenekleri** - Esnek taksit planları
- [x] **Güvenli Ödeme** - PCI DSS uyumlu güvenlik
- [x] **Ödeme Linkleri** - Paylaşılabilir ödeme linkleri
- [x] **Hızlı Ödeme** - Tek tıkla ödeme işlemleri

### 📊 Dashboard ve Analitik
- [x] **Gerçek Zamanlı Dashboard** - Canlı ödeme istatistikleri
- [x] **Gelir Takibi** - Toplam gelir ve işlem analizi
- [x] **Başarı Oranları** - Ödeme başarı oranları
- [x] **Bekleyen Ödemeler** - Pending ödemeler takibi
- [x] **Raporlama** - Detaylı ödeme raporları

### 👥 Müşteri Yönetimi
- [x] **Müşteri Profilleri** - Detaylı müşteri bilgileri
- [x] **Ödeme Geçmişi** - Müşteri ödeme geçmişi
- [x] **Müşteri Listesi** - Kapsamlı müşteri yönetimi
- [x] **Müşteri Arama** - Hızlı müşteri bulma

### ⚙️ Sistem Yönetimi
- [x] **Banka Ayarları** - API anahtarları ve yapılandırma
- [x] **Taksit Ayarları** - Taksit seçenekleri yönetimi
- [x] **Kullanıcı Yönetimi** - Admin panel ve yetkilendirme
- [x] **Sistem Ayarları** - Genel sistem yapılandırması

### 🤖 AI Entegrasyonu
- [x] **Google Gemini** - AI destekli özellikler
- [x] **Akıllı Analiz** - AI ile ödeme analizi
- [x] **Otomatik Raporlama** - AI destekli rapor oluşturma
- [x] **Genkit Framework** - AI geliştirme ortamı

### 🎨 UI/UX Geliştirmeleri
- [x] **Modern Tasarım** - Shadcn/ui component library
- [x] **Responsive Layout** - Tüm cihazlarda uyumlu
- [x] **Dark/Light Mode** - Tema desteği
- [x] **Smooth Animations** - Tailwind CSS animasyonları
- [x] **Loading States** - Kullanıcı dostu loading

---

## 🛠️ Teknolojiler

### Frontend Framework
- **Next.js** `15.3.3` - React framework with App Router
- **TypeScript** `5.0` - Type-safe JavaScript
- **React** `18.3.1` - UI library
- **React Hook Form** `7.54.2` - Form management

### Backend & Database
- **Firebase** `11.9.1` - Backend-as-a-Service
  - **Firestore** - NoSQL database
  - **Authentication** - User management
  - **Cloud Functions** - Serverless functions

### AI & Machine Learning
- **Google AI** `1.13.0` - AI services
- **Genkit** `1.13.0` - AI development framework
- **Gemini 2.0 Flash** - Large language model

### UI & Styling
- **Tailwind CSS** `3.4.1` - Utility-first CSS
- **Shadcn/ui** - Component library
- **Radix UI** - Headless UI components
- **Lucide React** `0.475.0` - Icon library

### Form & Validation
- **Zod** `3.24.2` - Schema validation
- **Hookform Resolvers** `4.1.3` - Form validation

### Development Tools
- **Turbopack** - Fast bundler
- **ESLint** - Code linting
- **PostCSS** - CSS processing

---

## 📁 Proje Yapısı

```
kolay-ode/
├── src/
│   ├── actions/          # Server actions
│   │   ├── akbank-payment.ts
│   │   ├── garanti-payment.ts
│   │   ├── isbank-payment.ts
│   │   └── isbank-test.ts
│   ├── ai/              # AI entegrasyonu
│   │   ├── dev.ts
│   │   └── genkit.ts
│   ├── app/             # Next.js App Router
│   │   ├── (app)/       # Ana uygulama sayfaları
│   │   │   ├── customers/
│   │   │   ├── dashboard/
│   │   │   ├── payments/
│   │   │   ├── quick-payment/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   ├── (auth)/      # Kimlik doğrulama sayfaları
│   │   │   ├── login/
│   │   │   └── signup/
│   │   └── pay/         # Ödeme sayfaları
│   ├── components/      # React bileşenleri
│   │   ├── ui/          # Shadcn/ui bileşenleri
│   │   ├── BankSettingsForm.tsx
│   │   ├── CreatePaymentLink.tsx
│   │   ├── CustomerForm.tsx
│   │   ├── PaymentForm.tsx
│   │   └── PaymentsDashboard.tsx
│   ├── firebase/        # Firebase yapılandırması
│   │   └── init.ts
│   ├── hooks/           # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── lib/             # Utility fonksiyonları
│   │   └── utils.ts
│   └── types/           # TypeScript type tanımları
│       ├── customer.ts
│       └── payment.ts
├── components.json      # Shadcn/ui yapılandırması
├── next.config.ts       # Next.js yapılandırması
├── tailwind.config.ts   # Tailwind CSS yapılandırması
├── tsconfig.json        # TypeScript yapılandırması
└── package.json         # Proje bağımlılıkları
```

---

## 🔧 Geliştirme

### Geliştirme Komutları

```bash
# Development server
npm run dev

# AI development server
npm run genkit:dev

# AI watch mode
npm run genkit:watch

# Production build
npm run build

# Start production server
npm start

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Firebase Yapılandırması

1. Firebase Console'da proje oluşturun
2. Firestore Database'i etkinleştirin
3. Authentication'ı yapılandırın
4. Environment variables'ları ayarlayın

### AI Geliştirme

```bash
# AI development server başlat
npm run genkit:dev

# AI watch mode
npm run genkit:watch
```

### Banka API Entegrasyonu

```typescript
// Akbank ödeme işlemi
export async function startAkbankPayment(paymentId: string) {
  // Ödeme işlemi mantığı
}

// Garanti ödeme işlemi
export async function startGarantiPayment(paymentId: string) {
  // Ödeme işlemi mantığı
}
```

---

## 🚀 Deployment

### Vercel Deployment
```bash
# Vercel CLI kurulumu
npm install -g vercel

# Deploy
vercel --prod
```

### Firebase Hosting
```bash
# Firebase CLI kurulumu
npm install -g firebase-tools

# Firebase'e giriş
firebase login

# Deploy
firebase deploy
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🤝 Katkıda Bulunma

1. Bu depoyu fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'inizi push edin (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

### Geliştirme Kuralları
- TypeScript kullanın
- ESLint kurallarına uyun
- Responsive tasarım prensiplerini takip edin
- Firebase güvenlik kurallarına uyun
- AI entegrasyonlarını test edin

---

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 👨‍💻 Geliştirici

**Bu projeyi geliştiren: Mehmet Çelebi Gezer**

Bu ödeme sistemi platformu, modern web teknolojileri kullanılarak geliştirilmiştir. Next.js, Firebase ve AI entegrasyonu ile oluşturulmuş olup, güvenli ödeme işlemleri, kapsamlı dashboard ve akıllı özellikler ile profesyonel bir ödeme yönetim deneyimi sunmaktadır.

### 🎯 Proje Detayları
- **Geliştirme Süresi:** [X] hafta/gün
- **Kullanılan Teknolojiler:** Next.js, TypeScript, Firebase, AI, Tailwind CSS
- **Özellikler:** Çoklu banka entegrasyonu, AI destekli analiz, Dashboard, Müşteri yönetimi
- **Platform:** Web (Responsive)

---

## 🙏 Teşekkürler

- [Next.js](https://nextjs.org/) ekibine
- [Firebase](https://firebase.google.com/) ekibine
- [Google AI](https://ai.google.dev/) ekibine
- [Shadcn/ui](https://ui.shadcn.com/) ekibine
- [Tailwind CSS](https://tailwindcss.com/) ekibine
- Tüm açık kaynak katkıda bulunanlara

---

## 📞 İletişim

**Proje Hakkında Sorularınız İçin:**

- 📧 **E-posta:** [gezermcelebi@gmail.com](mailto:gezermcelebi@gmail.com)
- 💼 **LinkedIn:** [Mehmet Çelebi Gezer](https://www.linkedin.com/in/mehmet-%C3%A7elebi-gezer-605a38217/)
- 🐙 **GitHub:** [@gezerm85](https://github.com/gezerm85)
---

<div align="center">

**⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!**

Made with ❤️ by **Mehmet Çelebi Gezer**

*Modern web teknolojileri ve AI ile geliştirilmiş profesyonel ödeme sistemi platformu*

</div>