"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getUser, upsertUser } from "@/lib/firebase/schema";
import { requestNotificationPermission, getFCMToken, saveFCMTokenToFirestore } from "@/lib/notifications/fcm";
import { Bell, BellOff, ArrowLeft } from "lucide-react";
import Link from "next/link";

type NotifSettings = {
  notificationsEnabled: boolean;
  notifyDailyReminder: boolean;
  notifyTestReminder: boolean;
  notifyStreak: boolean;
};

export default function NotificationsSettingsPage() {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<NotifSettings>({
    notificationsEnabled: false,
    notifyDailyReminder: true,
    notifyTestReminder: true,
    notifyStreak: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionStatus(Notification.permission);
    } else {
      setPermissionStatus("unsupported");
    }
    if (!currentUser) return;
    getUser(currentUser.uid).then((u) => {
      if (u) {
        setSettings({
          notificationsEnabled: u.notificationsEnabled ?? false,
          notifyDailyReminder: u.notifyDailyReminder ?? true,
          notifyTestReminder: u.notifyTestReminder ?? true,
          notifyStreak: u.notifyStreak ?? true,
        });
      }
      setLoading(false);
    });
  }, [currentUser]);

  async function handleEnableNotifications() {
    const granted = await requestNotificationPermission();
    if (!granted) {
      alert("通知の許可が必要です。ブラウザの設定から許可してください。");
      return;
    }
    setPermissionStatus("granted");
    const token = await getFCMToken();
    if (token) {
      await saveFCMTokenToFirestore(token);
    }
    await saveSettings({ ...settings, notificationsEnabled: true });
  }

  async function saveSettings(newSettings: NotifSettings) {
    if (!currentUser) return;
    setSaving(true);
    try {
      await upsertUser(currentUser.uid, newSettings);
      setSettings(newSettings);
    } finally {
      setSaving(false);
    }
  }

  async function toggleSetting(key: keyof NotifSettings) {
    const updated = { ...settings, [key]: !settings[key] };
    await saveSettings(updated);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "var(--color-brand-blue)" }} />
      </div>
    );
  }

  const notifItems = [
    { key: "notifyDailyReminder" as const, label: "毎晩のリマインダー", desc: "今日まだ勉強してないときに通知" },
    { key: "notifyTestReminder" as const, label: "テスト前通知", desc: "テスト3日前・前日・当日に通知" },
    { key: "notifyStreak" as const, label: "ストリーク継続通知", desc: "連続学習中に応援メッセージ" },
  ];

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}
        >
          <ArrowLeft size={18} style={{ color: "var(--color-text-secondary)" }} />
        </Link>
        <h1 className="text-xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
          通知設定
        </h1>
      </div>

      {/* メイン通知トグル */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: settings.notificationsEnabled ? "rgba(28,176,246,0.12)" : "var(--color-bg-tertiary)" }}
            >
              {settings.notificationsEnabled
                ? <Bell size={20} style={{ color: "var(--color-brand-blue)" }} />
                : <BellOff size={20} style={{ color: "var(--color-text-muted)" }} />}
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>プッシュ通知</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {permissionStatus === "denied" ? "ブラウザで通知が拒否されています"
                  : permissionStatus === "unsupported" ? "このブラウザは非対応です"
                  : settings.notificationsEnabled ? "有効"
                  : "無効"}
              </p>
            </div>
          </div>

          {permissionStatus !== "denied" && permissionStatus !== "unsupported" && (
            <button
              onClick={settings.notificationsEnabled
                ? () => saveSettings({ ...settings, notificationsEnabled: false })
                : handleEnableNotifications}
              disabled={saving}
              className="relative w-12 h-6 rounded-full transition-all"
              style={{
                background: settings.notificationsEnabled ? "var(--color-brand-blue)" : "var(--color-bg-tertiary)",
              }}
            >
              <div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                style={{ left: settings.notificationsEnabled ? "26px" : "2px" }}
              />
            </button>
          )}
        </div>
      </div>

      {/* 通知種別 */}
      {settings.notificationsEnabled && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)", boxShadow: "var(--shadow-card)" }}
        >
          {notifItems.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between px-5 py-4 border-b last:border-b-0"
              style={{ borderColor: "var(--color-bg-tertiary)" }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{item.label}</p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{item.desc}</p>
              </div>
              <button
                onClick={() => toggleSetting(item.key)}
                disabled={saving}
                className="relative w-10 h-5 rounded-full transition-all"
                style={{ background: settings[item.key] ? "var(--color-brand-blue)" : "var(--color-bg-tertiary)" }}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                  style={{ left: settings[item.key] ? "22px" : "2px" }}
                />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
        通知はDuolingo風のやさしいリマインダーです。
        <br />
        スパムは送りません。
      </p>
    </div>
  );
}
