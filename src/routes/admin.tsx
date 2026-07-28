import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { reviewVerification, assignRole } from "@/lib/verify-actions.functions";
import { adminDeleteTrack, adminDeleteRelease } from "@/lib/admin-actions.functions";
import { resolveReport } from "@/lib/moderation.functions";
import { toast } from "@/lib/toast";
import { useUI } from "@/lib/ui";
import { AdminBadge, VerifiedBadge } from "@/components/Badges";
import { StorageImg } from "@/components/StorageImg";
import { Check, X, Play, Trash2, Flag } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Sonora" }, { name: "description", content: "Verwalte Verifizierungen, Artists und User." }] }),
  component: Admin,
});

type VR = { id: string; user_id: string; artist_name: string; method: string; demo_path: string | null; portfolio_links: string[] | null; description: string | null; status: string; created_at: string };

function Admin() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const review = useServerFn(reviewVerification);
  const assign = useServerFn(assignRole);
  const [tab, setTab] = useState<"requests" | "reports" | "artists" | "users" | "content">("requests");
  const [requests, setRequests] = useState<VR[]>([]);
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [artists, setArtists] = useState<Array<{ user_id: string; artist_name: string; verified_at: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: string; display_name: string; roles: string[] }>>([]);
  const [totals, setTotals] = useState({ users: 0, artists: 0, tracks: 0, reports: 0 });
  const [content, setContent] = useState<Array<{ id: string; title: string; cover_url: string | null; type: string; artist_id: string; artist_name: string; track_count: number }>>([]);
  const [reports, setReports] = useState<Array<{ id: string; target_type: string; target_id: string; reason: string; details: string | null; status: string; created_at: string; reporter_id: string }>>([]);
  const [reportStatus, setReportStatus] = useState<"open" | "reviewing" | "resolved" | "dismissed">("open");
  const delTrack = useServerFn(adminDeleteTrack);
  const delRelease = useServerFn(adminDeleteRelease);
  const resolveRep = useServerFn(resolveReport);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.navigate({ to: "/" });
  }, [user, loading, isAdmin, router]);

  const loadRequests = async () => {
    const { data } = await supabase.from("verification_requests").select("*").eq("status", statusFilter).order("created_at", { ascending: false });
    setRequests((data ?? []) as VR[]);
  };
  const loadArtists = async () => {
    const { data } = await supabase.from("artist_profiles").select("user_id, artist_name, verified_at").order("verified_at", { ascending: false });
    setArtists(data ?? []);
  };
  const loadUsers = async () => {
    const { data: profs } = await supabase.from("profiles").select("id, display_name").limit(100);
    const { data: rls } = await supabase.from("user_roles").select("user_id, role");
    const roleMap = new Map<string, string[]>();
    (rls ?? []).forEach((r: { user_id: string; role: string }) => {
      const cur = roleMap.get(r.user_id) ?? [];
      cur.push(r.role);
      roleMap.set(r.user_id, cur);
    });
    setUsers((profs ?? []).map((p) => ({ ...p, roles: roleMap.get(p.id) ?? [] })));
  };
  const loadTotals = async () => {
    const [u, a, t, rp] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("artist_profiles").select("*", { count: "exact", head: true }),
      supabase.from("tracks").select("*", { count: "exact", head: true }),
      supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "open"),
    ]);
    setTotals({ users: u.count ?? 0, artists: a.count ?? 0, tracks: t.count ?? 0, reports: rp.count ?? 0 });
  };

  const loadReports = async () => {
    const { data } = await supabase.from("reports").select("*").eq("status", reportStatus).order("created_at", { ascending: false }).limit(100);
    setReports(data ?? []);
  };

  const loadContent = async () => {
    const { data } = await supabase
      .from("releases")
      .select("id, title, cover_url, type, artist_id, artist_profiles!inner(artist_name), tracks(id)")
      .order("released_at", { ascending: false })
      .limit(200);
    setContent(
      (data ?? []).map((r: any) => ({
        id: r.id,
        title: r.title,
        cover_url: r.cover_url,
        type: r.type,
        artist_id: r.artist_id,
        artist_name: r.artist_profiles?.artist_name ?? "—",
        track_count: (r.tracks ?? []).length,
      })),
    );
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadTotals();
    if (tab === "requests") loadRequests();
    if (tab === "artists") loadArtists();
    if (tab === "users") loadUsers();
    if (tab === "content") loadContent();
    if (tab === "reports") loadReports();
  }, [isAdmin, tab, statusFilter, reportStatus]);


  const [demoUrls, setDemoUrls] = useState<Record<string, string>>({});
  const loadDemo = async (r: VR) => {
    if (!r.demo_path) return;
    const { data } = await supabase.storage.from("verification-demos").createSignedUrl(r.demo_path, 3600);
    if (data) setDemoUrls((s) => ({ ...s, [r.id]: data.signedUrl }));
  };

  const { prompt: askPrompt, confirm: askConfirm } = useUI();
  const decide = async (r: VR, approve: boolean) => {
    let notes: string | null = null;
    if (!approve) {
      notes = await askPrompt({ title: "Antrag ablehnen", description: "Grund für die Ablehnung (wird dem Artist gezeigt).", placeholder: "z. B. unzureichende Klangqualität", confirmLabel: "Ablehnen" });
      if (notes === null) return;
    }
    try {
      await review({ data: { request_id: r.id, approve, admin_notes: notes } });
      toast.success(approve ? "Genehmigt" : "Abgelehnt");
      loadRequests();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Fehler"); }
  };

  const toggleRole = async (uid: string, role: "artist" | "admin", has: boolean) => {
    try {
      await assign({ data: { user_id: uid, role, action: has ? "revoke" : "grant" } });
      toast.success("Aktualisiert");
      loadUsers();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Fehler"); }
  };

  if (!user || !isAdmin) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">Admin <AdminBadge className="h-6 w-6" /></h1>
        <p className="text-muted-foreground">Prüfe Anträge und verwalte die Plattform.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card"><div className="text-xs text-muted-foreground">User</div><div className="text-2xl font-bold">{totals.users}</div></div>
        <div className="p-4 rounded-xl bg-card"><div className="text-xs text-muted-foreground">Artists</div><div className="text-2xl font-bold">{totals.artists}</div></div>
        <div className="p-4 rounded-xl bg-card"><div className="text-xs text-muted-foreground">Tracks</div><div className="text-2xl font-bold">{totals.tracks}</div></div>
        <div className="p-4 rounded-xl bg-card"><div className="text-xs text-muted-foreground">Offene Meldungen</div><div className="text-2xl font-bold text-destructive">{totals.reports}</div></div>
      </div>

      <div className="flex gap-2 border-b border-border overflow-x-auto">
        {(["requests", "reports", "content", "artists", "users"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap flex items-center gap-1 ${tab === t ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`}>
            {t === "requests" ? "Verifizierungen" : t === "reports" ? <>Meldungen {totals.reports > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground">{totals.reports}</span>}</> : t === "content" ? "Content" : t === "artists" ? "Artists" : "User"}
          </button>
        ))}
      </div>

      {tab === "requests" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(["pending", "approved", "rejected"] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs capitalize ${statusFilter === s ? "gradient-brand text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {s}
              </button>
            ))}
          </div>
          {requests.map((r) => (
            <div key={r.id} className="p-5 rounded-lg bg-card border border-border space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-lg">{r.artist_name}</div>
                  <div className="text-xs text-muted-foreground">Methode: {r.method} · {new Date(r.created_at).toLocaleDateString("de-DE")}</div>
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => decide(r, true)} className="p-2 rounded gradient-brand text-primary-foreground"><Check className="h-4 w-4" /></button>
                    <button onClick={() => decide(r, false)} className="p-2 rounded bg-destructive text-destructive-foreground"><X className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
              {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
              {r.method === "demo" && r.demo_path && (
                <div>
                  {demoUrls[r.id]
                    ? <audio controls src={demoUrls[r.id]} className="w-full" />
                    : <button onClick={() => loadDemo(r)} className="text-sm flex items-center gap-1 text-primary"><Play className="h-3 w-3" /> Demo laden</button>}
                </div>
              )}
              {r.method === "portfolio" && r.portfolio_links && (
                <ul className="text-sm space-y-1">
                  {r.portfolio_links.map((l, i) => (
                    <li key={i}><a href={l} target="_blank" rel="noreferrer" className="text-primary underline break-all">{l}</a></li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {requests.length === 0 && <div className="text-sm text-muted-foreground">Keine Anträge.</div>}
        </div>
      )}

      {tab === "artists" && (
        <div className="space-y-2">
          {artists.map((a) => (
            <div key={a.user_id} className="flex items-center justify-between p-3 rounded bg-card">
              <div className="flex items-center gap-2 font-medium">{a.artist_name} <VerifiedBadge /></div>
              <div className="text-xs text-muted-foreground">seit {new Date(a.verified_at).toLocaleDateString("de-DE")}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "users" && (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-3 rounded bg-card gap-2">
              <div>
                <div className="font-medium">{u.display_name}</div>
                <div className="text-xs text-muted-foreground flex gap-2 items-center">
                  {u.roles.map((r) => <span key={r} className="px-1.5 py-0.5 rounded bg-muted">{r}</span>)}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleRole(u.id, "artist", u.roles.includes("artist"))} className="text-xs px-2 py-1 rounded border border-border">
                  {u.roles.includes("artist") ? "Artist entziehen" : "Zu Artist machen"}
                </button>
                <button onClick={() => toggleRole(u.id, "admin", u.roles.includes("admin"))} className="text-xs px-2 py-1 rounded border border-border">
                  {u.roles.includes("admin") ? "Admin entziehen" : "Zu Admin machen"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "content" && (
        <div className="space-y-2">
          {content.length === 0 && <div className="text-sm text-muted-foreground">Keine Releases gefunden.</div>}
          {content.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl glass ring-chrome">
              {r.cover_url
                ? <StorageImg src={r.cover_url} alt="" className="h-12 w-12 rounded-lg object-cover ring-chrome" />
                : <div className="h-12 w-12 rounded-lg gradient-brand ring-chrome" />}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{r.title}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {r.artist_name} · {r.type} · {r.track_count} Track{r.track_count === 1 ? "" : "s"}
                </div>
              </div>
              <button
                onClick={async () => {
                  const ok = await askConfirm({
                    title: "Release löschen?",
                    description: `"${r.title}" und alle enthaltenen Tracks werden entfernt. Diese Aktion kann nicht rückgängig gemacht werden.`,
                    confirmLabel: "Löschen",
                    destructive: true,
                  });
                  if (!ok) return;
                  try {
                    await delRelease({ data: { id: r.id } });
                    toast.success("Release gelöscht");
                    loadContent();
                    loadTotals();
                  } catch (e) { toast.error(e instanceof Error ? e.message : "Fehler"); }
                }}
                className="p-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition"
                aria-label="Löschen"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      {tab === "reports" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(["open", "reviewing", "resolved", "dismissed"] as const).map((s) => (
              <button key={s} onClick={() => setReportStatus(s)}
                className={`px-3 py-1 rounded-full text-xs capitalize ${reportStatus === s ? "gradient-brand text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {s}
              </button>
            ))}
          </div>
          {reports.length === 0 && <div className="text-sm text-muted-foreground">Keine Meldungen.</div>}
          {reports.map((r) => (
            <div key={r.id} className="p-4 rounded-xl glass ring-chrome space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium flex items-center gap-2"><Flag className="h-4 w-4 text-destructive" /> {r.reason}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.target_type} · <span className="font-mono">{r.target_id.slice(0, 8)}</span> · {new Date(r.created_at).toLocaleString("de-DE")}
                  </div>
                  {r.details && <p className="text-sm text-muted-foreground mt-1">{r.details}</p>}
                </div>
                {r.status === "open" && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={async () => {
                        try { await resolveRep({ data: { id: r.id, status: "resolved", admin_notes: null } }); toast.success("Erledigt"); loadReports(); loadTotals(); }
                        catch (e) { toast.error(e instanceof Error ? e.message : "Fehler"); }
                      }}
                      className="p-2 rounded gradient-brand text-primary-foreground" aria-label="Erledigt">
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={async () => {
                        try { await resolveRep({ data: { id: r.id, status: "dismissed", admin_notes: null } }); toast.success("Verworfen"); loadReports(); loadTotals(); }
                        catch (e) { toast.error(e instanceof Error ? e.message : "Fehler"); }
                      }}
                      className="p-2 rounded bg-muted" aria-label="Verwerfen">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
