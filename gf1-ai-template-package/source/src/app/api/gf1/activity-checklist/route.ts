import { NextResponse } from "next/server";
import { supaServer } from "@/lib/supabase/server";
import { supaAdmin } from "@/lib/supabase/admin";
import { resolveProfileRole } from "@/lib/gf1/auth";
import type { ProfileRole } from "@/lib/gf1/types";

const allowedRoles = new Set<ProfileRole>(["admin", "sales", "sales_manager"]);

async function requireGf1User() {
  const supabase = await supaServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { user: null, role: null };
  const role = await resolveProfileRole(user);
  return { user, role };
}

export async function PATCH(request: Request) {
  const { user, role } = await requireGf1User();
  if (!user) return NextResponse.json({ ok: false, message: "unauthenticated" }, { status: 401 });
  if (!role || !allowedRoles.has(role)) {
    return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const id = typeof payload?.id === "string" ? payload.id.trim() : "";
  const hasCompletion = typeof payload?.is_completed === "boolean";
  const isCompleted = hasCompletion ? Boolean(payload?.is_completed) : null;
  const hasNotes = Object.prototype.hasOwnProperty.call(payload ?? {}, "notes");
  const hasResponseNotesSnake = Object.prototype.hasOwnProperty.call(payload ?? {}, "response_notes");
  const hasResponseNotesCamel = Object.prototype.hasOwnProperty.call(payload ?? {}, "responseNotes");
  const hasResponseNotes = hasResponseNotesSnake || hasResponseNotesCamel;
  const rawResponseNotes = hasResponseNotesSnake ? payload?.response_notes : payload?.responseNotes;

  if (!id || (!hasCompletion && !hasNotes && !hasResponseNotes)) {
    return NextResponse.json(
      { ok: false, message: "Missing follow-up id and update payload" },
      { status: 400 }
    );
  }

  const updates: Record<string, string | null> = {};
  if (hasCompletion && typeof isCompleted === "boolean") {
    updates.follow_up_completed_at = isCompleted ? new Date().toISOString() : null;
    updates.follow_up_completed_by = isCompleted ? user.id : null;
  }
  if (hasNotes) {
    updates.notes = typeof payload?.notes === "string" ? payload.notes.trim() || null : null;
  }
  if (hasResponseNotes) {
    updates.response_notes = typeof rawResponseNotes === "string" ? rawResponseNotes.trim() || null : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, message: "No valid updates provided" }, { status: 400 });
  }

  const admin = supaAdmin();
  const { data, error } = await admin
    .from("opportunity_contact_logs")
    .update(updates)
    .eq("id", id)
    .eq("contacted_by", user.id)
    .select("id, notes, response_notes, follow_up_completed_at, follow_up_completed_by")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ ok: false, message: "Follow-up not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item: data });
}
