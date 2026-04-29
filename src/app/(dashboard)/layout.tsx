"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { getUser } from "@/lib/firebase/schema";
import {
  Home,
  Timer,
  Calendar,
  Trophy,
  Settings,
  LogOut,
  GraduationCap,
  Crown,
  Target,
  Users,
} from "lucide-react";
import { LogoIcon } from "@/components/ui/Logo";

const STUDENT_NAV = [
  { href: "/dashboard",  icon: Home,           label: "ホーム" },
  { href: "/study",      icon: Timer,          label: "タイマー" },
  { href: "/calendar",   icon: Calendar,       label: "カレンダー" },
  { href: "/goals",      icon: Target,         label: "目標" },
  { href: "/chat",       icon: GraduationCap,  label: "AI塾講師" },
  { href: "/ranking",    icon: Trophy,         label: "ランキング" },
  { href: "/settings",   icon: Settings,       label: "マイページ" },
];

const PARENT_NAV = [
  { href: "/parent",          icon: Home,     label: "ホーム" },
  { href: "/settings/family", icon: Users,    label: "子ども管理" },
  { href: "/settings",        icon: Settings, label: "マイページ" },
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
        background: active ? "var(--color-brand-primary-soft)" : "transparent",
        color: active ? "var(--color-brand-primary)" : "var(--color-text-secondary)",
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
          style={{ background: "var(--color-brand-primary)" }}
        />
      )}
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, loading, logout } = useAuth();
  const router = useRouter();
  const [userRole, setUserRole] = useState<"student" | "parent" | null>(null);

  // 未ログインのリダイレクト
  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace("/login?redirect=" + encodeURIComponent(pathname));
    }
  }, [loading, currentUser, pathname, router]);

  // ユーザーのロールを取得
  useEffect(() => {
    if (!currentUser) return;
    getUser(currentUser.uid)
      .then((u) => setUserRole(u?.role ?? "student"))
      .catch(() => setUserRole("student"));
  }, [currentUser]);

  // ロールに応じたルーティング修正
  useEffect(() => {
    if (!userRole) return;
    if (userRole === "parent" && pathname === "/dashboard") {
      router.replace("/parent");
    } else if (userRole === "student" && pathname === "/parent") {
      router.replace("/dashboard");
    }
  }, [userRole, pathname, router]);

  if (loading || (!currentUser && !loading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "var(--color-brand-blue)" }}
        />
      </div>
    );
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const navItems = userRole === "parent" ? PARENT_NAV : STUDENT_NAV;
  const homeHref = userRole === "parent" ? "/parent" : "/dashboard";
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
          <Link href={homeHref} className="flex items-center gap-2">
            <div style={{ width: 32, height: 32, background: "var(--color-brand-cream)", border: "2px solid var(--color-brand-tan)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LogoIcon size={20} />
            </div>
            <span
              className="text-lg font-display font-black"
              style={{ color: "var(--color-brand-primary)" }}
            >
              StudyPal
            </span>
          </Link>
        </div>

        {/* ナビ */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={pathname === item.href || pathname.startsWith(item.href + "/")}
            />
          ))}
        </nav>

        {/* アップグレードCTA (生徒のみ) */}
        {userRole !== "parent" && (
          <div className="px-3 pb-2">
            <Link
              href="/settings/billing"
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, rgba(155,93,229,0.15), rgba(28,176,246,0.15))",
                border: "1px solid rgba(155,93,229,0.3)",
                color: "var(--color-brand-purple)",
              }}
            >
              <Crown size={15} />
              Proにアップグレード
            </Link>
          </div>
        )}

        {/* ユーザー情報 */}
        <div
          className="p-4 border-t"
          style={{ borderColor: "var(--color-bg-tertiary)" }}
        >
          <Link
            href={currentUser ? `/profile/${currentUser.uid}` : "#"}
            className="flex items-center gap-3 mb-3 rounded-xl px-2 py-1.5 -mx-2 transition-all hover:opacity-70"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: "var(--color-brand-primary)" }}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-semibold truncate"
                style={{ color: "var(--color-text-primary)" }}
              >
                {currentUser?.displayName ?? "ゲスト"}
              </p>
              <p
                className="text-xs truncate"
                style={{ color: "var(--color-brand-primary)" }}
              >
                プロフィールを見る →
              </p>
            </div>
          </Link>
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
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-150"
              style={{ color: active ? "var(--color-brand-primary)" : "var(--color-text-muted)" }}
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
