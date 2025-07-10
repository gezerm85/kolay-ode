'use client';

import { QuickPaymentForm } from "@/components/QuickPaymentForm";

export default function QuickPaymentPage() {
    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Hızlı Ödeme</h1>
                    <p className="text-muted-foreground mt-2">
                        Bu ekran, anlık olarak (telefonla veya yüz yüze) ödeme almak için kullanılır.
                    </p>
                </div>
            </div>
            <QuickPaymentForm />
        </div>
    );
}
