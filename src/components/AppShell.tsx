import { Link, useRouter } from "@tanstack/react-router";
import { Home, Search, Library, Sparkles, LayoutDashboard, ShieldCheck, LogIn, LogOut, Mic2, Settings, Heart, Command, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { Player } from "@/components/Player";
import { VerifiedBadge, AdminBadge } from "@/components/Badges";
import { Avatar } from "@/components/Avatar";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isArtist, isAdmin, signOut, profile } = useAuth();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sidebar = (
    <>
      <Link to="/" onClick={() => setDrawerOpen(false)} className="mb-5 flex items-center gap-2.5 px-2">
        <div className="w-8 h-8 rounded-xl grid place-items-center ring-chrome shrink-0" style={{ background: "var(--grad-chrome)" }}>
          <Mic2 className="h-4 w-4 text-black" />
        </div>
        <span className="font-display text-2xl tracking-tight">Sonora</span>
      </Link>

      <NavItem to="/" icon={<Home className="h-4 w-4" />} onClick={() => setDrawerOpen(false)}>Home</NavItem>
      <NavItem to="/search" icon={<Search className="h-4 w-4" />} onClick={() => setDrawerOpen(false)}>Suche</NavItem>
      <NavItem to="/library" icon={<Library className="h-4 w-4" />} onClick={() => setDrawerOpen(false)}>Bibliothek</NavItem>
      {user && <NavItem to="/liked" icon={<Heart className="h-4 w-4" />} onClick={() => setDrawerOpen(false)}>Gelikte Tracks</NavItem>}

      <div className="mt-5 mb-1.5 px-2 text-hairline">Artist</div>
      {isArtist ? (
        <NavItem to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} onClick={() => setDrawerOpen(false)}>
          Dashboard <VerifiedBadge className="ml-1" />
        </NavItem>
      ) : (
        <NavItem to="/become-artist" icon={<Sparkles className="h-4 w-4" />} onClick={() => setDrawerOpen(false)}>Artist werden</NavItem>
      )}

      {isAdmin && (
        <>
          <div className="mt-5 mb-1.5 px-2 text-hairline">Admin</div>
          <NavItem to="/admin" icon={<ShieldCheck className="h-4 w-4" />} onClick={() => setDrawerOpen(false)}>
            Admin <AdminBadge className="ml-1" />
          </NavItem>
        </>
      )}

      <button
        onClick={() => { setDrawerOpen(false); window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true })); }}
        className="mt-3 mx-0.5 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground glass ring-chrome transition"
      >
        <Command className="h-3.5 w-3.5" /> Schnellsuche
        <span className="ml-auto tracking-widest">⌘K</span>
      </button>

      <div className="mt-auto pt-4 space-y-1">
        {user ? (
          <>
            <Link to="/settings" onClick={() => setDrawerOpen(false)} className="w-full flex items-center gap-3 p-1.5 rounded-xl hover:bg-white/5 transition">
              <Avatar url={profile?.avatar_url} name={profile?.display_name ?? user.email} size={30} />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{profile?.display_name ?? user.email}</div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1"><Settings className="h-3 w-3" /> Einstellungen</div>
              </div>
            </Link>
            <button
              onClick={async () => { setDrawerOpen(false); await signOut(); router.navigate({ to: "/" }); }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
            >
              <LogOut className="h-4 w-4" /> Abmelden
            </button>
          </>
        ) : (
          <Link to="/auth" onClick={() => setDrawerOpen(false)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ring-chrome" style={{ background: "var(--grad-chrome)", color: "#0a0a0a" }}>
            <LogIn className="h-4 w-4" /> Anmelden
          </Link>
        )}
        <div className="pt-3 mt-2 border-t border-white/5 flex flex-wrap gap-x-3 gap-y-1 px-2 text-[10px] text-muted-foreground">
          <Link to="/premium" onClick={() => setDrawerOpen(false)} className="hover:text-foreground transition inline-flex items-center gap-1">⋄ Premium</Link>
          <Link to="/install" onClick={() => setDrawerOpen(false)} className="hover:text-foreground transition">App laden</Link>
          <Link to="/impressum" onClick={() => setDrawerOpen(false)} className="hover:text-foreground transition">Impressum</Link>
          <Link to="/datenschutz" onClick={() => setDrawerOpen(false)} className="hover:text-foreground transition">Datenschutz</Link>
          <Link to="/agb" onClick={() => setDrawerOpen(false)} className="hover:text-foreground transition">AGB</Link>
          <Link to="/widerruf" onClick={() => setDrawerOpen(false)} className="hover:text-foreground transition">Widerruf</Link>
          <Link to="/report" onClick={() => setDrawerOpen(false)} className="hover:text-foreground transition">Melden</Link>
          <Link to="/dsa" onClick={() => setDrawerOpen(false)} className="hover:text-foreground transition">DSA</Link>
          <Link to="/support" onClick={() => setDrawerOpen(false)} className="hover:text-foreground transition">Support</Link>
          <span className="ml-auto">© Sonora</span>
        </div>

      </div>
    </>
  );

  return (
    <div className="flex flex-col h-[100dvh]" style={{ paddingTop: "env(safe-area-inset-top)", paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}>
      {/* Mobile top bar */}
      <header className="md:hidden shrink-0 px-3 pt-3">
        <div className="h-12 rounded-2xl glass ring-chrome flex items-center px-3 gap-2">
          <button onClick={() => setDrawerOpen(true)} aria-label="Menü" className="h-9 w-9 grid place-items-center rounded-xl hover:bg-white/5">
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-xl tracking-tight">Sonora</span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <Link to="/search" aria-label="Suche" className="h-9 w-9 grid place-items-center rounded-xl hover:bg-white/5"><Search className="h-4 w-4" /></Link>
            {user ? (
              <Link to="/settings" aria-label="Profil"><Avatar url={profile?.avatar_url} name={profile?.display_name ?? user.email} size={30} /></Link>
            ) : (
              <Link to="/auth" className="text-sm px-3 py-1.5 rounded-xl ring-chrome" style={{ background: "var(--grad-chrome)", color: "#0a0a0a" }}>Login</Link>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden gap-3 p-3 pb-0">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-56 shrink-0 rounded-3xl glass ring-chrome px-2.5 py-4 flex-col gap-0.5 overflow-y-auto">
          {sidebar}
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-liquid-in" onClick={() => setDrawerOpen(false)} />
            <aside className="relative w-72 max-w-[85vw] m-3 rounded-3xl glass-strong ring-chrome px-3 py-4 flex flex-col gap-0.5 overflow-y-auto animate-liquid-in">
              <button onClick={() => setDrawerOpen(false)} aria-label="Schließen" className="absolute top-3 right-3 h-8 w-8 grid place-items-center rounded-full hover:bg-white/5">
                <X className="h-4 w-4" />
              </button>
              {sidebar}
            </aside>
          </div>
        )}

        <main className="flex-1 rounded-3xl glass ring-chrome overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 md:px-6 py-6 md:py-8 pb-24 md:pb-8">{children}</div>
        </main>
      </div>

      <Player />

      {/* Mobile bottom nav */}
      <nav className="md:hidden shrink-0 px-3 pb-3" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
        <div className="h-14 rounded-2xl glass-strong ring-chrome grid grid-cols-4 items-center">
          <BottomItem to="/" icon={<Home className="h-5 w-5" />} label="Home" />
          <BottomItem to="/search" icon={<Search className="h-5 w-5" />} label="Suche" />
          <BottomItem to="/library" icon={<Library className="h-5 w-5" />} label="Library" />
          <BottomItem to={user ? "/liked" : "/auth"} icon={<Heart className="h-5 w-5" />} label={user ? "Likes" : "Login"} />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ to, icon, children, onClick }: { to: string; icon: ReactNode; children: ReactNode; onClick?: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-2.5 py-1.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
      activeProps={{ className: "flex items-center gap-3 px-2.5 py-1.5 rounded-xl text-sm text-foreground bg-white/[0.08] ring-chrome" }}
    >
      {icon}
      <span className="flex items-center">{children}</span>
    </Link>
  );
}

function BottomItem({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-0.5 text-[10px] text-muted-foreground"
      activeProps={{ className: "flex flex-col items-center gap-0.5 text-[10px] text-foreground" }}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
