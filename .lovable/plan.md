## Ziel

Eine Musik-Streaming-Plattform, auf der nur verifizierte Artists Musik hochladen können. User können hören, liken, folgen und Playlists erstellen. Artists sehen Stats in einem eigenen Dashboard. Admins prüfen Verifizierungsanträge über ein Admin-Dashboard.

## Rollen & Badges

- **User**: Hören, Liken, Folgen, Playlists erstellen
- **Artist (verifiziert)**: Alles + Musik hochladen, Artist-Dashboard mit Stats, blaues Verified-Badge
- **Admin**: Verifizierungen prüfen, Content moderieren, spezielles Admin-Badge

Rollen werden in separater `user_roles`-Tabelle mit Enum (`user`, `artist`, `admin`) gespeichert (Security-Best-Practice: keine Rollen auf Profiles).

## Verifizierungs-Flow

1. Eingeloggter User öffnet "Artist werden"
2. Wählt eine von zwei Methoden:
   - **Demo-Track einreichen** (Audio-Upload + Artistname + Beschreibung)
   - **Portfolio-Links** (Spotify, SoundCloud, YouTube, Website – mehrere URLs möglich)
3. Antrag geht in Status `pending` → landet im Admin-Dashboard
4. Admin sieht alle Anträge, kann Audio abspielen / Links öffnen, dann **approve** oder **reject** (mit optionaler Begründung)
5. Bei Approve → User bekommt Rolle `artist` + Verified-Badge, kann uploaden

## Features

### Für alle
- Auth (Email/Passwort + Google) via Lovable Cloud
- Startseite mit Trending Tracks, neuen Releases, empfohlenen Artists
- Track-Player (persistenter Bottom-Player mit Play/Pause/Next/Prev/Seek/Volume)
- Suche (Tracks, Artists, Alben, Playlists)
- Like Tracks & Alben, Follow Artists
- Playlists erstellen, Tracks hinzufügen/entfernen, öffentlich/privat
- Artist-Profil-Seite: Bio, Follower-Count, Top-Tracks, Alben/EPs, Verified-Badge

### Artist-Dashboard (nur verifizierte Artists)
- Upload: Single, EP oder Album (Cover + Metadata + mehrere Tracks)
- Übersicht: alle eigenen Releases, bearbeiten/löschen
- Stats: Plays gesamt, Plays pro Track, Likes, Follower-Wachstum (Chart), Top-Länder (falls machbar später)
- Payout-Platzhalter (später)

### Admin-Dashboard (nur Admins)
- Tab **Verifizierungsanträge**: pending / approved / rejected, Audio abspielen, Links öffnen, approve/reject
- Tab **Artists**: alle Artists, Verifizierung entziehen
- Tab **Content**: alle Tracks/Alben, löschen/melden bearbeiten
- Tab **User**: User-Liste, Rollen zuweisen (weiterer Admin ernennen), sperren
- Basis-Stats: Anzahl User, Artists, Tracks, Plays

## Design

Modernes, dunkles Musik-Streaming-Interface (Spotify/Apple-Music-inspiriert, aber eigener Look):
- Dunkle Basis, ein kräftiger Akzent (z.B. Elektrisches Lila/Magenta – bestätigst du bei Bedarf)
- Persistenter Bottom-Player, Sidebar-Navigation
- Verified-Badge = Blau mit Häkchen, Admin-Badge = Gold/Rot mit Schild

## Technische Details

**Backend**: Lovable Cloud (Auth, DB, Storage, Server Functions)

**Storage Buckets**:
- `audio` (privat, signierte URLs zum Abspielen)
- `covers` (öffentlich, Album-/Track-Cover)
- `avatars` (öffentlich)
- `verification-demos` (privat, für eingereichte Demo-Tracks)

**Datenbank-Tabellen** (alle mit RLS + GRANTs):
- `profiles` (id → auth.users, display_name, bio, avatar_url, is_artist_name)
- `user_roles` (user_id, role enum: user/artist/admin) + `has_role()` SECURITY DEFINER Funktion
- `artist_profiles` (user_id, artist_name, verified_at, monthly_listeners)
- `verification_requests` (user_id, method: demo|portfolio, demo_url, portfolio_links jsonb, artist_name, description, status: pending|approved|rejected, admin_notes, reviewed_by, reviewed_at)
- `releases` (id, artist_id, type: single|ep|album, title, cover_url, released_at)
- `tracks` (id, release_id, artist_id, title, audio_path, duration_seconds, track_number, play_count)
- `likes` (user_id, track_id) unique
- `follows` (follower_id, artist_id) unique
- `playlists` (id, owner_id, title, is_public, cover_url)
- `playlist_tracks` (playlist_id, track_id, position)
- `plays` (track_id, user_id nullable, played_at) – für Stats

**Server Functions** (createServerFn, keine Edge Functions):
- `submitVerification`, `reviewVerification` (admin-only)
- `uploadTrack` / `createRelease` (artist-only, prüft Rolle)
- `getSignedAudioUrl` (für privaten Audio-Bucket)
- `recordPlay` (Play-Count-Increment)
- `assignRole` (admin-only)

**Routing** (TanStack Router):
- `/` Home, `/search`, `/artist/$id`, `/album/$id`, `/playlist/$id`, `/library`
- `/auth`, `/become-artist`
- `/_authenticated/dashboard/*` (Artist-Dashboard, nur Rolle artist/admin)
- `/_authenticated/admin/*` (nur Rolle admin)

**Erster Admin**: Wird per Migration gesetzt – du bekommst nach dem ersten Signup Anweisungen, wie du deinen Account zum Admin machst (oder ich seed initial über Migration deine Email, falls du sie nennst).

## Umfang – Phase 1 (dieser Auftrag)

Alles oben genannte als funktionierendes MVP. Musik-Streaming aus Storage funktioniert, Verifizierungs-Flow komplett, Artist- und Admin-Dashboards mit Kernfunktionen. Charts/Stats mit echten Daten, aber schlicht.

## Bestätigungsfragen

1. Farbschema: **Dark + elektrisches Lila** okay oder lieber andere Akzentfarbe (Grün, Orange, Cyan)?
2. Google-Login zusätzlich zu Email/Passwort aktivieren?
3. Soll ich beim initialen Setup deine Email direkt als ersten Admin seeden? Wenn ja: welche Email?

Wenn du einfach "los" sagst, nehme ich: **Dark + Lila, Email+Google, ersten Admin machst du selbst nach Signup über Anleitung.**
