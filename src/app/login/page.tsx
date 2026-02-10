"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, LogIn, AlertCircle, ShieldCheck, Mail, Lock } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const router = useRouter()
  const { user, login } = useAuth()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await login(email, password)
    } catch (err: any) {
      setError(err.message || "Credenciales incorrectas")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-6">
      
      {/* Decoración de fondo (Efecto de luces) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      <Card className="w-full max-w-[420px] bg-white/5 backdrop-blur-xl border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2.5rem] overflow-hidden relative">
        <CardHeader className="pt-10 pb-6 px-8 space-y-4 text-center">
          <div className="flex justify-center relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 rotate-3 transition-transform hover:rotate-0 duration-500">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-bold tracking-tighter text-white uppercase">
              IVHAES <span className="text-cyan-500">CRM</span>
            </CardTitle>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">
              Central de Operaciones
            </p>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-10">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <Alert className="bg-rose-500/10 border-rose-500/20 text-rose-400 rounded-2xl animate-in fade-in zoom-in duration-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs font-bold uppercase tracking-wider italic">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2 group">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Usuario
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-cyan-500 transition-colors" />
                  <Input
                    type="username"
                    placeholder="ej: coordinador32"
                    className="h-13 pl-12 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:bg-white/10 focus:ring-cyan-500/20 transition-all border-none shadow-inner"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-cyan-500 transition-colors" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="h-13 pl-12 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:bg-white/10 focus:ring-cyan-500/20 transition-all border-none shadow-inner"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-cyan-900/20 transition-all active:scale-95 disabled:opacity-50 uppercase text-[10px] tracking-[0.2em]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando Acceso...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Entrar al Sistema
                </>
              )}
            </Button>

            <div className="pt-6 mt-4 border-t border-white/5 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-400/5 text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sistema Seguro 256-bit
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Footer / Info */}
      <div className="absolute bottom-8 text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em]">
        © 2026 IVHAES Telecomunicaciones • Todos los derechos reservados
      </div>
    </div>
  )
}