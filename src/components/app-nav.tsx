"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  DollarSign,
  Users,
  Package,
  UserCog,
  ChevronRight,
  FileText,
  Briefcase,
  TrendingUp,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"

type AppNavProps = {
  isMobile: boolean
}

const navLinks = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  {
    href: "/sales",
    icon: DollarSign,
    label: "Ventas",
    subLinks: [{ href: "/sales/new", label: "Nueva Venta" }],
  },
  { href: "/clients", icon: Users, label: "Clientes" },
  { href: "/contracts", icon: Briefcase, label: "Contratos" },
  { href: "/products", icon: Package, label: "Servicios" },
  { href: "/audit", icon: AlertCircle, label: "Auditoría" },
  {
    href: "/inform",
    icon: UserCog,
    label: "Informes",
    subLinks: [
      { href: "/inform/promociones", label: "Promociones" },
    ],
  },
]

export function AppNav({ isMobile }: AppNavProps) {
  const pathname = usePathname()

  const renderLink = (link: typeof navLinks[0]) => (
    <Link
      key={link.href}
      href={link.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        pathname.startsWith(link.href) && !link.subLinks && "bg-muted text-primary",
        pathname.startsWith(link.href) && link.subLinks && "text-primary"
      )}
    >
      <link.icon className="h-4 w-4" />
      {link.label}
    </Link>
  )

  return (
    <nav className="grid items-start gap-2 px-2 text-sm font-medium lg:px-4">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-lg font-semibold mb-4"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary"><path d="M2.5 17a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zM21.5 7a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/><path d="M12 22V2M2.5 7.5l9-5.5 9 5.5"/><path d="M2.5 16.5l9 5.5 9-5.5"/></svg>
        <span className="font-headline">CRM IVHAES</span>
      </Link>
      {navLinks.map((link) => (
        <div key={link.label}>
          {renderLink(link)}
          {link.subLinks && pathname.startsWith(link.href) && (
            <div className="grid pl-7 pt-2">
              {link.subLinks.map((subLink) => (
                <Link
                  key={subLink.href}
                  href={subLink.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                     pathname === subLink.href && "bg-muted text-primary"
                  )}
                >
                   <ChevronRight className="h-3 w-3 -ml-1" />
                  {subLink.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  )
}
