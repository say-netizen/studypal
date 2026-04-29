"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true); // 初期はhide

  useEffect(() => {
    if (localStorage.getItem("pwa_install_dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setDismissed(false);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setDismissed(true);
      localStorage.setItem("pwa_install_dismissed", "1");
    }
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem("pwa_install_dismissed", "1");
  }

  if (dismissed || !prompt) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl p-4 flex items-center gap-3 shadow-xl"
      style={{
        background: "var(--color-bg-primary)",
        border: "2px solid var(--color-brand-blue)",
        boxShadow: "0 8px 30px rgba(28,176,246,0.25)",
        maxWidth: "420px",
        margin: "0 auto",
      }}
    >
      <span style={{ fontSize: "28px", flexShrink: 0 }}>📲</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
          ホーム画面に追加しよう！
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          アプリとして使うとより快適に
        </p>
      </div>
      <button
        onClick={handleInstall}
        className="flex items-center gap-1.5 px-3 py-2 rounded-pill text-xs font-bold text-white flex-shrink-0"
        style={{ background: "var(--color-brand-blue)" }}
      >
        <Download size={13} />
        追加
      </button>
      <button onClick={handleDismiss} className="flex-shrink-0 p-1 hover:opacity-60">
        <X size={16} style={{ color: "var(--color-text-muted)" }} />
      </button>
    </div>
  );
}
