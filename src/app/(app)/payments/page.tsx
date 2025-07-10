import { PaymentsDashboard } from "@/components/PaymentsDashboard";

export default function PaymentsPage() {
    return (
         <div className="flex flex-col gap-8">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Ödemeler</h1>
            <PaymentsDashboard showFilters />
        </div>
    )
}
