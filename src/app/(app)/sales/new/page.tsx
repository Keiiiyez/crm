import { SalesForm } from "@/components/sales/sales-form"

export default function NewSalePage() {
  return (
    <div>
        <div className="mb-6">
            <h1 className="text-3xl font-bold font-headline tracking-tight">Create New Sale</h1>
            <p className="text-muted-foreground">Fill out the form below to register a new sale.</p>
        </div>
        <SalesForm />
    </div>
  )
}
