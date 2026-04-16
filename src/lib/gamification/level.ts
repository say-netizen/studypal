// レベル計算ロジック
// レベルアップに必要な累積XP: 100 * N^1.5

/**
 * レベル N になるために必要な累積XP
 * 例: Lv2 = 141, Lv5 = 1118, Lv10 = 3162
 */
export function xpRequiredForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * 総XPからレベルを計算
 */
export function calcLevelFromXp(totalXp: number): number {
  let level = 1;
  while (xpRequiredForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}

/**
 * 現在レベルの進捗率 (0〜1)
 */
export function calcLevelProgress(totalXp: number): {
  level: number;
  currentXp: number;
  requiredXp: number;
  progress: number;
} {
  const level = calcLevelFromXp(totalXp);
  const currentLevelXp = xpRequiredForLevel(level);
  const nextLevelXp = xpRequiredForLevel(level + 1);
  const currentXp = totalXp - currentLevelXp;
  const requiredXp = nextLevelXp - currentLevelXp;
  const progress = currentXp / requiredXp;

  return { level, currentXp, requiredXp, progress };
}
