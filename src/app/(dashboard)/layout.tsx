"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Home,
  BookOpen,
  Calendar,
  Trophy,
  Settings,
  LogOut,
  MessageCircle,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: Home,          label: "ホーム" },
  { href: "/tests",     icon: BookOpen,       label: "テスト" },
  { href: "/calendar",  icon: Calendar,       label: "カレンダー" },
  { href: "/chat",      icon: MessageCircle,  label: "AI質問" },
  { href: "/ranking",   icon: Trophy,         label: "ランキング" },
  { href: "/settings",  icon: Settings,       label: "設定" },
];

function NavItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group"
      style={{
        background: active ? "rgba(28,176,246,0.1)" : "transparent",
        color: active ? "var(--color-brand-blue)" : "var(--color-text-secondary)",
      }}
    >
      <Icon
        size={20}
        className="flex-shrink-0 transition-transform duration-150 group-hover:scale-110"
      />
      <span className="text-sm font-semibold">{label}</span>
      {active && (
        <span
          className="ml-auto w-1.5 h-1.5 rounded-full"
          style={{ background: "var(--color-brand-blue)" }}
        />
      )}
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const initial = currentUser?.displayName?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-bg-secondary)" }}>
      {/* ─── サイドバー（デスクトップ） ─── */}
      <aside
        className="hidden md:flex flex-col w-60 shrink-0 fixed top-0 left-0 h-screen z-40"
        style={{
          background: "var(--color-bg-primary)",
          borderRight: "1px solid var(--color-bg-tertiary)",
        }}
      >
        {/* ロゴ */}
        <div className="px-5 py-5 border-b" style={{ borderColor: "var(--color-bg-tertiary)" }}>
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <span
              className="text-lg font-display font-black"
              style={{ color: "var(--color-brand-green)" }}
            >
              StudyPal
            </span>
          </Link>
        </div>

        {/* ナビ */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={pathname === item.href || pathname.startsWith(item.href + "/")}
            />
          ))}
        </nav>

        {/* ユーザー情報 */}
        <div
          className="p-4 border-t"
          style={{ borderColor: "var(--color-bg-tertiary)" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: "var(--color-brand-blue)" }}
            >
              {initial}
            </div>
            <div className="min-w-0">
              <p
                className="text-sm font-semibold truncate"
                style={{ color: "var(--color-text-primary)" }}
              >
                {currentUser?.displayName ?? "ゲスト"}
              </p>
              <p
                className="text-xs truncate"
                style={{ color: "var(--color-text-muted)" }}
              >
                {currentUser?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 hover:opacity-80"
            style={{
              background: "rgba(255,75,75,0.06)",
              color: "var(--color-error)",
            }}
          >
            <LogOut size={16} />
            ログアウト
          </button>
        </div>
      </aside>

      {/* ─── メインコンテンツ ─── */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen pb-16 md:pb-0">
        <main className="flex-1">{children}</main>
      </div>

      {/* ─── ボトムナビ（モバイル） ─── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 h-16"
        style={{
          background: "var(--color-bg-primary)",
          borderTop: "1px solid var(--color-bg-tertiary)",
        }}
      >
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-150"
              style={{ color: active ? "var(--color-brand-blue)" : "var(--color-text-muted)" }}
            >
              <Icon size={22} />
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
