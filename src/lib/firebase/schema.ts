import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type Timestamp,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "./client";

// ─────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────

export interface UserDoc {
  name: string;
  email: string;
  grade: string | null;
  plan: "free" | "pro" | "family";
  stripeCustomerId: string | null;
  totalXp: number;
  currentLevel: number;
  currentStreak: number;
  lastStudyDate: string | null; // YYYY-MM-DD
  createdAt: Timestamp;
}

export interface TestDoc {
  userId: string;
  subject: string;
  testDate: Timestamp;
  range: string;
  createdAt: Timestamp;
}

export interface QuestionDoc {
  testId: string;
  userId: string;
  type: "multiple" | "fill" | "description";
  question: string;
  choices: string[] | null;
  answer: string;
  explanation: string;
  isCorrect: boolean | null;
  answeredAt: Timestamp | null;
  createdAt: Timestamp;
}

export interface ScheduleDoc {
  userId: string;
  date: string;        // YYYY-MM-DD
  startTime: string | null;  // HH:MM
  subject: string | null;
  duration: number;    // 分
  type: "study" | "club" | "event" | "test";
  title: string;
  createdAt: Timestamp;
}

export interface StudySessionDoc {
  userId: string;
  subject: string;
  plannedMinutes: number;  // 0 = 予定なし（自由学習）
  actualMinutes: number;
  scheduleId: string | null;
  date: string; // YYYY-MM-DD
  createdAt: Timestamp;
}

export interface RankingEntry {
  nickname: string;
  score: number;
  level: number;
  subject: string | null;
  updatedAt: Timestamp;
}

// ─────────────────────────────────────────
// ユーティリティ
// ─────────────────────────────────────────

function snapToData<T>(snap: DocumentData): T & { id: string } {
  return { id: snap.id, ...(snap.data() as T) };
}

// ─────────────────────────────────────────
// users
// ─────────────────────────────────────────

export async function getUser(uid: string): Promise<(UserDoc & { id: string }) | null> {
  const snap = await getDoc(doc(db(), "users", uid));
  return snap.exists() ? snapToData<UserDoc>(snap) : null;
}

export async function upsertUser(uid: string, data: Partial<UserDoc>) {
  await setDoc(doc(db(), "users", uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function addXp(uid: string, amount: number): Promise<void> {
  const user = await getUser(uid);
  if (!user) return;
  const newXp = user.totalXp + amount;
  await updateDoc(doc(db(), "users", uid), { totalXp: newXp });
}

/** クイズ完了時に呼ぶ。日次ストリークを更新する */
export async function recordStudySession(uid: string): Promise<number> {
  const user = await getUser(uid);
  if (!user) return 0;

  const today = new Date().toISOString().slice(0, 10);
  const last = user.lastStudyDate;

  if (last === today) return user.currentStreak; // 今日はすでに記録済み

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const newStreak = last === yesterday ? user.currentStreak + 1 : 1;

  await updateDoc(doc(db(), "users", uid), {
    currentStreak: newStreak,
    lastStudyDate: today,
  });

  return newStreak;
}

// ─────────────────────────────────────────
// tests
// ─────────────────────────────────────────

export async function createTest(data: Omit<TestDoc, "createdAt">) {
  return addDoc(collection(db(), "tests"), { ...data, createdAt: serverTimestamp() });
}

export async function getUserTests(uid: string, limitCount = 10) {
  const q = query(
    collection(db(), "tests"),
    where("userId", "==", uid),
    orderBy("testDate", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => snapToData<TestDoc>(d));
}

export async function getTest(testId: string) {
  const snap = await getDoc(doc(db(), "tests", testId));
  return snap.exists() ? snapToData<TestDoc>(snap) : null;
}

// ─────────────────────────────────────────
// questions
// ─────────────────────────────────────────

export async function createQuestion(
  data: Omit<QuestionDoc, "createdAt" | "isCorrect" | "answeredAt">
) {
  return addDoc(collection(db(), "questions"), {
    ...data,
    isCorrect: null,
    answeredAt: null,
    createdAt: serverTimestamp(),
  });
}

export async function getTestQuestions(testId: string) {
  const q = query(
    collection(db(), "questions"),
    where("testId", "==", testId),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => snapToData<QuestionDoc>(d));
}

export async function answerQuestion(questionId: string, isCorrect: boolean) {
  await updateDoc(doc(db(), "questions", questionId), {
    isCorrect,
    answeredAt: serverTimestamp(),
  });
}

export async function deleteQuestion(questionId: string) {
  await deleteDoc(doc(db(), "questions", questionId));
}

// ─────────────────────────────────────────
// schedules
// ─────────────────────────────────────────

export async function createSchedule(data: Omit<ScheduleDoc, "createdAt">) {
  return addDoc(collection(db(), "schedules"), { ...data, createdAt: serverTimestamp() });
}

/** 繰り返し予定を一括作成（毎週N回分） */
export async function createRecurringSchedules(
  base: Omit<ScheduleDoc, "createdAt" | "date">,
  startDate: string,
  weeks: number
) {
  const promises = [];
  for (let i = 0; i < weeks; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i * 7);
    const dateStr = d.toISOString().slice(0, 10);
    promises.push(
      addDoc(collection(db(), "schedules"), { ...base, date: dateStr, createdAt: serverTimestamp() })
    );
  }
  return Promise.all(promises);
}

export async function getSchedulesByDate(uid: string, date: string) {
  const q = query(
    collection(db(), "schedules"),
    where("userId", "==", uid),
    where("date", "==", date),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => snapToData<ScheduleDoc>(d));
}

export async function getScheduleRange(uid: string, startDate: string, endDate: string) {
  const q = query(
    collection(db(), "schedules"),
    where("userId", "==", uid),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => snapToData<ScheduleDoc>(d));
}

export async function updateSchedule(scheduleId: string, data: Partial<ScheduleDoc>) {
  await updateDoc(doc(db(), "schedules", scheduleId), data);
}

export async function deleteSchedule(scheduleId: string) {
  await deleteDoc(doc(db(), "schedules", scheduleId));
}

// ─────────────────────────────────────────
// studySessions
// ─────────────────────────────────────────

export async function createStudySession(data: Omit<StudySessionDoc, "createdAt">) {
  return addDoc(collection(db(), "studySessions"), { ...data, createdAt: serverTimestamp() });
}

export async function getStudySessionsByDate(uid: string, date: string) {
  const q = query(
    collection(db(), "studySessions"),
    where("userId", "==", uid),
    where("date", "==", date),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => snapToData<StudySessionDoc>(d));
}

export async function getStudySessionRange(uid: string, startDate: string, endDate: string) {
  const q = query(
    collection(db(), "studySessions"),
    where("userId", "==", uid),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => snapToData<StudySessionDoc>(d));
}

// ─────────────────────────────────────────
// rankings — rankings/weekly_{year}_{week}/{uid}
// ─────────────────────────────────────────

function weeklyDocPath(year: number, week: number): string {
  return `rankings/weekly_${year}_${String(week).padStart(2, "0")}`;
}

export async function upsertRanking(
  uid: string,
  year: number,
  week: number,
  data: Omit<RankingEntry, "updatedAt">
) {
  const collRef = collection(db(), weeklyDocPath(year, week));
  await setDoc(doc(collRef, uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getWeeklyRanking(
  year: number,
  week: number,
  limitCount = 50,
  ...extra: QueryConstraint[]
) {
  const q = query(
    collection(db(), weeklyDocPath(year, week)),
    orderBy("score", "desc"),
    limit(limitCount),
    ...extra
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as RankingEntry) }));
}
