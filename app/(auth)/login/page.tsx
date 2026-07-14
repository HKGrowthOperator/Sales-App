'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/lib/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast({ title: 'Login fehlgeschlagen', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
            <span className="text-white text-2xl font-bold">HK</span>
          </div>
          <h1 className="text-white text-3xl font-bold">Sales Cockpit</h1>
          <p className="text-slate-400 mt-2">Opener · Setter · Closer</p>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Anmelden</CardTitle>
            <CardDescription className="text-slate-400">
              Melde dich mit deinen Zugangsdaten an
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@hk-agentur.de"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>
              <Button type="submit" size="xl" className="w-full bg-blue-600 hover:bg-blue-500" disabled={loading}>
                {loading ? <><Loader2 className="animate-spin" /> Anmelden…</> : 'Anmelden'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
