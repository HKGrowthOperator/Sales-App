'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarClock,
  FileText,
  PhoneCall,
  PhoneOutgoing,
  BarChart3,
  Settings,
  Mail,
  Bell,
  Activity,
  Plug,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

const ROLE_LABELS: Record<string, string> = {
  opener: 'Opener',
  setter: 'Setter',
  closer: 'Closer',
  admin: 'Admin',
}

const ROLE_COLORS: Record<string, string> = {
  opener: 'bg-orange-500',
  setter: 'bg-purple-500',
  closer: 'bg-blue-600',
  admin: 'bg-slate-600',
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dial', label: 'Dialer', icon: PhoneOutgoing },
  { href: '/session', label: 'Session', icon: PhoneCall },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/appointments', label: 'Termine', icon: Calendar },
  { href: '/kpi', label: 'KPIs', icon: BarChart3 },
  { href: '/availability', label: 'Verfügbarkeit', icon: CalendarClock },
  { href: '/scripts', label: 'Skripte', icon: FileText },
]

const adminItems = [
  { href: '/admin/team', label: 'Team & Rollen', icon: Users },
  { href: '/admin/scripts', label: 'Skripte & Einwände', icon: FileText },
  { href: '/admin/availability', label: 'Verwalten', icon: Settings },
  { href: '/admin/connections', label: 'Verbindungen', icon: Plug },
  { href: '/admin/mail-previews', label: 'Mails', icon: Mail },
  { href: '/admin/reminders', label: 'Reminder', icon: Bell },
  { href: '/admin/sync', label: 'Sync', icon: Activity },
]

interface NavbarProps {
  profile: Profile
}

export function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isAdmin = profile.role === 'admin'

  // Menüs bei Navigation schließen
  useEffect(() => {
    setAdminOpen(false)
    setMobileOpen(false)
  }, [pathname])

  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  }
  const adminActive = pathname.startsWith('/admin')

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 gap-4">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <span className="text-white text-sm font-bold">HK</span>
        </div>
        <span className="font-semibold text-slate-900 hidden sm:block">Sales Cockpit</span>
      </Link>

      {/* Desktop Nav (ab lg) */}
      <div className="hidden lg:flex items-center gap-1 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive(href)
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Link>
        ))}

        {/* Admin-Dropdown */}
        {isAdmin && (
          <div className="relative">
            <button
              onClick={() => setAdminOpen(o => !o)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                adminActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Settings className="h-4 w-4" />
              <span>Admin</span>
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', adminOpen && 'rotate-180')} />
            </button>
            {adminOpen && (
              <>
                {/* Klick-außerhalb-Fänger */}
                <div className="fixed inset-0 z-40" onClick={() => setAdminOpen(false)} />
                <div className="absolute left-0 top-full mt-1 w-56 rounded-xl border border-slate-200 bg-white shadow-lg py-1.5 z-50">
                  {adminItems.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors',
                        isActive(href)
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Spacer für kleine Screens */}
      <div className="flex-1 lg:hidden" />

      {/* User + Logout + Hamburger */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm text-slate-600 truncate max-w-[160px]">{profile.full_name || profile.email}</span>
          <span className={cn('text-xs text-white px-2 py-0.5 rounded-full font-medium', ROLE_COLORS[profile.role])}>
            {ROLE_LABELS[profile.role]}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          disabled={signingOut}
          title="Abmelden"
        >
          <LogOut className="h-4 w-4 text-slate-500" />
        </Button>
        {/* Hamburger (unter lg) */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen(o => !o)}
          title="Menü"
          aria-label="Menü öffnen"
        >
          {mobileOpen ? <X className="h-5 w-5 text-slate-700" /> : <Menu className="h-5 w-5 text-slate-700" />}
        </Button>
      </div>

      {/* Mobile-Menü (unter lg) */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 top-16 z-30 bg-slate-900/20 lg:hidden" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-40 bg-white border-b border-slate-200 shadow-lg lg:hidden max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="p-2 space-y-0.5">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive(href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-100'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </Link>
              ))}
              {isAdmin && (
                <>
                  <div className="px-3 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Admin</div>
                  {adminItems.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive(href)
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-700 hover:bg-slate-100'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{label}</span>
                    </Link>
                  ))}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  )
}
