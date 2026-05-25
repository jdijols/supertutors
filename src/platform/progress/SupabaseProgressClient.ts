import { supabase } from "@/lib/supabase";
import type {
  Attempt,
  MasteryEntry,
  MasteryStatus,
  ProgressHandle,
  RecordAttemptInput,
  SaveTrainingSampleInput,
  SessionOutcome,
} from "./types";

/**
 * Supabase-backed ProgressHandle — production implementation.
 *
 * Thin CRUD against the U2 schema. Mastery updates are in
 * application code (trigger-based rollup is deferred to v2).
 */
export class SupabaseProgressClient implements ProgressHandle {
  constructor(private userId: string) {}

  async startSession(lessonSlug: string): Promise<string> {
    const { data, error } = await supabase
      .from("lesson_sessions")
      .insert({
        user_id: this.userId,
        lesson_slug: lessonSlug,
        outcome: "in_progress",
      })
      .select("id")
      .single();

    if (error) throw new Error(`startSession: ${error.message}`);
    return data.id;
  }

  async endSession(sessionId: string, outcome: SessionOutcome): Promise<void> {
    const { error } = await supabase
      .from("lesson_sessions")
      .update({
        ended_at: new Date().toISOString(),
        outcome,
      })
      .eq("id", sessionId)
      .eq("user_id", this.userId)
      // Idempotent: only update if not already ended
      .is("ended_at", null);

    if (error) throw new Error(`endSession: ${error.message}`);
  }

  async recordAttempt(input: RecordAttemptInput): Promise<void> {
    // 1. Insert attempt
    const { error: attemptError } = await supabase.from("attempts").insert({
      user_id: this.userId,
      session_id: input.sessionId,
      item_id: input.itemId,
      result: input.result,
      hint_fired: input.hintFired ?? false,
      reference_video_shown: input.referenceVideoShown ?? false,
    });

    if (attemptError) throw new Error(`recordAttempt: ${attemptError.message}`);

    // 2. Upsert mastery (application-code rollup)
    const { data: existing } = await supabase
      .from("mastery")
      .select("pass_count, fail_count")
      .eq("user_id", this.userId)
      .eq("item_id", input.itemId)
      .maybeSingle();

    const passCount =
      (existing?.pass_count ?? 0) + (input.result === "pass" ? 1 : 0);
    const failCount =
      (existing?.fail_count ?? 0) + (input.result === "fail" ? 1 : 0);

    let status: MasteryStatus;
    if (input.result === "skip") {
      status = "needs_practice";
    } else if (passCount >= 3) {
      status = "mastered";
    } else if (passCount > 0 || failCount > 0) {
      status = "practicing";
    } else {
      status = "not_started";
    }

    const { error: masteryError } = await supabase.from("mastery").upsert(
      {
        user_id: this.userId,
        item_id: input.itemId,
        status,
        pass_count: passCount,
        fail_count: failCount,
        last_practiced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,item_id" }
    );

    if (masteryError)
      throw new Error(`recordAttempt mastery: ${masteryError.message}`);
  }

  async getMastery(lessonSlug: string): Promise<MasteryEntry[]> {
    // Join mastery with items to filter by lesson_slug
    const { data, error } = await supabase
      .from("mastery")
      .select("user_id, item_id, status, pass_count, fail_count, last_practiced_at, items!inner(lesson_slug)")
      .eq("user_id", this.userId)
      .eq("items.lesson_slug", lessonSlug);

    if (error) throw new Error(`getMastery: ${error.message}`);

    return (data ?? []).map((row) => ({
      userId: row.user_id,
      itemId: row.item_id,
      status: row.status as MasteryStatus,
      passCount: row.pass_count,
      failCount: row.fail_count,
      lastPracticedAt: row.last_practiced_at,
    }));
  }

  async getRecentActivity(limit: number): Promise<Attempt[]> {
    const { data, error } = await supabase
      .from("attempts")
      .select("*")
      .eq("user_id", this.userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`getRecentActivity: ${error.message}`);

    return (data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      sessionId: row.session_id,
      itemId: row.item_id,
      result: row.result,
      hintFired: row.hint_fired,
      referenceVideoShown: row.reference_video_shown,
      createdAt: row.created_at,
    }));
  }

  /**
   * Persist a user-submitted landmark sample for future retraining batches.
   * RLS gates the write to the authenticated user's own rows.
   */
  async saveTrainingSample(input: SaveTrainingSampleInput): Promise<void> {
    const { error } = await supabase.from("training_samples").insert({
      user_id: this.userId,
      item_id: input.itemId,
      predicted_item_id: input.predictedItemId ?? null,
      landmarks: input.landmarks,
      source: input.source ?? "user-correction",
    });
    if (error) throw new Error(`saveTrainingSample: ${error.message}`);
  }
}
