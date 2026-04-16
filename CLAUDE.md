# StudyPal Design System — CLAUDE.md

> **コンセプト：「Duolingo meets Linear」**
> 小中学生向け・ゲーミフィケーション・AI学習プラットフォーム

---

## 1. デザイン哲学

StudyPal は3つのプロダクトのベストを融合したデザイン言語を持つ。

| 参照元 | 採用する要素 | 目的 |
|--------|-------------|------|
| **Duolingo** | 鮮やかな色彩・ゲーミフィケーション・お祝いアニメーション | 子どもが続けたくなる楽しさ |
| **Linear** | ダーク/ライトモード・クリーンなカード・ステータスUI | 保護者・教師が信頼する洗練さ |
| **Notion** | ブロック/ベント構造・情報の整理感 | 学習コンテンツの見通しの良さ |

**設計原則**
1. **Joy-first** — 操作するたびに小さな喜びがある
2. **Clarity over cleverness** — 子どもが迷わないシンプルな導線
3. **Progress made visible** — 成長が常に目に見える形で表示される
4. **Dark mode ready** — 夜間学習・保護者の目への配慮

---

## 2. カラーパレット

### 2.1 ブランドカラー（Duolingo から継承・StudyPal 向けにチューニング）

```css
/* === Primary === */
--color-brand-green:   #58CC02;   /* メイン正解・達成 (Duolingo Feather Green) */
--color-brand-blue:    #1CB0F6;   /* AI・アクション・リンク (Duolingo Dodger Blue) */
--color-brand-purple:  #9B5DE5;   /* レベル・プレミアム要素 */

/* === Semantic === */
--color-success:       #58CC02;
--color-error:         #FF4B4B;
--color-warning:       #FF9600;
--color-xp-gold:       #FFD900;   /* XP・コイン・スター */
--color-heart:         #FF4B4B;   /* ライフ・ハート */
--color-streak:        #FF9600;   /* ストリーク炎 */

/* === Accent (Secondary delight colors) === */
--color-accent-pink:   #FF6BB3;
--color-accent-teal:   #00C9A7;
--color-accent-orange: #FF9600;
```

### 2.2 ニュートラル（Linear から継承）

```css
/* Light Mode */
--color-bg-primary:    #FFFFFF;
--color-bg-secondary:  #F7F7F8;   /* カード背景 */
--color-bg-tertiary:   #EFEFEF;
--color-border:        #E5E5E5;
--color-text-primary:  #1A1A1A;
--color-text-secondary:#6B7280;
--color-text-muted:    #9CA3AF;

/* Dark Mode */
--color-bg-primary-dark:    #0F0F10;   /* Linear ダーク基調 */
--color-bg-secondary-dark:  #1C1C1E;
--color-bg-tertiary-dark:   #2A2A2D;
--color-border-dark:        #3A3A3D;
--color-text-primary-dark:  #F2F2F2;
--color-text-secondary-dark:#A0A0A8;
```

### 2.3 カラー使用ルール

- **緑 (#58CC02)** → 正解・達成・「できた！」の瞬間にのみ使う
- **青 (#1CB0F6)** → プライマリボタン・AI機能・インタラクティブ要素
- **紫 (#9B5DE5)** → レベル・バッジ・プレミアム要素
- **金 (#FFD900)** → XP・スター・ランキング（多用禁止）
- **背景** → ほぼ白/ダーク。カラフルにするのはアクセントのみ

---

## 3. タイポグラフィ

### 3.1 フォント定義

```css
/* Display / 見出し (Duolingo DIN Rounded 系の精神を継承) */
--font-display: 'Nunito', 'DIN Rounded', 'M PLUS Rounded 1c', sans-serif;
/* 丸みのある書体で子どもに親しみやすく */

/* UI / 本文 (Linear の Inter 精神を継承) */
--font-ui: 'Inter', 'Noto Sans JP', system-ui, sans-serif;
/* 高可読性・クリーン */

/* Mono / コード・数式 */
--font-mono: 'JetBrains Mono', 'Noto Sans Mono', monospace;
```

### 3.2 タイプスケール

```css
--text-xs:   0.75rem;   /* 12px — ラベル・バッジ */
--text-sm:   0.875rem;  /* 14px — キャプション・補助テキスト */
--text-base: 1rem;      /* 16px — 本文 */
--text-lg:   1.125rem;  /* 18px — カード見出し */
--text-xl:   1.25rem;   /* 20px — セクション見出し */
--text-2xl:  1.5rem;    /* 24px — ページ見出し */
--text-3xl:  1.875rem;  /* 30px — ヒーロー見出し */
--text-4xl:  2.25rem;   /* 36px — ランディング大見出し */
--text-5xl:  3rem;      /* 48px — LP メインコピー */
```

### 3.3 フォントウェイト

```css
--font-regular:    400;
--font-medium:     500;
--font-semibold:   600;
--font-bold:       700;
--font-extrabold:  800;   /* Duolingo スタイルの力強い見出し */
```

### 3.4 タイポグラフィルール

- **見出し** → `font-display` + `font-extrabold` + 行間 `1.2`
- **本文・UI** → `font-ui` + `font-regular/medium` + 行間 `1.6`
- **子ども向けコンテンツ** → `text-lg` 以上を基本とし小さい文字を避ける
- **日本語** → `font-feature-settings: "palt" 1` でプロポーショナル化

---

## 4. スペーシング

4の倍数ベース（Tailwind CSS 標準スケール準拠）。

```css
--space-1:  0.25rem;   /* 4px */
--space-2:  0.5rem;    /* 8px */
--space-3:  0.75rem;   /* 12px */
--space-4:  1rem;      /* 16px — 基本単位 */
--space-5:  1.25rem;   /* 20px */
--space-6:  1.5rem;    /* 24px */
--space-8:  2rem;      /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
--space-20: 5rem;      /* 80px */
--space-24: 6rem;      /* 96px */
```

---

## 5. ボーダーラジウス

Duolingo の「ピル形状」精神を継承。角は常に丸く・親しみやすく。

```css
--radius-sm:   0.375rem;   /* 6px  — インプット・タグ */
--radius-md:   0.75rem;    /* 12px — カード・パネル */
--radius-lg:   1rem;       /* 16px — モーダル・ドロワー */
--radius-xl:   1.5rem;     /* 24px — 大きいカード */
--radius-pill: 9999px;     /* ボタン・バッジ (Duolingo シグネチャー) */
--radius-full: 50%;        /* アバター・アイコン */
```

---

## 6. シャドウ・エレベーション

Linear のクリーンさと Duolingo の奥行き感を両立。

```css
/* Light Mode */
--shadow-sm:  0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
--shadow-md:  0 4px 12px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06);
--shadow-lg:  0 10px 30px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06);
--shadow-xl:  0 20px 50px rgba(0,0,0,0.15);

/* Brand shadow (正解・達成カード) */
--shadow-brand-green:  0 4px 15px rgba(88, 204, 2, 0.35);
--shadow-brand-blue:   0 4px 15px rgba(28, 176, 246, 0.35);
--shadow-brand-purple: 0 4px 15px rgba(155, 93, 229, 0.35);

/* Dark Mode */
--shadow-dark-sm: 0 1px 3px rgba(0,0,0,0.4);
--shadow-dark-md: 0 4px 12px rgba(0,0,0,0.5);
```

---

## 7. UIコンポーネント仕様

### 7.1 ボタン

```
Primary Button (Duolingo ピルスタイル)
  background:    var(--color-brand-blue)
  border-radius: var(--radius-pill)
  padding:       12px 28px
  font:          font-ui, font-bold, text-base
  border:        none
  transition:    transform 120ms ease, box-shadow 120ms ease
  hover:         translateY(-2px), shadow-brand-blue
  active:        translateY(1px), shadow none (押し込む感触)

Success Button
  background:    var(--color-brand-green)
  → 正解・完了・進む ボタン専用

Ghost Button
  background:    transparent
  border:        2px solid var(--color-border)
  border-radius: var(--radius-pill)
  → キャンセル・スキップ系
```

### 7.2 カード

```
Lesson Card (Linear カード精神)
  background:    var(--color-bg-secondary)
  border:        1px solid var(--color-border)
  border-radius: var(--radius-xl)
  padding:       var(--space-6)
  shadow:        var(--shadow-md)
  hover:         translateY(-4px), shadow-lg (軽くリフトアップ)

Achievement Card (Duolingo バッジ風)
  background:    グラデーション (ブランドカラーベース)
  border-radius: var(--radius-xl)
  shadow:        var(--shadow-brand-*) (達成種別に対応)
```

### 7.3 プログレスバー（XP・進捗）

```
Track:
  background:    var(--color-bg-tertiary)
  height:        12px
  border-radius: var(--radius-pill)

Fill:
  background:    linear-gradient(90deg, #58CC02, #89E219)
  transition:    width 600ms cubic-bezier(0.34, 1.56, 0.64, 1)  /* バウンス */
  border-radius: var(--radius-pill)
```

### 7.4 バッジ・ステータスチップ（Linear インスパイア）

```
In Progress:  bg #1CB0F6/15, text #1CB0F6, border #1CB0F6/30
Completed:    bg #58CC02/15, text #58CC02, border #58CC02/30
Locked:       bg #9CA3AF/15, text #9CA3AF, border #9CA3AF/30
New:          bg #FF9600/15, text #FF9600, border #FF9600/30
border-radius: var(--radius-pill)
font:         font-semibold, text-xs, uppercase, letter-spacing 0.05em
```

### 7.5 ナビゲーション

```
Sidebar (Linear スタイル):
  width:       240px
  background:  var(--color-bg-secondary)
  border-right: 1px solid var(--color-border)
  → アイテムは icon + label、アクティブは --color-brand-blue/10 背景

Bottom Tab Bar (Duolingo スタイル / モバイル):
  height:      64px
  background:  var(--color-bg-primary)
  border-top:  1px solid var(--color-border)
  → アクティブタブはブランドカラーのアイコン + ラベル
```

---

## 8. アニメーション・モーション

### 8.1 イージング定義

```css
--ease-default:   cubic-bezier(0.4, 0, 0.2, 1);    /* 汎用 */
--ease-in:        cubic-bezier(0.4, 0, 1, 1);
--ease-out:       cubic-bezier(0, 0, 0.2, 1);
--ease-bounce:    cubic-bezier(0.34, 1.56, 0.64, 1); /* Duolingo バウンス */
--ease-spring:    cubic-bezier(0.175, 0.885, 0.32, 1.275); /* スプリング感 */
```

### 8.2 デュレーション

```css
--duration-fast:    120ms;   /* ホバー・マイクロインタラクション */
--duration-normal:  200ms;   /* 通常のトランジション */
--duration-slow:    350ms;   /* モーダル・ページ遷移 */
--duration-xp:      600ms;   /* XPバー・進捗アニメーション */
--duration-celebrate: 800ms; /* 正解アニメーション */
```

### 8.3 ゲーミフィケーションアニメーション（Duolingo 継承）

```
正解時 (Correct):
  1. カードが scale(1.05) → scale(1) + shadow-brand-green
  2. 緑チェックが bounceIn (cubic-bezier bounce)
  3. XPバーが左から右へ伸びる (duration-xp)
  4. +XP テキストが float-up して fadeOut

不正解時 (Incorrect):
  1. カードが shake (translateX: -8px → 8px → -4px → 0, 400ms)
  2. ハートが1つ pulse して消える

レベルアップ:
  1. フルスクリーンオーバーレイ (confetti パーティクル)
  2. バッジが scale(0) → scale(1.2) → scale(1) (spring ease)
  3. ファンファーレ音 (オプション)

ストリーク:
  1. 炎アイコンが pulse + glow (--color-streak)
  2. 数字が count-up アニメーション

XP 加算:
  position: absolute の "+15 XP" テキストが
  translateY(-30px) + opacity(0) で 800ms フロートアップ
```

### 8.4 ページ・画面遷移（Linear 継承）

```
ページイン:   opacity(0→1) + translateY(8px→0), 200ms ease-out
ページアウト: opacity(1→0) + translateY(0→-8px), 150ms ease-in
モーダル開:  scale(0.95→1) + opacity(0→1), 200ms ease-out
モーダル閉:  scale(1→0.95) + opacity(1→0), 150ms ease-in
```

### 8.5 ホバーインタラクション

```
カード:   translateY(-4px) + shadow-lg, 200ms ease
ボタン:   translateY(-2px) + shadow-brand, 120ms ease
アイコン: scale(1.1), 120ms ease
リンク:   color変化 + underline, 150ms ease
```

---

## 9. レイアウトパターン

### 9.1 グリッドシステム

```css
/* LP / マーケティングページ */
--grid-max-width: 1280px;
--grid-gutter:    var(--space-6);   /* 24px */
--grid-cols-sm:   1;
--grid-cols-md:   2;
--grid-cols-lg:   3;
--grid-cols-xl:   4;

/* アプリ本体 */
--app-sidebar-width: 240px;
--app-content-max:   900px;
```

### 9.2 ベントレイアウト（Notion 継承）

```
Hero Bento (LP用):
  ┌──────────────────────┬────────┐
  │  メインコピー + CTA   │ 画面   │
  │  (col-span-2)        │ モック │
  ├───────────┬──────────┤        │
  │  特徴1    │  特徴2   │        │
  └───────────┴──────────┴────────┘

Feature Bento (機能紹介):
  ┌──────────┬──────────────────────┐
  │  小カード │  大きい機能カード     │
  │          │  (col-span-2)        │
  ├──────────┴──────────┬───────────┤
  │  ワイドカード         │  小カード  │
  └──────────────────────┴───────────┘
```

### 9.3 コンテンツパターン

```
Lesson Flow (学習画面):
  - 上部: プログレスバー + ハート数
  - 中央: 問題コンテンツ (max-width: 600px, center)
  - 下部: 回答選択肢 or 入力 + 次へボタン

Dashboard (Linear カンバン精神):
  - サイドバー: 科目一覧・ナビ
  - メイン: 今日の学習カード群 (ベントグリッド)
  - 右パネル (任意): 統計・ランキング
```

---

## 10. ゲーミフィケーションUIシステム

### 10.1 XP・ポイント表示

```
XPバー:
  全幅プログレスバー、常にヘッダーに表示
  現在レベル → 次のレベルまでの進捗

XPポップアップ:
  正解ごとに "+N XP" がフロートアップ
  色: --color-xp-gold
  フォント: font-display, font-extrabold
```

### 10.2 ストリーク

```
炎アイコン + 連続日数
色: --color-streak (#FF9600)
ストリーク継続中: pulse アニメーション
ストリーク危機 (当日未学習): shake + 警告色
```

### 10.3 レベル・バッジシステム

```
レベル 1-10:  Bronze  (#CD7F32) — 基礎
レベル 11-20: Silver  (#C0C0C0) — 発展
レベル 21-30: Gold    (#FFD700) — 上級
レベル 31+:   Diamond (#1CB0F6) — エキスパート

バッジカード:
  円形 or 六角形
  レベルに対応したグラデーション背景
  shadow: var(--shadow-brand-*)
```

### 10.4 リーダーボード（Linear ステータスUI風）

```
ランキング表:
  各行: アバター + 名前 + XP + 変動インジケータ (↑↓)
  1位: --color-xp-gold 強調
  自分の行: --color-brand-blue/10 背景ハイライト
  アニメーション: 順位変動時にスライドアップ/ダウン
```

---

## 11. AI機能のUIパターン

### 11.1 AI アシスタント（StudyPal AI）

```
チャットUI:
  - ユーザーバブル: 右揃え, bg --color-brand-blue, text white
  - AIバブル: 左揃え, bg --color-bg-secondary, text --color-text-primary
  - AIアバター: アニメーション付き (学習中は考える動作)
  - タイピングインジケータ: 3点ドットのバウンスアニメーション

AIヒント:
  💡アイコン + bg --color-xp-gold/10
  border: 1px solid --color-xp-gold/30
  border-radius: var(--radius-md)
```

### 11.2 AI 生成コンテンツの識別

```
AIバッジ:
  "✨ AI生成" チップ
  bg: linear-gradient(135deg, #9B5DE5, #1CB0F6)
  text: white, font-semibold, text-xs
  border-radius: var(--radius-pill)
```

---

## 12. ダークモード対応

Linear のダークモード哲学を採用。

```css
/* すべての色変数を @media (prefers-color-scheme: dark) で上書き */
/* または [data-theme="dark"] セレクタで制御 */

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg-primary:    #0F0F10;
    --color-bg-secondary:  #1C1C1E;
    --color-bg-tertiary:   #2A2A2D;
    --color-border:        #3A3A3D;
    --color-text-primary:  #F2F2F2;
    --color-text-secondary:#A0A0A8;
    --color-text-muted:    #6B6B75;

    /* ブランドカラーは同じ (明るい背景に映える) */
    /* shadow は暗めに */
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.4);
    --shadow-md: 0 4px 12px rgba(0,0,0,0.5);
    --shadow-lg: 0 10px 30px rgba(0,0,0,0.6);
  }
}
```

---

## 13. アクセシビリティ

- **コントラスト比**: WCAG AA 以上 (テキスト 4.5:1、大テキスト 3:1)
- **フォーカスリング**: `outline: 3px solid var(--color-brand-blue)`, `outline-offset: 2px`
- **アニメーション**: `prefers-reduced-motion` で全アニメーション無効化
- **フォントサイズ**: 本文最低 `1rem (16px)`、学習コンテンツ `1.125rem (18px)` 以上
- **タッチターゲット**: 最小 `44×44px` (モバイル操作)
- **スクリーンリーダー**: バッジ・進捗に `aria-label` 必須

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 14. テクノロジースタック（推奨）

```
フレームワーク:   Next.js 15 (App Router)
スタイリング:     Tailwind CSS v4 + CSS Variables (上記トークン)
アニメーション:   Framer Motion (ゲーミフィケーション) + CSS Transitions (UI)
アイコン:         Lucide React + カスタム学習アイコン
フォント読込:     next/font (Nunito + Inter + M PLUS Rounded 1c)
コンフェッティ:   canvas-confetti (レベルアップ・達成演出)
状態管理:         Zustand (学習進捗・XP・ストリーク)
```

---

## 15. コーディング規約

### 命名規則

```
コンポーネント:  PascalCase (LessonCard, XPBar, AchievementBadge)
CSS変数:         --color-*, --space-*, --radius-*, --font-*, --shadow-*
Tailwindクラス:  ユーティリティ優先、繰り返しは@applyでコンポーネント化
アニメーション:  animate-bounce-in, animate-float-up, animate-shake
```

### ファイル構造

```
src/
├── components/
│   ├── ui/           # 汎用UIコンポーネント (Button, Card, Badge...)
│   ├── game/         # ゲーミフィケーション (XPBar, Streak, Leaderboard...)
│   ├── learn/        # 学習UI (LessonCard, QuestionView, AnswerFeedback...)
│   └── ai/           # AI機能UI (ChatBubble, AIHint, StudyPalAvatar...)
├── styles/
│   ├── tokens.css    # このファイルのCSS変数をすべて定義
│   └── animations.css # keyframesアニメーション定義
└── lib/
    └── gamification/ # XP計算・レベル・ストリークロジック
```

---

## 16. デザインの DO / DON'T

### DO
- ✅ ピル型ボタンを使う（角丸 9999px）
- ✅ 正解・達成には必ずアニメーションフィードバックを付ける
- ✅ プログレスを常に可視化する
- ✅ ダークモード対応を最初から設計する
- ✅ ブランドグリーン (#58CC02) は「成功」専用に使う
- ✅ カードのホバーで軽くリフトアップさせる

### DON'T
- ❌ 角が鋭いボタン・カードは使わない（子どもに不親切）
- ❌ ブランドカラーを装飾目的でランダムに使わない
- ❌ アニメーションを多用しすぎない（集中の妨げ）
- ❌ 10px 以下の文字を学習コンテンツに使わない
- ❌ プログレスを隠した画面を作らない
- ❌ エラー状態をただの赤テキストだけで表現しない（フィードバックアニメーション必須）

---

*このドキュメントは StudyPal プロダクトの唯一のデザイン真実 (Single Source of Truth) です。*
*UI実装前に必ず参照し、新しいパターンを追加する際はここを更新してください。*
