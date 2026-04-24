// レベルシステム
// 小3〜高3対応、グレード別 maxXp、RPG風パワーカーブ (指数 2.2)
//
// 学習時間とレベル99の対応:
//   小学生: 1,000 時間 → Lv.99  (10 XP/min × 60,000 min = 600,000 XP)
//   中学生: 2,000 時間 → Lv.99  (1,200,000 XP)
//   高校生: 4,000 時間 → Lv.99  (2,400,000 XP ≒ 神戸大合格ライン)

export type SchoolStage = "elementary" | "middle" | "high";

const STAGE_MAX_XP: Record<SchoolStage, number> = {
  elementary: 600_000,    // 小学生  ~1,000時間
  middle:   1_200_000,    // 中学生  ~2,000時間
  high:     2_400_000,    // 高校生  ~4,000時間
};

const GRADE_LABELS: Record<string, SchoolStage> = {
  "小学3年生": "elementary", "小学4年生": "elementary",
  "小学5年生": "elementary", "小学6年生": "elementary",
  "中学1年生": "middle",     "中学2年生": "middle",     "中学3年生": "middle",
  "高校1年生": "high",       "高校2年生": "high",       "高校3年生": "high",
};

export function getSchoolStage(grade: string | null | undefined): SchoolStage {
  if (!grade) return "middle";
  return GRADE_LABELS[grade] ?? "middle";
}

export function getMaxXp(grade: string | null | undefined): number {
  return STAGE_MAX_XP[getSchoolStage(grade)];
}

// レベル n に達するために必要な累積 XP
// curve: maxXp × ((n-1)/98)^2.2  (level 1 = 0, level 99 = maxXp)
export function xpRequiredForLevel(level: number, maxXp: number): number {
  if (level <= 1) return 0;
  if (level >= 99) return maxXp;
  return Math.round(maxXp * Math.pow((level - 1) / 98, 2.2));
}

// 累積 XP からレベルを算出（逆関数）
export function calcLevelFromXp(totalXp: number, maxXp: number): number {
  if (totalXp <= 0) return 1;
  if (totalXp >= maxXp) return 99;
  const ratio = Math.pow(totalXp / maxXp, 1 / 2.2);
  return Math.min(99, Math.max(1, Math.floor(ratio * 98) + 1));
}

// 現在レベルの進捗情報
export function calcLevelProgress(
  totalXp: number,
  grade?: string | null,
): {
  level: number;
  currentXp: number;
  requiredXp: number;
  progress: number;
  maxXp: number;
  stage: SchoolStage;
} {
  const safeXp = Number.isFinite(totalXp) && totalXp >= 0 ? totalXp : 0;
  const stage = getSchoolStage(grade);
  const maxXp = STAGE_MAX_XP[stage];
  const level = calcLevelFromXp(safeXp, maxXp);

  if (level >= 99) {
    return { level: 99, currentXp: maxXp, requiredXp: maxXp, progress: 1, maxXp, stage };
  }

  const currentLevelXp = xpRequiredForLevel(level, maxXp);
  const nextLevelXp = xpRequiredForLevel(level + 1, maxXp);
  const currentXp = Math.max(0, safeXp - currentLevelXp);
  const requiredXp = Math.max(1, nextLevelXp - currentLevelXp);
  const progress = currentXp / requiredXp;

  return { level, currentXp, requiredXp, progress, maxXp, stage };
}

// レベル帯ごとのカラーとラベル
export function levelTier(level: number): { color: string; label: string } {
  if (level <= 15) return { color: "#CD7F32", label: "Bronze" };
  if (level <= 30) return { color: "#A8A9AD", label: "Silver" };
  if (level <= 50) return { color: "#FFD700", label: "Gold" };
  if (level <= 70) return { color: "#00C9A7", label: "Platinum" };
  if (level <= 85) return { color: "#1CB0F6", label: "Diamond" };
  return { color: "#9B5DE5", label: "Master" };
}
