import { Navbar } from "@/components/lp/Navbar";
import { Footer } from "@/components/lp/Footer";

export const metadata = { title: "利用規約 | StudyPal" };

const sections = [
  {
    title: "第1条（適用）",
    body: "本規約は、Prompter（以下「当社」）が提供する学習支援サービス「StudyPal」（以下「本サービス」）の利用に関する条件を定めるものです。ユーザーの皆様には本規約に同意いただいた上で本サービスをご利用いただきます。",
  },
  {
    title: "第2条（利用登録）",
    body: "利用登録はメールアドレスまたはGoogleアカウントによる認証で行います。虚偽の情報による登録は禁止します。13歳未満のお子様が利用する場合は保護者の同意が必要です。",
  },
  {
    title: "第3条（禁止事項）",
    body: "以下の行為を禁止します。\n・法令または公序良俗に違反する行為\n・不正アクセスやサーバーへの過負荷をかける行為\n・他のユーザーへの嫌がらせ・差別的言動\n・本サービスのコンテンツの無断転載・商用利用\n・虚偽情報の登録・なりすまし",
  },
  {
    title: "第4条（有料プランと課金）",
    body: "本サービスにはFree・Pro・Familyの3プランがあります。有料プランはStripeを通じてクレジットカードで決済します。サブスクリプションはStripeポータルからいつでも解約できます。解約後は当該請求期間の終了まで引き続きご利用いただけます。",
  },
  {
    title: "第5条（AI生成コンテンツ）",
    body: "本サービスはAI（Claude）により予想問題・解説・レポートを生成します。AI生成コンテンツは参考情報であり、正確性を保証するものではありません。学習成果の保証は行いません。",
  },
  {
    title: "第6条（個人情報）",
    body: "個人情報の取り扱いについては、別途定めるプライバシーポリシーに従います。",
  },
  {
    title: "第7条（サービスの変更・中断・終了）",
    body: "当社は事前通知なくサービス内容の変更・一時中断・終了を行う場合があります。これによりユーザーに生じた損害について、当社は責任を負いません。",
  },
  {
    title: "第8条（免責事項）",
    body: "当社は本サービスに事実上または法律上の瑕疵がないことを保証しません。当社の債務不履行または不法行為による損害賠償は、直近1ヶ月にユーザーが支払った利用料金を上限とします。",
  },
  {
    title: "第9条（準拠法・管轄）",
    body: "本規約は日本法に準拠します。紛争が生じた場合は、当社所在地を管轄する裁判所を専属的合意管轄とします。",
  },
];

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-16 space-y-8">
        <h1 className="text-2xl font-bold">利用規約</h1>
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
