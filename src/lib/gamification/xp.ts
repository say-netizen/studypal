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
