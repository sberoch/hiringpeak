"use client";

interface AiVacancyPageLayoutProps {
  historySidebar: React.ReactNode;
  mobileHistory?: React.ReactNode;
  children: React.ReactNode;
}

/** Shared shell: history on the left (desktop), main content on the right. */
export function AiVacancyPageLayout({
  historySidebar,
  mobileHistory,
  children,
}: AiVacancyPageLayoutProps) {
  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      <div className="hidden h-full shrink-0 lg:flex">{historySidebar}</div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
        {mobileHistory ? (
          <div className="shrink-0 lg:hidden">{mobileHistory}</div>
        ) : null}
      </div>
    </div>
  );
}
