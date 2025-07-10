'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/firebase/init';
import { CreatePaymentLink } from "@/components/CreatePaymentLink";
import { PaymentsDashboard } from "@/components/PaymentsDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CreditCard, Clock, CheckCircle } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import type { Payment } from '@/types/payment';

const StatCard = ({ title, value, icon: Icon, description }: { title: string, value: string, icon: React.ElementType, description: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-xl font-bold sm:text-2xl">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const StatCardSkeleton = () => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-40" />
        </CardContent>
    </Card>
);

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    successfulTransactions: 0,
    createdLinks: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "payments"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        let totalRevenue = 0;
        let successfulTransactions = 0;
        let pendingPayments = 0;
        const createdLinks = querySnapshot.size;

        querySnapshot.forEach((doc) => {
            const payment = doc.data() as Payment;
            if (payment.status === 'Ödendi') {
                totalRevenue += payment.amount;
                successfulTransactions += 1;
            } else if (payment.status === 'Bekliyor') {
                pendingPayments += 1;
            }
        });

        setStats({
            totalRevenue,
            successfulTransactions,
            createdLinks,
            pendingPayments,
        });
        setLoading(false);
    }, (error) => {
        console.error("Error fetching stats: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col gap-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Giriş Sayfası</h1>
        
        <CreatePaymentLink />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {loading ? <StatCardSkeleton /> : <StatCard title="Toplam Ciro" value={`₺${stats.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} description="Başarılı işlemlerden gelir" />}
            {loading ? <StatCardSkeleton /> : <StatCard title="Başarılı İşlemler" value={`${stats.successfulTransactions}`} icon={CheckCircle} description="Tamamlanan ödeme sayısı" />}
            {loading ? <StatCardSkeleton /> : <StatCard title="Oluşturulan Link" value={`${stats.createdLinks}`} icon={CreditCard} description="Toplam ödeme linki sayısı" />}
            {loading ? <StatCardSkeleton /> : <StatCard title="Bekleyen Ödeme" value={`${stats.pendingPayments}`} icon={Clock} description="Ödeme bekleyen link sayısı" />}
        </div>
        
        <PaymentsDashboard />
    </div>
  );
}
