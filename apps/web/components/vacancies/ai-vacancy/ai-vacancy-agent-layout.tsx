"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable";

const WORKSPACE_LAYOUT_STORAGE_ID = "ai-vacancy-workspace-v1";

const PROMPT_PANE_CLASS =
  "h-full min-h-0 overflow-y-auto overscroll-contain border-b border-brand-border bg-surface lg:border-b-0 lg:border-r";

const REVIEW_PANE_CLASS =
  "h-full min-h-0 overflow-y-auto overscroll-contain bg-canvas";

const RESIZE_HANDLE_CLASS =
  "z-10 w-px cursor-col-resize bg-brand-border transition-colors after:w-2 hover:bg-electric/30 focus-visible:ring-electric/30";

interface AiVacancyAgentLayoutProps {
  historySidebar: React.ReactNode;
  promptPane: React.ReactNode;
  reviewPane: React.ReactNode;
}

export function AiVacancyAgentLayout({
  historySidebar,
  promptPane,
  reviewPane,
}: AiVacancyAgentLayoutProps) {
  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      <div className="hidden shrink-0 lg:flex">{historySidebar}</div>
      <div className="h-full min-h-0 min-w-0 flex-1 overflow-hidden">
      {/* Mobile: fixed stacked split, no drag handle */}
      <div className="grid h-full min-h-0 grid-cols-1 grid-rows-[minmax(0,38%)_minmax(0,1fr)] overflow-hidden lg:hidden">
        <aside className={PROMPT_PANE_CLASS}>{promptPane}</aside>
        <div className={REVIEW_PANE_CLASS}>{reviewPane}</div>
      </div>

      {/* Desktop: resizable horizontal split with persisted ratio */}
      <ResizablePanelGroup
        direction="horizontal"
        autoSaveId={WORKSPACE_LAYOUT_STORAGE_ID}
        className="hidden h-full min-h-0 lg:flex"
      >
        <ResizablePanel defaultSize={38} minSize={22} maxSize={55}>
          <aside className={PROMPT_PANE_CLASS}>{promptPane}</aside>
        </ResizablePanel>

        <ResizableHandle
          withHandle
          aria-label="Redimensionar paneles"
          className={RESIZE_HANDLE_CLASS}
        />

        <ResizablePanel minSize={35}>
          <div className={REVIEW_PANE_CLASS}>{reviewPane}</div>
        </ResizablePanel>
      </ResizablePanelGroup>
      </div>
    </div>
  );
}
