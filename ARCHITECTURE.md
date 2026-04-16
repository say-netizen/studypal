# StudyPal — Architecture Document

> Last updated: 2026-04-15
> Stack: Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase · Expo (mobile)

---

## 1. Project Overview

StudyPal は「Duolingo meets Linear」をコンセプトにした、小学5年生〜中学3年生向けのAI学習アプリです。

| 軸 | 詳細 |
|----|------|
| 対象 | 小学5年生〜中学3年生（10〜15歳） |
| コア体験 | AI×ゲーミフィケーションで楽しく継続できる学習 |
| マネタイズ | フリーミアム（Free / Pro ¥980/月 / Family ¥1,480/月） |
| プラットフォーム | Web（Next.js）+ iOS/Android（Expo） |

---

## 2. Directory Structure

```
studypal-lp/                          # Next.js Web App (LP + App)
├── public/
│   ├── lp-original.html              # 元LP バックアップ
│   └── images/
├── src/
│   ├── app/                          # App Router
│   │   ├── (marketing)/              # LP・マーケティングページ
│   │   │   ├── page.tsx              # トップページ (LP)
│   │   │   ├── pricing/page.tsx
│   │   │   └── about/page.tsx
│   │   ├── (auth)/                   # 認証フロー
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── verify/page.tsx
│   │   ├── (app)/                    # メインアプリ（要認証）
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── learn/
│   │   │   │   ├── page.tsx          # 科目選択
│   │   │   │   └── [sessionId]/page.tsx  # 学習セッション
│   │   │   ├── quest/page.tsx        # クエスト一覧
│   │   │   ├── profile/page.tsx
│   │   │   └── ranking/page.tsx
│   │   ├── (parent)/                 # 保護者ダッシュボード
│   │   │   └── parent/
│   │   │       ├── dashboard/page.tsx
│   │   │       └── reports/page.tsx
│   │   └── (admin)/                  # 管理画面
│   │       └── admin/
│   │           ├── page.tsx
│   │           └── content/page.tsx
│   ├── components/
│   │   ├── lp/                       # LP専用コンポーネント
│   │   │   ├── HeroSection.tsx
│   │   │   ├── ProblemSection.tsx
│   │   │   ├── FeaturesSection.tsx
│   │   │   ├── SocialProofSection.tsx
│   │   │   ├── PricingSection.tsx
│   │   │   ├── FaqSection.tsx
│   │   │   ├── CtaSection.tsx
│   │   │   └── Footer.tsx
│   │   ├── ui/                       # 汎用UIコンポーネント
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── Avatar.tsx
│   │   │   └── Modal.tsx
│   │   ├── gamification/             # ゲーミフィケーションUI
│   │   │   ├── XpBar.tsx
│   │   │   ├── StreakBadge.tsx
│   │   │   ├── LevelUpModal.tsx
│   │   │   ├── BadgeUnlockToast.tsx
│   │   │   └── RankingCard.tsx
│   │   └── learn/                    # 学習セッションUI
│   │       ├── QuestionCard.tsx
│   │       ├── AnswerOptions.tsx
│   │       ├── ResultFeedback.tsx
│   │       └── SessionComplete.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser client
│   │   │   ├── server.ts             # Server component client
│   │   │   └── middleware.ts
│   │   ├── gamification/
│   │   │   ├── xp.ts                 # XP計算ロジック
│   │   │   ├── level.ts              # レベル計算 (100 * N^1.5)
│   │   │   ├── streak.ts             # ストリーク管理
│   │   │   └── badges.ts             # バッジ判定 (60種)
│   │   └── ai/
│   │       └── openai.ts             # OpenAI API wrapper
│   ├── hooks/
│   │   ├── useXp.ts
│   │   ├── useStreak.ts
│   │   └── useSession.ts
│   ├── store/
│   │   └── useUserStore.ts           # Zustand global state
│   ├── styles/
│   │   ├── tokens.css                # CLAUDE.md design tokens as CSS vars
│   │   └── animations.css            # keyframes (fadeUp, float, bounce, etc.)
│   └── types/
│       ├── database.ts               # Supabase generated types
│       └── gamification.ts
├── CLAUDE.md                         # Design system (source of truth)
├── ARCHITECTURE.md                   # このファイル
├── TASKS.md                          # タスク管理
├── tailwind.config.ts
├── next.config.ts
└── package.json

studypal/                             # Expo Mobile App (別ディレクトリ)
├── app.json
├── App.tsx
├── assets/
└── package.json
```

---

## 3. Database Schema (Supabase PostgreSQL)

### 3.1 Users & Auth

```sql
-- profiles (auth.users を拡張)
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id),
  username    text UNIQUE NOT NULL,
  display_name text NOT NULL,
  avatar_url  text,
  role        text DEFAULT 'student' CHECK (role IN ('student','parent','admin')),
  grade       int  CHECK (grade BETWEEN 5 AND 9),  -- 5=小5, 9=中3
  created_at  timestamptz DEFAULT now()
);

-- parent_child_links
CREATE TABLE parent_child_links (
  parent_id   uuid REFERENCES profiles(id),
  child_id    uuid REFERENCES profiles(id),
  PRIMARY KEY (parent_id, child_id)
);
```

### 3.2 Gamification

```sql
-- user_stats (XP・レベル・ストリーク)
CREATE TABLE user_stats (
  user_id         uuid PRIMARY KEY REFERENCES profiles(id),
  total_xp        int DEFAULT 0,
  current_level   int DEFAULT 1,
  current_streak  int DEFAULT 0,
  longest_streak  int DEFAULT 0,
  last_study_date date,
  updated_at      timestamptz DEFAULT now()
);

-- xp_transactions
CREATE TABLE xp_transactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id),
  amount      int NOT NULL,
  reason      text NOT NULL,  -- 'lesson_complete','quest_bonus','streak_bonus',...
  metadata    jsonb,
  created_at  timestamptz DEFAULT now()
);

-- badges
CREATE TABLE badges (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,  -- 'first_lesson','streak_7','level_10',...
  name        text NOT NULL,
  description text,
  icon_emoji  text,
  xp_reward   int DEFAULT 0
);

-- user_badges
CREATE TABLE user_badges (
  user_id     uuid REFERENCES profiles(id),
  badge_id    uuid REFERENCES badges(id),
  earned_at   timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);
```

### 3.3 Content

```sql
-- subjects
CREATE TABLE subjects (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug    text UNIQUE NOT NULL,  -- 'math','japanese','english','science','social'
  name    text NOT NULL,
  icon    text,
  color   text  -- hex color for subject theming
);

-- units
CREATE TABLE units (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id  uuid REFERENCES subjects(id),
  title       text NOT NULL,
  grade       int,
  order_index int NOT NULL
);

-- questions
CREATE TABLE questions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id     uuid REFERENCES units(id),
  type        text NOT NULL CHECK (type IN ('multiple_choice','fill_blank','sort','ai_conversation')),
  difficulty  int DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  content     jsonb NOT NULL,  -- 問題データ（型により構造異なる）
  xp_reward   int DEFAULT 10,
  created_at  timestamptz DEFAULT now()
);
```

### 3.4 Learning Sessions

```sql
-- sessions
CREATE TABLE sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id),
  unit_id     uuid REFERENCES units(id),
  started_at  timestamptz DEFAULT now(),
  completed_at timestamptz,
  score       int,
  xp_earned   int DEFAULT 0,
  answers     jsonb  -- [{question_id, answer, correct, time_ms}]
);

-- quests
CREATE TABLE quests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,
  title       text NOT NULL,
  description text,
  type        text CHECK (type IN ('daily','weekly')),
  criteria    jsonb NOT NULL,  -- {type:'sessions', count:3}
  xp_reward   int NOT NULL,
  expires_at  timestamptz
);

-- user_quest_progress
CREATE TABLE user_quest_progress (
  user_id     uuid REFERENCES profiles(id),
  quest_id    uuid REFERENCES quests(id),
  progress    int DEFAULT 0,
  completed   bool DEFAULT false,
  completed_at timestamptz,
  PRIMARY KEY (user_id, quest_id)
);
```

---

## 4. API Endpoints

### 4.1 App Router API Routes (`src/app/api/`)

| Method | Path | 説明 |
|--------|------|------|
| POST | `/api/auth/signup` | 新規登録 |
| POST | `/api/sessions/start` | 学習セッション開始 |
| POST | `/api/sessions/[id]/answer` | 回答送信・XP付与 |
| POST | `/api/sessions/[id]/complete` | セッション完了 |
| GET  | `/api/ranking` | ランキング取得（週次/全期間） |
| GET  | `/api/user/stats` | ユーザー統計 |
| POST | `/api/ai/hint` | AIヒント生成（OpenAI） |
| POST | `/api/ai/explain` | AI解説生成 |
| GET  | `/api/quests` | 今日のクエスト |
| POST | `/api/quests/[id]/claim` | クエスト報酬受取 |

---

## 5. Gamification System

### 5.1 XP Rules

| アクション | XP |
|-----------|-----|
| 問題正解（基本） | +10 XP |
| 問題正解（ストリークボーナス×2） | +20 XP |
| 問題正解（完璧セッション） | +25 XP |
| セッション完了 | +50 XP |
| デイリークエスト完了 | +100 XP |
| ウィークリークエスト完了 | +300 XP |
| バッジ獲得 | +50〜200 XP |

### 5.2 Level Formula

```typescript
// レベルアップに必要な累積XP: 100 * N^1.5
function xpForLevel(n: number): number {
  return Math.floor(100 * Math.pow(n, 1.5));
}

// 例: Lv1→2: 141XP, Lv9→10: 3162XP
```

### 5.3 Streak Rules

- 毎日 JST 00:05 にCronジョブが実行
- 前日に学習していない場合: `current_streak = 0`
- 当日に学習済み: `current_streak += 1`
- 7日連続でボーナスバッジ、30日連続で特別バッジ

### 5.4 Badges (60種)

| カテゴリ | 例 |
|---------|-----|
| 初回 | first_lesson, first_perfect |
| ストリーク | streak_3, streak_7, streak_30, streak_100 |
| レベル | level_5, level_10, level_20, level_50 |
| 科目 | math_master, english_hero, ... |
| クエスト | quest_veteran, daily_champion |

---

## 6. Authentication Flow

```
User → Supabase Auth (Email Magic Link / Google OAuth)
     → profiles テーブルに自動挿入 (trigger)
     → user_stats テーブルに初期化 (trigger)
     → role に応じてリダイレクト
       - student → /dashboard
       - parent  → /parent/dashboard
       - admin   → /admin
```

### Middleware (src/middleware.ts)

```
/app/*     → 要認証 (student role)
/parent/*  → 要認証 (parent role)
/admin/*   → 要認証 (admin role)
/          → 公開 (LP)
/login     → 未認証のみ
```

---

## 7. AI Integration

- **プロバイダー**: OpenAI GPT-4o-mini（コスト最適化）
- **用途**:
  1. ヒント生成: 問題に対する段階的ヒント（3段階）
  2. 解説生成: 不正解時の丁寧な解説
  3. AI会話問題: 英語・国語の対話型問題
- **安全策**:
  - システムプロンプトで小学生向け言語に制約
  - レートリミット: 1ユーザー/分 10リクエスト
  - コンテンツフィルタリング有効

---

## 8. Infrastructure

```
Vercel (Next.js)
  ├── Edge Runtime: middleware, API routes
  └── Node.js Runtime: AI routes (long timeout)

Supabase
  ├── PostgreSQL: メインDB
  ├── Auth: Magic Link + Google OAuth
  ├── Storage: アバター画像
  └── Edge Functions: ストリーク判定Cron (JST 00:05)

OpenAI
  └── GPT-4o-mini: ヒント・解説生成
```

---

## 9. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 10. Mobile App (Expo)

別ディレクトリ `../studypal/` に Expo プロジェクトが存在。
Web版と同一のSupabaseバックエンドを共有。

| 項目 | 詳細 |
|------|------|
| Framework | Expo (blank-typescript template) |
| Navigation | Expo Router (予定) |
| State | Zustand (Web版と共有可) |
| Push通知 | Expo Notifications |
| ストリーク通知 | 毎日20:00 JST にプッシュ |
