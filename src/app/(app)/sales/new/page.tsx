import { SalesForm } from "@/components/sales/sales-form"

export default function NewSalePage() {
  return (
    <div>
        <div className="mb-6">
            <h1 className="text-3xl font-bold font-headline tracking-tight">Nueva venta</h1>
            <p className="text-muted-foreground">Completa el formulario a continuación para registrar una nueva venta.</p>
        </div>
        <SalesForm />
    </div>
  )
}
