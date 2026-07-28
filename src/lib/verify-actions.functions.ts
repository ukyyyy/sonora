import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const submitSchema = z.object({
  artist_name: z.string().trim().min(1).max(80),
  method: z.enum(["demo", "portfolio"]),
  demo_path: z.string().max(500).optional().nullable(),
  portfolio_links: z.array(z.string().url().max(500)).max(10).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});

export const submitVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => submitSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("verification_requests")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "pending")
      .maybeSingle();
    if (existing) throw new Error("Du hast bereits einen offenen Antrag.");

    const { error } = await supabase.from("verification_requests").insert({
      user_id: userId,
      artist_name: data.artist_name,
      method: data.method,
      demo_path: data.demo_path ?? null,
      portfolio_links: data.portfolio_links ?? null,
      description: data.description ?? null,
      status: "pending",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const reviewSchema = z.object({
  request_id: z.string().uuid(),
  approve: z.boolean(),
  admin_notes: z.string().max(2000).optional().nullable(),
});

export const reviewVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => reviewSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: adminRow } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!adminRow) throw new Error("Forbidden");

    const { data: req, error: reqErr } = await supabase
      .from("verification_requests")
      .select("*")
      .eq("id", data.request_id)
      .single();
    if (reqErr || !req) throw new Error("Antrag nicht gefunden.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.approve) {
      // grant artist role
      await supabaseAdmin.from("user_roles").upsert({ user_id: req.user_id, role: "artist" }, { onConflict: "user_id,role" });
      // create artist_profile
      await supabaseAdmin.from("artist_profiles").upsert({
        user_id: req.user_id,
        artist_name: req.artist_name,
      }, { onConflict: "user_id" });
    }

    const { error: upErr } = await supabaseAdmin.from("verification_requests").update({
      status: data.approve ? "approved" : "rejected",
      admin_notes: data.admin_notes ?? null,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    }).eq("id", data.request_id);
    if (upErr) throw new Error(upErr.message);

    return { ok: true };
  });

const assignRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["user", "artist", "admin"]),
  action: z.enum(["grant", "revoke"]),
});

export const assignRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => assignRoleSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: adminRow } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!adminRow) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.action === "grant") {
      const { error } = await supabaseAdmin.from("user_roles").upsert({ user_id: data.user_id, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id).eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
