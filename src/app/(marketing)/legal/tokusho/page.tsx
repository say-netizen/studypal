import { Navbar } from "@/components/lp/Navbar";
import { Footer } from "@/components/lp/Footer";

export const metadata = { title: "特定商取引法に基づく表記 | StudyPal" };

export default function TokushoPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-16 space-y-8">
        <h1 className="text-2xl font-bold">特定商取引法に基づく表記</h1>
        <p className="text-sm text-gray-500">最終更新日: 2026/4/29</p>

        <table className="w-full text-sm border-collapse">
          <tbody>
            {[
              ["販売業者", "Prompter"],
              ["運営責任者", "Seiya Miyata"],
              ["所在地", "メールにてお問い合わせください"],
              ["電話番号", "メールにてお問い合わせください"],
              ["メールアドレス", "say66yeah@gmail.com"],
              ["ウェブサイト", "https://studypal-chi.vercel.app"],
              ["販売価格", "各プランページに表示の価格（消費税込み）"],
              ["商品代金以外の費用", "なし（通信費はお客様負担）"],
              ["支払方法", "クレジットカード・デビットカード・Google Pay・Apple Pay（Stripe決済）"],
              ["支払時期", "注文確定時に即時決済"],
              ["サービスの提供時期", "決済完了後、即時にご利用いただけます"],
              ["返品・キャンセル", "デジタルサービスの性質上、購入完了後の返品・キャンセルはお受けできません。ただし、サービス内容と著しく異なる場合はご相談ください。"],
              ["動作環境", "インターネット接続環境が必要です。推奨ブラウザ: Chrome / Safari / Firefox 最新版"],
            ].map(([label, value]) => (
              <tr key={label} className="border-b border-gray-200">
                <td className="py-3 pr-4 font-semibold text-gray-700 whitespace-nowrap align-top w-40">{label}</td>
                <td className="py-3 text-gray-600">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="text-sm text-gray-500">
          ご不明な点がございましたら、say66yeah@gmail.com までお問い合わせください。通常2営業日以内にご返答いたします。
        </p>
      </main>
      <Footer />
    </>
  );
}
