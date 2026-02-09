"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { AppNav } from "./app-nav"
import { UserMenu } from "./user-menu"

export function AppHeader() {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menú de navegación</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0">
          <AppNav isMobile={true} />
        </SheetContent>
      </Sheet>

      <div className="w-full flex-1">
        {/* Espacio vacío para logo o título si lo necesitas */}
      </div>

      {/* Menú del usuario actual */}
      <UserMenu />
    </header>
  )
}
