'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/init';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, User, MapPin, Phone, FileText, ArrowUpRight, DollarSign, Clock, Hash } from 'lucide-react';
import { Customer } from '@/types/customer';
import { Payment, PaymentStatus } from '@/types/payment';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { subDays, subMonths, isSameDay } from 'date-fns';

const DetailRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) => (
  <div className="flex items-start gap-3">
    <Icon className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
    <div className="flex flex-col">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-base text-foreground">{value || 'N/A'}</span>
    </div>
  </div>
);

const StatCard = ({ title, value, icon: Icon, description }: { title: string, value: string, icon: React.ElementType, description: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const renderStatusBadge = (status: PaymentStatus) => {
    switch (status) {
        case 'Ödendi':
            return <Badge variant="success">{status}</Badge>;
        case 'Bekliyor':
            return <Badge variant="warning">{status}</Badge>;
        case 'İade Edildi':
            return <Badge variant="secondary">{status}</Badge>;
        default:
            return <Badge>{status}</Badge>;
    }
};

const renderInstallmentCell = (payment: Payment) => {
    if (payment.chosenInstallment) {
        return payment.chosenInstallment === 1 ? 'Tek Çekim' : `${payment.chosenInstallment}`;
    }
    if (Array.isArray(payment.installments)) {
        return `${payment.installments.length} seçenek`;
    }
    // Fallback for old data where installments is a number
    const val = payment.installments as unknown as number;
    return val === 1 ? 'Tek Çekim' : `${val}`;
};

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    const customerId = params.id;
    if (!customerId) {
      setError('Müşteri ID bulunamadı.');
      setLoading(false);
      return;
    }

    const fetchCustomerAndPayments = async () => {
      setLoading(true);
      try {
        const customerRef = doc(db, 'customers', customerId);
        const customerSnap = await getDoc(customerRef);

        if (!customerSnap.exists()) {
          setError('Müşteri bulunamadı.');
          setLoading(false);
          return;
        }
        setCustomer({ id: customerSnap.id, ...customerSnap.data() } as Customer);

        const paymentsQuery = query(
          collection(db, 'payments'),
          where('customerId', '==', customerId),
          orderBy('createdAt', 'desc')
        );
        const paymentsSnapshot = await getDocs(paymentsQuery);
        const paymentsData = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
        setPayments(paymentsData);
      } catch (err) {
        console.error(err);
        setError('Müşteri bilgileri alınırken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerAndPayments();
  }, [params.id]);

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
        if (date?.from) {
            const paymentDate = payment.createdAt.toDate();
            const fromDate = date.from;
            const toDate = date.to || fromDate;

            const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate(), 0, 0, 0);
            const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59);

            if (paymentDate < start || paymentDate > end) {
                return false;
            }
        }
        return true;
    });
  }, [payments, date]);

  const stats = useMemo(() => {
    return filteredPayments.reduce((acc, payment) => {
        acc.totalTransactions += 1;
        if(payment.status === 'Ödendi') {
            acc.totalRevenue += payment.amount;
        } else if (payment.status === 'Bekliyor') {
            acc.pendingAmount += payment.amount;
        }
        return acc;
    }, { totalRevenue: 0, pendingAmount: 0, totalTransactions: 0 });
  }, [filteredPayments]);
  
  const handleQuickFilterChange = (value: string) => {
    setActiveTab(value);
    const now = new Date();

    switch (value) {
        case 'today':
            setDate({ from: now, to: now });
            break;
        case 'lastWeek':
            setDate({ from: subDays(now, 6), to: now });
            break;
        case 'lastMonth':
            setDate({ from: subMonths(now, 1), to: now });
            break;
        case 'all':
            setDate(undefined);
            break;
    }
  };

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    if (!newDate?.from) {
        setActiveTab('all');
        return;
    }
    const from = newDate.from;
    const to = newDate.to || from;
    const now = new Date();

    if (isSameDay(from, now) && isSameDay(to, now)) {
        setActiveTab('today');
    } else if (isSameDay(from, subDays(now, 6)) && isSameDay(to, now)) {
        setActiveTab('lastWeek');
    } else if (isSameDay(from, subMonths(now, 1)) && isSameDay(to, now)) {
        setActiveTab('lastMonth');
    } else {
        setActiveTab('custom');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-9 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
                 <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Hata</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!customer) {
    return null;
  }

  const formatCurrency = (amount: number) => `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Müşteri Detayları</h1>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto ml-auto">
            <Tabs value={activeTab} onValueChange={handleQuickFilterChange} className="w-full sm:w-auto">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">Tümü</TabsTrigger>
                    <TabsTrigger value="today">Bugün</TabsTrigger>
                    <TabsTrigger value="lastWeek">Son Hafta</TabsTrigger>
                    <TabsTrigger value="lastMonth">Son Ay</TabsTrigger>
                </TabsList>
            </Tabs>
            <DateRangePicker date={date} onDateChange={handleDateChange} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex flex-col gap-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-6 w-6" /> {customer.name}
                    </CardTitle>
                    <CardDescription>Müşteri Kimlik ve İletişim Bilgileri</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <DetailRow icon={Phone} label="Telefon Numarası" value={customer.phone} />
                    <DetailRow icon={MapPin} label="Adres" value={customer.address} />
                    <DetailRow icon={FileText} label="Vergi Dairesi" value={customer.taxOffice} />
                    <DetailRow icon={FileText} label="Vergi Numarası" value={customer.taxNumber} />
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Dönem Özeti</CardTitle>
                    <CardDescription>Seçili periyoda ait müşteri performansı.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <StatCard title="Toplam Ödeme" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} description="Seçili periyottaki başarılı işlemler." />
                    <StatCard title="Bekleyen Tutar" value={formatCurrency(stats.pendingAmount)} icon={Clock} description="Seçili periyottaki bekleyen ödemeler." />
                    <StatCard title="Toplam İşlem" value={String(stats.totalTransactions)} icon={Hash} description="Seçili periyottaki tüm işlemler." />
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Müşteri İşlem Geçmişi</CardTitle>
              <CardDescription>Seçili periyoda ait tüm ödeme işlemleri.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Tarih</TableHead>
                            <TableHead>Tutar</TableHead>
                            <TableHead className="text-center">Durum</TableHead>
                            <TableHead className="text-center hidden sm:table-cell">Taksit</TableHead>
                            <TableHead className="text-right">Link</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {filteredPayments.length === 0 ? (
                            <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                Bu periyotta işlem bulunmuyor.
                            </TableCell>
                            </TableRow>
                        ) : (
                            filteredPayments.map(payment => (
                            <TableRow key={payment.id}>
                                <TableCell>
                                    {payment.createdAt?.toDate().toLocaleDateString('tr-TR')}
                                </TableCell>
                                <TableCell className="font-medium">₺{payment.amount.toFixed(2)}</TableCell>
                                <TableCell className="text-center">{renderStatusBadge(payment.status)}</TableCell>
                                <TableCell className="text-center hidden sm:table-cell">{renderInstallmentCell(payment)}</TableCell>
                                <TableCell className="text-right">
                                    <Button asChild variant="ghost" size="icon">
                                        <Link href={`/pay/${payment.id}`} target="_blank" aria-label="Ödeme linkini aç">
                                            <ArrowUpRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                            ))
                        )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
