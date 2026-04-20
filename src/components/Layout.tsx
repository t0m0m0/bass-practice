import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { tabPresets } from "../data/tabPresets";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  const isPractice = location.pathname.startsWith("/practice/tab/");
  const practicePreset = isPractice
    ? tabPresets.find((p) => p.id === params.presetId)
    : undefined;

  const title = isPractice
    ? (practicePreset?.name ?? "練習")
    : location.pathname === "/tuner"
      ? "チューナー"
      : "Bass Practice";

  const currentTab = location.pathname === "/tuner" ? "tuner" : "home";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        maxWidth: 480,
        margin: "0 auto",
        position: "relative",
        background: "var(--md-background)",
      }}
    >
      <TopAppBar
        title={title}
        onBack={isPractice ? () => navigate("/") : undefined}
      />

      <main
        key={location.pathname}
        className="page-enter"
        style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}
      >
        <Outlet />
      </main>

      {!isPractice && (
        <BottomNav
          current={currentTab}
          onChange={(id) => navigate(id === "home" ? "/" : "/tuner")}
        />
      )}
    </div>
  );
}

interface TopAppBarProps {
  title: string;
  onBack?: () => void;
}

function TopAppBar({ title, onBack }: TopAppBarProps) {
  return (
    <header
      style={{
        background: "var(--md-surface-container)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 4px",
        height: 64,
        flexShrink: 0,
        boxShadow: "0 1px 0 var(--md-outline-variant)",
      }}
    >
      {onBack ? (
        <button
          onClick={onBack}
          aria-label="戻る"
          style={{
            background: "none",
            border: "none",
            color: "var(--md-on-surface)",
            width: 48,
            height: 48,
            borderRadius: 24,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          ←
        </button>
      ) : (
        <div style={{ width: 12 }} />
      )}
      <h1
        style={{
          flex: 1,
          margin: 0,
          font: "500 22px/1 Roboto, sans-serif",
          color: "var(--md-on-surface)",
          letterSpacing: 0,
        }}
      >
        {title}
      </h1>
    </header>
  );
}

interface BottomNavProps {
  current: "home" | "tuner";
  onChange: (id: "home" | "tuner") => void;
}

function BottomNav({ current, onChange }: BottomNavProps) {
  const items: { id: "home" | "tuner"; label: string; icon: string }[] = [
    { id: "home", label: "ホーム", icon: "⊟" },
    { id: "tuner", label: "チューナー", icon: "♩" },
  ];
  return (
    <nav
      style={{
        background: "var(--md-surface-container)",
        display: "flex",
        alignItems: "stretch",
        borderTop: "1px solid var(--md-outline-variant)",
        flexShrink: 0,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {items.map((item) => {
        const active = current === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              padding: "12px 0 16px",
              color: active
                ? "var(--md-on-secondary-container)"
                : "var(--md-on-surface-variant)",
              transition: "color 0.2s",
            }}
          >
            <div
              style={{
                background: active
                  ? "var(--md-secondary-container)"
                  : "transparent",
                borderRadius: 16,
                padding: "4px 20px",
                transition: "background 0.2s",
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              {item.icon}
            </div>
            <span
              style={{
                font: `${active ? "600" : "400"} 12px/1 Roboto, sans-serif`,
                letterSpacing: 0.5,
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
