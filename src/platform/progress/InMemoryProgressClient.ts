import { computeMasteryStatus, MASTERY_LOOKBACK } from "./mastery";
import type {
  Attempt,
  LessonSession,
  MasteryEntry,
  MasteryStatus,
  ProgressHandle,
  RecordAttemptInput,
  SaveTrainingSampleInput,
  SessionOutcome,
} from "./types";

/**
 * In-memory ProgressHandle — mirrors the Supabase implementation
 * for tests and offline/signed-out usage. Data lives in Maps and
 * is lost on page reload.
 */
export class InMemoryProgressClient implements ProgressHandle {
  private sessions = new Map<string, LessonSession>();
  private attempts: Attempt[] = [];
  private mastery = new Map<string, MasteryEntry>();
  private counter = 0;

  constructor(private userId: string = "test-user") {}

  private nextId(): string {
    return `mem-${++this.counter}`;
  }

  async startSession(lessonSlug: string): Promise<string> {
    const id = this.nextId();
    this.sessions.set(id, {
      id,
      userId: this.userId,
      lessonSlug,
      startedAt: new Date().toISOString(),
      endedAt: null,
      outcome: "in_progress",
    });
    return id;
  }

  async endSession(sessionId: string, outcome: SessionOutcome): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    // Idempotent: if already ended, don't overwrite
    if (session.endedAt) return;
    session.endedAt = new Date().toISOString();
    session.outcome = outcome;
  }

  async recordAttempt(input: RecordAttemptInput): Promise<void> {
    const attempt: Attempt = {
      id: this.nextId(),
      userId: this.userId,
      sessionId: input.sessionId,
      itemId: input.itemId,
      result: input.result,
      hintFired: input.hintFired ?? false,
      referenceVideoShown: input.referenceVideoShown ?? false,
      createdAt: new Date().toISOString(),
    };
    this.attempts.push(attempt);

    const key = `${this.userId}:${input.itemId}`;
    const existing = this.mastery.get(key) ?? {
      userId: this.userId,
      itemId: input.itemId,
      status: "not_started" as MasteryStatus,
      passCount: 0,
      failCount: 0,
      lastPracticedAt: null,
    };

    if (input.result === "pass") existing.passCount++;
    if (input.result === "fail") existing.failCount++;
    existing.lastPracticedAt = new Date().toISOString();

    // Compute status from the recent attempt history (newest first).
    // Pull last MASTERY_LOOKBACK attempts for this (user, item) — the
    // newly-pushed attempt is the most recent so it's included.
    const recentResults = this.attempts
      .filter((a) => a.userId === this.userId && a.itemId === input.itemId)
      .slice(-MASTERY_LOOKBACK)
      .reverse()
      .map((a) => a.result);

    existing.status = computeMasteryStatus(
      input.itemId,
      recentResults,
      existing.status === "not_started" ? null : existing.status,
    );

    this.mastery.set(key, existing);
  }

  async getMastery(lessonSlug: string): Promise<MasteryEntry[]> {
    // Filter by items whose itemId starts with the lesson prefix
    // e.g., "asl:" for lesson "asl", "freddy:" for "freddy-fractions"
    const prefix = lessonSlug.split("-")[0] + ":";
    return Array.from(this.mastery.values()).filter((m) =>
      m.itemId.startsWith(prefix)
    );
  }

  async getRecentActivity(limit: number): Promise<Attempt[]> {
    // Reverse insertion order (newest first) — more reliable than
    // timestamp sort for in-memory where inserts happen sub-ms apart.
    return this.attempts.slice().reverse().slice(0, limit);
  }

  /** No-op for the in-memory client (data isn't persisted across reloads). */
  async saveTrainingSample(input: SaveTrainingSampleInput): Promise<void> {
    void input;
  }
}
