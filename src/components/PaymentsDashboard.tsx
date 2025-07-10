"use client"

import { useState, useEffect, useMemo } from "react"
import type { DateRange } from "react-day-picker"
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore"
import { db } from "@/firebase/init"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowUpRight } from "lucide-react"
import Link from 'next/link'
import { Button } from "./ui/button"
import { Skeleton } from "./ui/skeleton"
import { DateRangePicker } from "./ui/date-range-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import type { Payment, PaymentStatus } from "@/types/payment"
import { PaymentDetailsDialog } from "./PaymentDetailsDialog"
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs"
import { subDays, subMonths, isSameDay } from "date-fns"

const banks = [
  "Türkiye İş Bankası",
  "Akbank",
  "Garanti BBVA",
  "Şekerbank",
  "QNB Finansbank",
  "Vakıfbank"
];

const PaymentRowSkeleton = () => (
    <TableRow>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
        <TableCell className="text-center"><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
        <TableCell className="text-center"><Skeleton className="h-6 w-20 mx-auto" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
    </TableRow>
)

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

export function PaymentsDashboard({ showFilters = false }: { showFilters?: boolean }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<DateRange | undefined>(undefined)
  const [bank, setBank] = useState<string>("all")
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    const q = query(collection(db, "payments"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const paymentsData: Payment[] = [];
      querySnapshot.forEach((doc) => {
        paymentsData.push({ id: doc.id, ...doc.data() } as Payment);
      });
      setPayments(paymentsData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching payments: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
        if (bank !== 'all' && payment.bank !== bank) {
            return false;
        }

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
  }, [payments, date, bank]);

  const handleRowClick = (payment: Payment) => {
    setSelectedPayment(payment);
  };
  
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
  }

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
  }

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


  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <CardTitle>Son İşlemler</CardTitle>
                <CardDescription>
                Gerçekleşen ve bekleyen tüm ödemelerin listesi.
                </CardDescription>
            </div>
            {showFilters && (
                <div className="flex flex-col items-stretch gap-4 w-full sm:w-auto sm:items-end">
                     <Tabs value={activeTab} onValueChange={handleQuickFilterChange} className="w-full sm:w-auto">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="all">Tümü</TabsTrigger>
                            <TabsTrigger value="today">Bugün</TabsTrigger>
                            <TabsTrigger value="lastWeek">Son Hafta</TabsTrigger>
                            <TabsTrigger value="lastMonth">Son Ay</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                        <Select value={bank} onValueChange={setBank}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Banka Seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Bankalar</SelectItem>
                                {banks.map((b) => (
                                    <SelectItem key={b} value={b}>
                                        {b}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <DateRangePicker date={date} onDateChange={handleDateChange} />
                    </div>
                </div>
            )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Müşteri</TableHead>
                <TableHead className="hidden sm:table-cell">Tarih</TableHead>
                <TableHead className="hidden md:table-cell">Banka</TableHead>
                <TableHead className="text-center">Taksit</TableHead>
                <TableHead className="text-center">Durum</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead className="text-right">Link</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                   Array.from({ length: 5 }).map((_, i) => <PaymentRowSkeleton key={i} />)
                ) : filteredPayments.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                            {payments.length > 0 ? "Filtreyle eşleşen ödeme bulunamadı." : "Henüz ödeme kaydı bulunmuyor."}
                        </TableCell>
                    </TableRow>
                ) : (
                    filteredPayments.map((payment) => (
                    <TableRow key={payment.id} onClick={() => handleRowClick(payment)} className="cursor-pointer">
                        <TableCell className="font-medium">{payment.customerName}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                            {payment.createdAt?.toDate().toLocaleDateString('tr-TR')}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{payment.bank}</TableCell>
                        <TableCell className="text-center">{renderInstallmentCell(payment)}</TableCell>
                        <TableCell className="text-center">
                            {renderStatusBadge(payment.status)}
                        </TableCell>
                        <TableCell className="text-right font-medium">{payment.amount.toFixed(2)} TL</TableCell>
                        <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon">
                            <Link href={`/pay/${payment.id}`} target="_blank" aria-label="Ödeme linkini aç" onClick={(e) => e.stopPropagation()}>
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
    {selectedPayment && (
        <PaymentDetailsDialog
          payment={selectedPayment}
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
    )}
    </>
  )
}
