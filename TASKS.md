# StudyPal — Task Tracking

> Last updated: 2026-04-17
> Phase 1〜8 全完了

---

## Phase 1: Next.js セットアップ ✅

| ID | タスク | ステータス |
|----|--------|----------|
| T-01 | `public/lp-original.html` にindex.htmlをバックアップ | ✅ 完了 |
| T-02 | Next.js 14 手動セットアップ (package.json, config等) | ✅ 完了 |
| T-03 | 追加パッケージ定義 | ✅ 完了 |
| T-04 | `tailwind.config.ts` にCLAUDE.mdデザイントークン設定 | ✅ 完了 |
| T-05 | `src/styles/tokens.css` + `animations.css` 作成 | ✅ 完了 |
| T-06 | Root layout + next/font (Nunito, Inter) | ✅ 完了 |
| T-07 | `ARCHITECTURE.md` 作成 | ✅ 完了 |
| T-08 | `npm install` 実行 | ✅ 完了 |

---

## Phase 2: 外部サービス接続・認証 ✅

| ID | タスク | ステータス |
|----|--------|----------|
| P2-01 | `.env.local` 作成（Firebase/Anthropic/Stripe） | ✅ 完了 |
| P2-02 | `src/lib/firebase/client.ts` — Firebase初期化 (SSR安全) | ✅ 完了 |
| P2-03 | `src/lib/firebase/admin.ts` — Firebase Admin SDK | ✅ 完了 |
| P2-04 | `src/lib/firebase/schema.ts` — Firestoreスキーマ + CRUD | ✅ 完了 |
| P2-05 | `src/lib/auth/AuthContext.tsx` — useAuth hook | ✅ 完了 |
| P2-06 | `src/middleware.ts` — 認証ルーティング保護 | ✅ 完了 |
| P2-07 | `src/app/(auth)/login/page.tsx` — ログインUI | ✅ 完了 |
| P2-08 | `src/app/(auth)/register/page.tsx` — 登録UI + 学年選択 | ✅ 完了 |
| P2-09 | `src/app/(dashboard)/layout.tsx` — サイドバー+ボトムナビ | ✅ 完了 |
| P2-10 | `src/app/(dashboard)/dashboard/page.tsx` — ダッシュボード | ✅ 完了 |
| P2-11 | `next build` ビルド成功 | ✅ 完了 |
| P2-12 | `npm run dev` 動作確認 | ✅ 完了 |

### 実装した主な機能
- Firebase Client SDK: SSR安全なブラウザ専用初期化（`next/dynamic ssr:false`）
- Firebase Admin SDK: サーバーサイド Firestore/Auth
- Firestore スキーマ: users / tests / questions / schedules / rankings
- Google + メール/パスワード ログイン
- 学年選択付き新規登録（Firestoreユーザードキュメント自動作成）
- ダッシュボード: XPバー・レベル・ストリーク・テストカウントダウン・今日のスケジュール

---

## Phase 3: LP コンポーネント化 ✅

| ID | タスク | ステータス | 優先度 |
|----|--------|----------|--------|
| T-09 | `HeroSection.tsx` — Hero全体（アニメーション含む） | ✅ 完了 | 高 |
| T-10 | `ProblemSection.tsx` — 課題訴求 | ✅ 完了 | 高 |
| T-11 | `FeaturesSection.tsx` — 3機能紹介 | ✅ 完了 | 高 |
| T-12 | `SocialProofSection.tsx` — 利用者の声・実績 | ✅ 完了 | 中 |
| T-13 | `PricingSection.tsx` — 料金プラン3種 | ✅ 完了 | 中 |
| T-14 | `FaqSection.tsx` — FAQ アコーディオン | ✅ 完了 | 中 |
| T-15 | `CtaSection.tsx` — メール登録フォーム | ✅ 完了 | 中 |
| T-16 | `Footer.tsx` | ✅ 完了 | 低 |
| T-17 | `Navbar.tsx` — スクロール連動ナビ | ✅ 完了 | 低 |

### 実装した主な機能 (Phase 3)
- LP全セクションをNext.jsコンポーネントに移植（`src/components/lp/`）
- lp-original.htmlの内容も同時に修正（架空数字削除・コピー変更・機能説明更新・料金プラン変更）
- Navbar: スクロール連動シャドウ・ハンバーガーメニュー・スムーズアニメーション
- HeroSection: グラデーション見出し・モックアップUI（AI生成・ランキング・カレンダー）・リリース情報バッジ
- FeaturesSection: ダークBG・3機能（AI予想問題/スマートカレンダー/ランキング）・スクリーンモックアップ
- PricingSection: 3プランカード・featuredスケール・ホバーアニメーション
- FaqSection: アコーディオン開閉（React state）
- CtaSection: メール先行登録フォーム・送信完了アニメーション

---

## Phase 4: UI コンポーネント ✅

| ID | タスク | ステータス | 優先度 |
|----|--------|----------|--------|
| T-18 | `Button.tsx` — variant: primary/success/ghost/ghost-white | ✅ 完了 | 高 |
| T-19 | `Card.tsx` — default/achievement/hover variants | ✅ 完了 | 高 |
| T-20 | `Badge.tsx` — in-progress/completed/locked/new/ai | ✅ 完了 | 中 |
| T-21 | `ProgressBar.tsx` — XP bar バウンスアニメーション | ✅ 完了 | 中 |
| T-22 | `Avatar.tsx` — name/src/color対応・ハッシュグラデーション | ✅ 完了 | 低 |

---

## Phase 5: ゲーミフィケーション基盤 ✅

| ID | タスク | ステータス | 優先度 |
|----|--------|----------|--------|
| T-23 | `XpBar.tsx` — レベル帯カラー・バウンスアニメーション | ✅ 完了 | 高 |
| T-24 | `StreakBadge.tsx` — 炎パルス/danger shake アニメーション | ✅ 完了 | 高 |
| T-25 | `LevelUpModal.tsx` — canvas-confetti + バウンス | ✅ 完了 | 中 |
| T-26 | `BadgeUnlockToast.tsx` — フェードイン・自動消去 | ✅ 完了 | 中 |
| T-27 | `RankingCard.tsx` — メダル・YOU ハイライト・空状態 | ✅ 完了 | 低 |

---

## Phase 6: テスト・学習機能 ✅

| ID | タスク | ステータス | 優先度 |
|----|--------|----------|--------|
| T-28 | テスト登録フォーム `/tests/new` | ✅ 完了 | 高 |
| T-29 | テスト詳細 `/tests/[id]` | ✅ 完了 | 高 |
| T-30 | AI問題生成 API `/api/generate-questions` + `lib/usage/counter.ts` | ✅ 完了 | 高 |
| T-31 | 問題解答UI `/tests/[id]/quiz` | ✅ 完了 | 高 |
| T-32 | 結果・解説表示 `/tests/[id]/result` | ✅ 完了 | 高 |

### 実装した主な機能 (Phase 6)
- テスト登録: 科目選択・日付・範囲・Firebase Storage ファイルアップロード (最大5件10MB)
- テスト詳細: カウントダウン・問題生成ボタン・Free/Pro使用回数バッジ・問題一覧
- AI問題生成: Claude Haiku で10問 (四択3・穴埋め4・記述3)、画像OCR対応、Free月3回制限
- 使用回数管理: `users/{uid}/usage/{YYYY-MM}` で月次集計
- 問題解答UI: 1問ずつ・アニメーション正誤判定・XP加算 (+10/+20)・ストリークバッジ
- 結果ページ: SVGスコアリング・全問解説アコーディオン・間違えた問題フィルター・ランキングリンク

---

## Phase 7: カレンダー・ランキング ✅

| ID | タスク | ステータス | 優先度 |
|----|--------|----------|--------|
| T-33 | カレンダーUI `/calendar` | ✅ 完了 | 中 |
| T-34 | スケジュール追加フォーム | ✅ 完了 | 中 |
| T-35 | ランキングページ `/ranking` | ✅ 完了 | 中 |

### 実装した主な機能 (Phase 7)
- カレンダー: 月間ビュー・イベント色分けドット・日付クリックで詳細・イベント削除
- スケジュール追加: 種別選択 (勉強/部活/予定/テスト)・日付・時間・科目・Firestore保存
- AI学習計画: `/api/schedule` POST — Proプラン専用・Claude Haikuで空き時間から最適プラン生成
- スケジュール取得: `/api/schedule` GET — 認証済みユーザーの日付範囲フィルター対応
- ランキング: 週間/月間タブ・科目別フィルター・上位3位メダル・自分の行ハイライト・スコア計算表示
- ランキングAPI: `/api/ranking` GET/POST — ISO週番号ベース集計・週次＋月次同時更新

---

## Phase 8: Stripe 決済 ✅

| ID | タスク | ステータス | 優先度 |
|----|--------|----------|--------|
| T-36 | Stripe Checkout セッション作成 | ✅ 完了 | 低 |
| T-37 | Webhook ハンドラー (plan更新) | ✅ 完了 | 低 |
| T-38 | 設定ページ `/settings` `/settings/billing` | ✅ 完了 | 低 |

### 実装した主な機能 (Phase 8)
- `/api/stripe/create-checkout`: Pro/Familyプランのチェックアウトセッション作成・Stripe Customer ID管理
- `/api/stripe/webhook`: checkout.session.completed / subscription更新 / 削除 / invoice.paid 対応
- `/settings/billing`: プランアップグレードUI

---

## 凡例

| 記号 | 意味 |
|------|------|
| ✅ | 完了 |
| 🔄 | 進行中 |
| ⏳ | 未着手 |
| ❌ | ブロック中 |

---

## 次のアクション

```bash
npm run dev  # http://localhost:3001
```

全フェーズ完了 🎉 次のアクション: デプロイ (Vercel) / Firebase本番設定 / Stripe本番Price ID設定
