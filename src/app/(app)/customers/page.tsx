import { CustomersList } from "@/components/CustomersList";

export default function CustomersPage() {
    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Müşteriler</h1>
            <CustomersList />
        </div>
    )
}
