import { Navbar } from "@/components/lp/Navbar";
import { Footer } from "@/components/lp/Footer";

export const metadata = { title: "子どもの安全への取り組み | StudyPal" };

const sections = [
  {
    title: "StudyPalの子ども安全方針",
    body: "StudyPalは小学5年生〜中学3年生を主なユーザーとする学習支援アプリです。子どもたちが安全に学習できる環境を提供するため、以下の方針を定めています。",
  },
  {
    title: "1. 年齢確認と保護者同意",
    body: "13歳未満のお子様が本サービスを利用する場合、保護者のアカウントとの連携（Familyプラン）を推奨します。保護者は子どものアカウント登録・管理・削除を行う権限を持ちます。",
  },
  {
    title: "2. 個人情報の最小化",
    body: "お子様から収集する情報は、学習サービスの提供に必要な最小限にとどめます。氏名は表示名のみで本名は不要です。位置情報・電話番号は収集しません。お子様の個人情報を広告・マーケティング目的で利用しません。",
  },
  {
    title: "3. コンテンツの安全性",
    body: "AIが生成する問題・解説は学習目的に限定されます。不適切なコンテンツが生成された場合は say66yeah@gmail.com へご報告ください。迅速に対応いたします。ユーザー間のコミュニティ機能（ランキング）では表示名のみ公開され、個人を特定できる情報は表示されません。",
  },
  {
    title: "4. 保護者による監視・管理",
    body: "Familyプランでは保護者が以下を確認できます。\n・お子様の学習セッション・勉強時間\n・テスト予定と準備状況\n・週次AI学習レポート\n\n保護者はいつでもお子様のデータ削除を要求できます。",
  },
  {
    title: "5. 外部サービスへのデータ共有",
    body: "AI機能（Anthropic Claude）利用時、入力した学習内容が処理されます。問題生成の際に個人を特定できる情報を含めないようシステムで制御しています。",
  },
  {
    title: "6. 問題の報告",
    body: "子どもの安全に関わる問題を発見した場合は、say66yeah@gmail.com までご連絡ください。24時間以内に初期対応いたします。",
  },
];

export default function ChildSafetyPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-16 space-y-8">
        <h1 className="text-2xl font-bold">子どもの安全への取り組み</h1>
        <p className="text-sm text-gray-500">最終更新日: 2026/4/29</p>

        <div className="space-y-6">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="font-bold text-base mb-2">{s.title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{s.body}</p>
            </section>
          ))}
        </div>

        <p className="text-sm text-gray-500">
          お問い合わせ: say66yeah@gmail.com
        </p>
      </main>
      <Footer />
    </>
  );
}
