import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      display_name: z.string().trim().min(1).max(80),
      bio: z.string().trim().max(500).nullable().optional(),
      avatar_url: z.string().max(500).nullable().optional(),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("profiles").update({
      display_name: data.display_name,
      bio: data.bio ?? null,
      avatar_url: data.avatar_url ?? null,
      updated_at: new Date().toISOString(),
    }).eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateArtistProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      artist_name: z.string().trim().min(1).max(80),
      banner_url: z.string().max(500).nullable().optional(),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("artist_profiles").update({
      artist_name: data.artist_name,
      banner_url: data.banner_url ?? null,
    }).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateRelease = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      title: z.string().trim().min(1).max(200),
      cover_url: z.string().max(500).nullable().optional(),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("releases").update({
      title: data.title,
      cover_url: data.cover_url ?? null,
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateTrack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      title: z.string().trim().min(1).max(200),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("tracks").update({ title: data.title }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTrack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("tracks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const exportUserData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [profile, artist, roles, likes, follows, playlists, playlistTracks, releases, tracks, verifications] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("artist_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_roles").select("*").eq("user_id", userId),
      supabase.from("likes").select("*").eq("user_id", userId),
      supabase.from("follows").select("*").eq("follower_id", userId),
      supabase.from("playlists").select("*").eq("owner_id", userId),
      supabase.from("playlist_tracks").select("*, playlists!inner(owner_id)").eq("playlists.owner_id", userId),
      supabase.from("releases").select("*").eq("artist_id", userId),
      supabase.from("tracks").select("*").eq("artist_id", userId),
      supabase.from("verification_requests").select("*").eq("user_id", userId),
    ]);
    return {
      exported_at: new Date().toISOString(),
      user_id: userId,
      profile: profile.data,
      artist_profile: artist.data,
      roles: roles.data,
      likes: likes.data,
      follows: follows.data,
      playlists: playlists.data,
      playlist_tracks: playlistTracks.data,
      releases: releases.data,
      tracks: tracks.data,
      verification_requests: verifications.data,
    };
  });

export const updatePassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ new_password: z.string().min(8).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, { password: data.new_password });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ confirm: z.literal("LÖSCHEN") }).parse(d))
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Best-effort: Cancel any active Stripe subscriptions
    try {
      const { data: subs } = await supabaseAdmin.from("subscriptions").select("stripe_subscription_id, environment, status").eq("user_id", userId).in("status", ["active", "trialing", "past_due"]);
      if (subs?.length) {
        const { createStripeClient } = await import("@/lib/stripe.server");
        for (const s of subs) {
          try {
            const stripe = createStripeClient(s.environment as "sandbox" | "live");
            await stripe.subscriptions.cancel(s.stripe_subscription_id);
          } catch { /* ignore per-sub cancel errors */ }
        }
      }
    } catch { /* ignore */ }

    await supabaseAdmin.from("playlist_tracks").delete().in("playlist_id",
      ((await supabaseAdmin.from("playlists").select("id").eq("owner_id", userId)).data ?? []).map((p) => p.id)
    );
    await Promise.all([
      supabaseAdmin.from("likes").delete().eq("user_id", userId),
      supabaseAdmin.from("follows").delete().eq("follower_id", userId),
      supabaseAdmin.from("follows").delete().eq("artist_id", userId),
      supabaseAdmin.from("playlists").delete().eq("owner_id", userId),
      supabaseAdmin.from("tracks").delete().eq("artist_id", userId),
      supabaseAdmin.from("releases").delete().eq("artist_id", userId),
      supabaseAdmin.from("verification_requests").delete().eq("user_id", userId),
      supabaseAdmin.from("artist_profiles").delete().eq("user_id", userId),
      supabaseAdmin.from("subscriptions").delete().eq("user_id", userId),
      supabaseAdmin.from("blocks").delete().eq("blocker_id", userId),
      supabaseAdmin.from("blocks").delete().eq("blocked_id", userId),
      supabaseAdmin.from("reports").delete().eq("reporter_id", userId),
      supabaseAdmin.from("user_roles").delete().eq("user_id", userId),
      supabaseAdmin.from("profiles").delete().eq("id", userId),
    ]);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
