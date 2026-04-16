// Gamification Types

export interface UserStats {
  userId: string;
  totalXp: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  updatedAt: string;
}

export interface XpTransaction {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconEmoji: string;
  xpReward: number;
}

export interface UserBadge {
  userId: string;
  badge: Badge;
  earnedAt: string;
}

export interface Quest {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: "daily" | "weekly";
  criteria: QuestCriteria;
  xpReward: number;
  expiresAt: string;
}

export interface QuestCriteria {
  type: "sessions" | "correct_answers" | "streak_days" | "xp_earned";
  count: number;
}

export interface UserQuestProgress {
  userId: string;
  quest: Quest;
  progress: number;
  completed: boolean;
  completedAt: string | null;
}

export interface LevelUpEvent {
  oldLevel: number;
  newLevel: number;
  xpGained: number;
}
