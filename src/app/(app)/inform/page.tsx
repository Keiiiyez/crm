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
        <CardTitle className="font-headline">Informes</CardTitle>
        <CardDescription>Administra los informes disponibles en el sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Informes en el sistema</p>
      </CardContent>
    </Card>
  )
}
