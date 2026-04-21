// XP計算ロジック

export const XP_RULES = {
  CORRECT_ANSWER:       10,
  CORRECT_STREAK_BONUS: 20,  // ストリーク中の正解
  PERFECT_SESSION:      25,  // 全問正解
  SESSION_COMPLETE:     50,
  DAILY_QUEST:         100,
  WEEKLY_QUEST:        300,
  BADGE_MIN:            50,
  BADGE_MAX:           200,
} as const;

// ランキングスコア計算ルール
export const RANKING_POINTS = {
  SCHEDULED_STUDY_PER_MIN: 10,  // 予定通りの勉強（カレンダー登録済み）
  FREE_STUDY_PER_MIN: 5,         // 予定外の勉強
  STREAK_PER_DAY: 20,            // ストリーク継続
  TEST_REGISTRATION: 5,          // テスト登録
} as const;

export function calcRankingPoints(params: {
  scheduledMinutes: number;
  freeMinutes: number;
  streakDays: number;
  testRegistrations: number;
}): { total: number; scheduledPts: number; freePts: number; streakPts: number; testPts: number } {
  const scheduledPts = params.scheduledMinutes * RANKING_POINTS.SCHEDULED_STUDY_PER_MIN;
  const freePts      = params.freeMinutes * RANKING_POINTS.FREE_STUDY_PER_MIN;
  const streakPts    = params.streakDays * RANKING_POINTS.STREAK_PER_DAY;
  const testPts      = params.testRegistrations * RANKING_POINTS.TEST_REGISTRATION;
  return { total: scheduledPts + freePts + streakPts + testPts, scheduledPts, freePts, streakPts, testPts };
}

export type XpReason =
  | "correct_answer"
  | "correct_streak_bonus"
  | "perfect_session"
  | "session_complete"
  | "daily_quest"
  | "weekly_quest"
  | "badge_earned";

export function calcXpForAction(reason: XpReason, streakActive = false): number {
  switch (reason) {
    case "correct_answer":
      return streakActive ? XP_RULES.CORRECT_STREAK_BONUS : XP_RULES.CORRECT_ANSWER;
    case "perfect_session":
      return XP_RULES.PERFECT_SESSION;
    case "session_complete":
      return XP_RULES.SESSION_COMPLETE;
    case "daily_quest":
      return XP_RULES.DAILY_QUEST;
    case "weekly_quest":
      return XP_RULES.WEEKLY_QUEST;
    default:
      return 0;
  }
}
