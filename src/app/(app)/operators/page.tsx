import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function OperatorsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Operadoras</CardTitle>
        <CardDescription>Administra las operadoras disponibles en el sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Operadoras en el sistema</p>
      </CardContent>
    </Card>
  )
}
