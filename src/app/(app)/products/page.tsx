import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function ProductsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Servicios</CardTitle>
        <CardDescription>Administra los servicios de telefonía</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Los servicios estarán acá..</p>
        
      </CardContent>
    </Card>
  )
}
