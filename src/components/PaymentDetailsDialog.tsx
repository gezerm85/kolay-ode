'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/init';
import { Payment, PaymentStatus } from '@/types/payment';
import { Calendar, Clock, User, CreditCard, Landmark, RefreshCw, Loader2, Trash2 } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';

interface PaymentDetailsDialogProps {
  payment: Payment;
  isOpen: boolean;
  onClose: () => void;
}

const DetailRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => (
    <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Icon className="h-4 w-4" />
            <span>{label}</span>
        </div>
        <div className="text-sm font-medium text-right text-wrap">{value}</div>
    </div>
);

const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate();
    return `${date.toLocaleDateString('tr-TR')} ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
};

const renderInstallmentDetail = (payment: Payment) => {
    if (payment.chosenInstallment) {
        return payment.chosenInstallment === 1 ? 'Tek Çekim' : `${payment.chosenInstallment} Taksit`;
    }
    if (Array.isArray(payment.installments)) {
        const options = payment.installments.map(i => i === 1 ? 'Tek Çekim' : `${i} Taksit`).join(', ');
        return `Sunulan: ${options}`;
    }
    // Fallback for old data where installments is a number
    const val = payment.installments as unknown as number;
    return val === 1 ? 'Tek Çekim' : `${val} Taksit`;
};


export function PaymentDetailsDialog({ payment, isOpen, onClose }: PaymentDetailsDialogProps) {
    const { toast } = useToast();
    const [isRefunding, setIsRefunding] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleRefund = async () => {
        setIsRefunding(true);
        try {
            const paymentRef = doc(db, "payments", payment.id);
            await updateDoc(paymentRef, {
                status: "İade Edildi",
                refundedAt: serverTimestamp(),
            });
            toast({
                title: "İade Başarılı",
                description: "Ödeme başarıyla iade edildi.",
            });
            onClose(); // Close dialog on success
        } catch (error) {
            console.error("Error refunding payment:", error);
            toast({
                variant: "destructive",
                title: "İade Başarısız",
                description: "İade işlemi sırasında bir hata oluştu.",
            });
        } finally {
            setIsRefunding(false);
        }
    };
    
    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const paymentRef = doc(db, "payments", payment.id);
            await deleteDoc(paymentRef);
            toast({
                title: "İşlem Silindi",
                description: "Bekleyen ödeme linki başarıyla silindi.",
            });
            onClose();
        } catch (error) {
            console.error("Error deleting payment:", error);
            toast({
                variant: "destructive",
                title: "Silme Başarısız",
                description: "İşlem silinirken bir hata oluştu.",
            });
        } finally {
            setIsDeleting(false);
        }
    };

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
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Ödeme Detayları</DialogTitle>
                    <DialogDescription>
                        İşlem ID: {payment.id}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">₺{payment.amount.toFixed(2)}</span>
                        {renderStatusBadge(payment.status)}
                    </div>

                    <Separator />
                    
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground">Müşteri ve Ödeme Bilgileri</h4>
                        <DetailRow icon={User} label="Müşteri Adı" value={payment.customerName} />
                        <DetailRow icon={Landmark} label="Banka" value={payment.bank} />
                        {payment.status !== 'Bekliyor' && (
                            <>
                                <DetailRow icon={User} label="Ödeyen Kişi" value={payment.payerName || 'N/A'} />
                                <DetailRow icon={CreditCard} label="Kart Numarası" value={payment.cardLast4 ? `**** **** **** ${payment.cardLast4}` : 'N/A'} />
                            </>
                        )}
                        <DetailRow icon={RefreshCw} label="Taksit" value={renderInstallmentDetail(payment)} />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground">Zaman Damgaları</h4>
                        <DetailRow icon={Calendar} label="Link Oluşturma Tarihi" value={formatDate(payment.createdAt)} />
                        <DetailRow icon={Clock} label="Ödeme Tarihi" value={formatDate(payment.paidAt)} />
                        {payment.status === 'İade Edildi' && (
                            <DetailRow icon={Clock} label="İade Tarihi" value={formatDate(payment.refundedAt)} />
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:justify-end">
                    {payment.status === 'Ödendi' && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={isRefunding}>
                                    {isRefunding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                    İade Et
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>İade İşlemini Onayla</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Bu işlemi geri alamazsınız. ₺{payment.amount.toFixed(2)} tutarındaki bu ödemeyi iade etmek istediğinizden emin misiniz?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleRefund} className="bg-destructive hover:bg-destructive/90">
                                        Evet, İade Et
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    {payment.status === 'Bekliyor' && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={isDeleting}>
                                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                    Sil
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>İşlemi Silmeyi Onayla</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Bu işlemi geri alamazsınız. Bu bekleyen ödeme linkini kalıcı olarak silmek istediğinizden emin misiniz?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                        Evet, Sil
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <DialogClose asChild>
                         <Button variant="outline">Kapat</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
