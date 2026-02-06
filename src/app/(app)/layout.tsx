import { AppHeader } from "@/components/app-header"
import { AppNav } from "@/components/app-nav"
import { Toaster } from "sonner"                    

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {}
      <div className="hidden border-r bg-card md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex-1 py-4">
            <AppNav isMobile={false} />
          </div>
        </div>
      </div>

      {}
      <div className="flex flex-col">
        <AppHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </div>

      {}
      <Toaster richColors closeButton position="top-right"/>
    </div>
  )
}