/** Universal progress data model — shared by all lessons. */

export type AttemptResult = "pass" | "fail" | "uncertain" | "skip";
export type SessionOutcome = "win" | "exit" | "in_progress";
export type MasteryStatus =
  | "not_started"
  | "practicing"
  | "mastered"
  | "needs_practice";

export interface Attempt {
  id: string;
  userId: string;
  sessionId: string;
  itemId: string;
  result: AttemptResult;
  hintFired: boolean;
  referenceVideoShown: boolean;
  createdAt: string;
}

export interface LessonSession {
  id: string;
  userId: string;
  lessonSlug: string;
  startedAt: string;
  endedAt: string | null;
  outcome: SessionOutcome;
}

export interface MasteryEntry {
  userId: string;
  itemId: string;
  status: MasteryStatus;
  passCount: number;
  failCount: number;
  lastPracticedAt: string | null;
}

export interface RecordAttemptInput {
  sessionId: string;
  itemId: string;
  result: AttemptResult;
  hintFired?: boolean;
  referenceVideoShown?: boolean;
}

/**
 * User-submitted correction. The user is confident they're signing
 * `itemId` (e.g. "asl:C") even though the model predicted
 * `predictedItemId` (e.g. "asl:D"). The 32-frame × 126-feature buffer
 * is serialized to a number[][] for storage as jsonb.
 */
export interface SaveTrainingSampleInput {
  itemId: string;
  predictedItemId?: string;
  landmarks: number[][];
  source?: string;
}

/**
 * ProgressHandle — the contract exposed to lessons via platform.progress.
 *
 * Mirrors the DI pattern from NameAudioCache: an interface with
 * InMemory (tests) and Supabase (prod) implementations.
 */
export interface ProgressHandle {
  startSession(lessonSlug: string): Promise<string>;
  endSession(sessionId: string, outcome: SessionOutcome): Promise<void>;
  recordAttempt(input: RecordAttemptInput): Promise<void>;
  getMastery(lessonSlug: string): Promise<MasteryEntry[]>;
  getRecentActivity(limit: number): Promise<Attempt[]>;
  /** Persist a user-submitted correction for future model retraining. */
  saveTrainingSample(input: SaveTrainingSampleInput): Promise<void>;
}
