import { BankSettingsForm } from "@/components/BankSettingsForm";

export default function BankSettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Banka Ayarları</h1>
      <div className="max-w-4xl w-full">
          <BankSettingsForm />
      </div>
    </div>
  );
}
