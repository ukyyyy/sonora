import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const trackSchema = z.object({
  title: z.string().trim().min(1).max(200),
  audio_path: z.string().min(1).max(500),
  duration_seconds: z.number().int().min(0).max(60 * 60 * 4).default(0),
  is_explicit: z.boolean().optional().default(false),
});

const createReleaseSchema = z.object({
  type: z.enum(["single", "ep", "album"]),
  title: z.string().trim().min(1).max(200),
  cover_url: z.string().max(500).optional().nullable(),
  tracks: z.array(trackSchema).min(1).max(50),
});

export const createRelease = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createReleaseSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "artist").maybeSingle();
    if (!roleRow) throw new Error("Nur verifizierte Artists können hochladen.");

    const { data: release, error: relErr } = await supabase
      .from("releases")
      .insert({
        artist_id: userId,
        type: data.type,
        title: data.title,
        cover_url: data.cover_url ?? null,
      })
      .select()
      .single();
    if (relErr || !release) throw new Error(relErr?.message || "Release-Fehler");

    const tracksToInsert = data.tracks.map((t, i) => ({
      release_id: release.id,
      artist_id: userId,
      title: t.title,
      audio_path: t.audio_path,
      duration_seconds: t.duration_seconds,
      track_number: i + 1,
      is_explicit: t.is_explicit ?? false,
    }));
    const { error: tErr } = await supabase.from("tracks").insert(tracksToInsert);
    if (tErr) throw new Error(tErr.message);

    return { ok: true, release_id: release.id };
  });

export const getSignedAudioUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ path: z.string().min(1).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: signed, error } = await supabase.storage.from("audio").createSignedUrl(data.path, 3600);
    if (error || !signed) throw new Error(error?.message || "Signed URL Fehler");
    return { url: signed.signedUrl };
  });

export const deleteRelease = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("releases").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
