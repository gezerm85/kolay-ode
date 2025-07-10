import { InstallmentSettingsForm } from "@/components/InstallmentSettingsForm";

export default function InstallmentSettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Taksit Ayarları</h1>
      <div className="max-w-4xl w-full">
          <InstallmentSettingsForm />
      </div>
    </div>
  );
}
