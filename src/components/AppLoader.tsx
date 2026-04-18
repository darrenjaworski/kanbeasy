import { useEffect, useState } from "react";
import { openDatabase } from "../utils/db";
import { SKELETON_DELAY_MS } from "../constants/behavior";

export function AppLoader({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [ready, setReady] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(true), SKELETON_DELAY_MS);
    void openDatabase().then(() => {
      clearTimeout(timer);
      setReady(true);
    });
    return () => clearTimeout(timer);
  }, []);

  if (!ready) {
    return showSkeleton ? <AppSkeleton /> : null;
  }
  return children;
}

function AppSkeleton() {
  return (
    <div
      className="flex h-screen items-center justify-center"
      style={{ backgroundColor: "var(--color-bg, #f8fafc)" }}
    >
      <div className="animate-pulse text-center">
        <div
          className="mx-auto mb-4 h-8 w-32 rounded"
          style={{ backgroundColor: "var(--color-surface, #e2e8f0)" }}
        />
        <div
          className="mx-auto h-4 w-48 rounded"
          style={{ backgroundColor: "var(--color-surface, #e2e8f0)" }}
        />
      </div>
    </div>
  );
}
