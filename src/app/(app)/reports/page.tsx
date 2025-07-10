'use client'

import { useState, useEffect, useMemo } from 'react'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase/init'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import type { DateRange } from 'react-day-picker'
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format as formatDate } from 'date-fns'
import { tr } from 'date-fns/locale'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, Hash, Banknote, ListOrdered, Percent, TrendingUp, Gem, Trophy } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import type { Payment } from '@/types/payment'


const CHART_COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--muted))"
];

const ChartSkeleton = () => <Skeleton className="h-[350px] w-full" />;

const StatCard = ({ title, value, icon: Icon, description }: { title: string, value: string, icon: React.ElementType, description?: string }) => (
    <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-xl font-bold sm:text-2xl">{value}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
    </div>
);


const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const dataKey = payload[0].dataKey;
    
    return (
      <div className="rounded-lg border bg-background/80 p-2 shadow-sm backdrop-blur-sm">
        <div className="text-sm font-bold text-foreground mb-1">{label}</div>
        {payload.map((p, index) => (
             <div key={index} className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full" style={{backgroundColor: p.color}}></div>
                <span className="text-muted-foreground">{p.name}:</span>
                <span className="font-semibold text-foreground">
                    {p.name === 'count' ? p.value : `₺${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(p.value)}`}
                </span>
             </div>
        ))}
      </div>
    );
  }
  return null;
};


export default function ReportsPage() {
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)
    const [date, setDate] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    })

    useEffect(() => {
        const fetchPayments = async () => {
            setLoading(true)
            const q = query(collection(db, "payments"), where("status", "==", "Ödendi"));
            const querySnapshot = await getDocs(q);
            const paymentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
            setPayments(paymentsData)
            setLoading(false)
        }
        fetchPayments()
    }, [])
    
    const filteredPayments = useMemo(() => {
        if (!payments.length || !date?.from) return [];
        return payments.filter(p => {
            const paymentDate = p.createdAt.toDate();
            const fromDate = date.from!;
            const toDate = date.to || fromDate; 
            const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate(), 0, 0, 0);
            const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59);
            return paymentDate >= start && paymentDate <= end;
        });
    }, [payments, date]);

    const reportData = useMemo(() => {
        const totalRevenue = filteredPayments.reduce((acc, p) => acc + p.amount, 0)
        const transactionCount = filteredPayments.length
        const averageTransaction = transactionCount > 0 ? totalRevenue / transactionCount : 0
        const highestTransaction = filteredPayments.reduce((max, p) => p.amount > max ? p.amount : max, 0)
        
        const bankRevenue = filteredPayments.reduce((acc, p) => {
            acc[p.bank] = (acc[p.bank] || 0) + p.amount;
            return acc
        }, {} as Record<string, number>)
        const bankChartData = Object.entries(bankRevenue).map(([name, total]) => ({ name, 'Tutar': total })).sort((a, b) => b.Tutar - a.Tutar);
        const mostActiveBank = bankChartData[0]?.name || "N/A";

        const dailyRevenue = filteredPayments.reduce((acc, p) => {
            const dateStr = formatDate(p.createdAt.toDate(), 'dd MMM', { locale: tr });
            acc[dateStr] = (acc[dateStr] || 0) + p.amount;
            return acc;
        }, {} as Record<string, number>);
        const revenueTimelineData = Object.entries(dailyRevenue).map(([date, total]) => ({ date, 'Ciro': total })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const installmentCounts = filteredPayments
            .filter(p => p.chosenInstallment !== undefined)
            .reduce((acc, p) => {
                const key = p.chosenInstallment === 1 ? 'Tek Çekim' : `${p.chosenInstallment} Taksit`;
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

        const installmentChartData = Object.entries(installmentCounts).map(([name, count]) => ({ name, count })).sort((a,b) => (a.name > b.name ? 1 : -1));

        return {
            totalRevenue,
            transactionCount,
            averageTransaction,
            highestTransaction,
            mostActiveBank,
            bankChartData,
            revenueTimelineData,
            installmentChartData
        }
    }, [filteredPayments])

    const handleTabChange = (value: string) => {
        const now = new Date();
        if (value === 'all') {
            const firstPaymentDate = payments.length > 0 ? payments.reduce((earliest, p) => p.createdAt.toDate() < earliest ? p.createdAt.toDate() : earliest, new Date()) : new Date();
            setDate({ from: firstPaymentDate, to: new Date() })
        } else if (value === 'monthly') {
            setDate({ from: startOfMonth(now), to: endOfMonth(now) })
        } else if (value === 'yearly') {
            setDate({ from: startOfYear(now), to: endOfYear(now) })
        }
    }

    const renderEmptyState = () => (
        <div className="flex items-center justify-center h-full text-muted-foreground p-10">
            Bu periyotta veri bulunmuyor.
        </div>
    );

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Finansal Özet</h1>
                <div className="flex flex-col sm:flex-row w-full sm:w-auto items-center gap-4 ml-auto">
                    <Tabs defaultValue="monthly" onValueChange={handleTabChange} className="w-full sm:w-auto">
                        <TabsList>
                            <TabsTrigger value="monthly">Bu Ay</TabsTrigger>
                            <TabsTrigger value="yearly">Bu Yıl</TabsTrigger>
                            <TabsTrigger value="all">Tümü</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="w-full sm:w-auto">
                        <DateRangePicker date={date} onDateChange={setDate} />
                    </div>
                </div>
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle>Dönem Özeti</CardTitle>
                    <CardDescription>Seçili periyoda ait temel performans göstergeleri.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                           {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-x-8 gap-y-8">
                            <StatCard icon={DollarSign} title="Toplam Ciro" value={`₺${reportData.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                            <StatCard icon={Hash} title="İşlem Adedi" value={String(reportData.transactionCount)} />
                            <StatCard icon={Banknote} title="Ort. İşlem Tutarı" value={`₺${reportData.averageTransaction.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                            <StatCard icon={Trophy} title="En Yüksek İşlem" value={`₺${reportData.highestTransaction.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                            <StatCard icon={Gem} title="En Aktif Banka" value={reportData.mostActiveBank} />
                        </div>
                    )}
                </CardContent>
             </Card>

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 flex flex-col gap-8">
                   <Card>
                       <CardHeader>
                            <CardTitle>Ciro Zaman Çizgisi</CardTitle>
                            <CardDescription>Seçili periyottaki günlük ciro performansı.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                            {loading ? <ChartSkeleton /> : reportData.revenueTimelineData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={reportData.revenueTimelineData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5}/>
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                                        <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `₺${new Intl.NumberFormat('tr-TR').format(value)}`} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="Ciro" strokeWidth={2} stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : renderEmptyState()}
                        </CardContent>
                   </Card>
                </div>
                <div className="lg:col-span-1 flex flex-col gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Taksit Kullanımı</CardTitle>
                            <CardDescription>Müşterilerin taksit tercihleri.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                             {loading ? <ChartSkeleton /> : reportData.installmentChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Tooltip content={<CustomTooltip />}/>
                                        <Pie
                                            data={reportData.installmentChartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                                return (
                                                <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-semibold">
                                                    {`${(percent * 100).toFixed(0)}%`}
                                                </text>
                                                );
                                            }}
                                            outerRadius={100}
                                            innerRadius={60}
                                            paddingAngle={5}
                                            fill="#8884d8"
                                            dataKey="count"
                                            nameKey="name"
                                            >
                                            {reportData.installmentChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="hsl(var(--background))" strokeWidth={2}/>
                                            ))}
                                        </Pie>
                                        <Legend iconType='circle' wrapperStyle={{fontSize: "12px"}}/>
                                    </PieChart>
                                </ResponsiveContainer>
                             ) : renderEmptyState()}
                        </CardContent>
                     </Card>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Banka Bazında Ciro Dağılımı</CardTitle>
                    <CardDescription>Seçili periyotta bankalardan yapılan toplam çekim tutarları.</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                    {loading ? <ChartSkeleton /> : reportData.bankChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reportData.bankChartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                                <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(value) => `₺${new Intl.NumberFormat('tr-TR').format(value)}`} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                                <YAxis type="category" dataKey="name" width={120} tickLine={false} axisLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsl(var(--muted))'}} />
                                <Bar dataKey="Tutar" fill="hsl(var(--primary))" name="Toplam Tutar" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : renderEmptyState()}
                </CardContent>
            </Card>
        </div>
    )
}
