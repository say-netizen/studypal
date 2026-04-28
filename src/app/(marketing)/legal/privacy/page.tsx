import { Navbar } from "@/components/lp/Navbar";
import { Footer } from "@/components/lp/Footer";

export const metadata = { title: "プライバシーポリシー | StudyPal" };

const sections = [
  {
    title: "1. 収集する情報",
    body: "当社は以下の情報を収集します。\n・アカウント情報（メールアドレス、表示名、学年）\n・学習データ（勉強セッション、テスト情報、目標）\n・利用状況（アクセスログ、機能の利用履歴）\n・お子様のデータ（保護者がFamilyプランで登録した場合）\n・決済情報（Stripeが管理。当社はカード番号を保持しません）",
  },
  {
    title: "2. 情報の利用目的",
    body: "収集した情報は以下の目的で利用します。\n・本サービスの提供・改善\n・AI問題生成・学習レポートの作成\n・保護者への学習状況共有（Familyプラン）\n・サービスに関するお知らせの送信\n・不正利用の防止",
  },
  {
    title: "3. 第三者への提供",
    body: "当社は以下のサービスプロバイダーとデータを共有します。\n・Firebase（Google）: 認証・データベース・ストレージ\n・Anthropic: AI問題生成・チャット（入力内容が処理されます）\n・Stripe: 決済処理\n\n法令に基づく場合を除き、それ以外への第三者提供は行いません。",
  },
  {
    title: "4. 子どものプライバシー",
    body: "13歳未満のお子様のデータは保護者の管理のもとでのみ収集します。保護者はいつでもお子様のデータ確認・削除を要求できます。当社はお子様の個人情報を広告目的で利用しません。",
  },
  {
    title: "5. データの保存・セキュリティ",
    body: "データはFirebase（Google Cloud）のサーバーに保存されます。通信はSSL/TLSで暗号化されています。不要になったデータは合理的な期間内に削除します。",
  },
  {
    title: "6. ユーザーの権利",
    body: "ユーザーは以下の権利を有します。\n・個人情報へのアクセス・修正\n・アカウントおよびデータの削除（アプリ内「退会する」から実行可能）\n・データ処理への異議申し立て\n\nご要望はsay66yeah@gmail.comまでご連絡ください。",
  },
  {
    title: "7. Cookieおよびトラッキング",
    body: "本サービスはFirebaseの認証維持のためにローカルストレージを利用します。広告トラッキングCookieは使用しません。",
  },
  {
    title: "8. 本ポリシーの変更",
    body: "本ポリシーを改定する場合は、本ページにて告知します。重要な変更の場合はメールでお知らせします。",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-16 space-y-8">
        <h1 className="text-2xl font-bold">プライバシーポリシー</h1>
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
