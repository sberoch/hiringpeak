"use client";

import { useState } from "react";
import { Briefcase, FileText, MessageCircle } from "lucide-react";

import type { Candidate } from "@workspace/shared/types/candidate";
import { cn } from "@workspace/ui/lib/utils";
import { CandidateGeneralTab } from "./candidate-general-tab";
import { CandidateFilesTab } from "./candidate-files-tab";
import { CandidateCommentsTab } from "./candidate-comments-tab";

interface CandidateDetailTabsProps {
  candidate: Candidate;
}

const tabs = [
  { id: "general" as const, label: "Vacantes", icon: Briefcase },
  { id: "files" as const, label: "Archivos", icon: FileText },
  { id: "comments" as const, label: "Comentarios", icon: MessageCircle },
];

export const CandidateDetailTabs = ({
  candidate,
}: CandidateDetailTabsProps) => {
  const [activeTab, setActiveTab] = useState<"general" | "files" | "comments">(
    "general",
  );

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Tab bar */}
      <div className="flex rounded-xl border border-brand-border bg-canvas p-1 mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer",
              activeTab === tab.id
                ? "bg-electric/[0.08] text-electric shadow-[inset_0_1px_2px_rgba(0,102,255,0.08)]"
                : "text-slate-brand hover:text-ink hover:bg-surface/50",
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === "general" && (
          <div className="h-full">
            <CandidateGeneralTab candidate={candidate} />
          </div>
        )}
        {activeTab === "files" && (
          <div className="h-full">
            <CandidateFilesTab candidate={candidate} />
          </div>
        )}
        {activeTab === "comments" && (
          <div className="h-full">
            <CandidateCommentsTab candidate={candidate} />
          </div>
        )}
      </div>
    </div>
  );
};
