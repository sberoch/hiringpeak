"use client";

import { useState } from "react";
import { FileText, MessageCircle, User } from "lucide-react";

import type { Candidate } from "@workspace/shared/types/candidate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { CandidateGeneralTab } from "./candidate-general-tab";
import { CandidateFilesTab } from "./candidate-files-tab";
import { CandidateCommentsTab } from "./candidate-comments-tab";

interface CandidateDetailTabsProps {
  candidate: Candidate;
}

const tabTriggerCn =
  "flex items-center gap-2 px-6 rounded-lg data-[state=active]:bg-electric/[0.08] data-[state=active]:text-electric data-[state=active]:shadow-[inset_0_1px_2px_rgba(0,102,255,0.08)] transition-all ease-[cubic-bezier(0.16,1,0.3,1)]";

export const CandidateDetailTabs = ({ candidate }: CandidateDetailTabsProps) => {
  const [activeTab, setActiveTab] = useState<"general" | "files" | "comments">(
    "general"
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value: string) => {
        if (value === "general" || value === "files" || value === "comments") {
          setActiveTab(value);
        }
      }}
      className="w-full"
    >
      <TabsList className="grid w-fit grid-cols-3 rounded-xl border border-brand-border bg-canvas p-1">
        <TabsTrigger value="general" className={tabTriggerCn}>
          <User className="hidden lg:flex h-4 w-4" />
          Perfil
        </TabsTrigger>
        <TabsTrigger value="files" className={tabTriggerCn}>
          <FileText className="hidden lg:flex h-4 w-4" />
          Archivos
        </TabsTrigger>
        <TabsTrigger value="comments" className={tabTriggerCn}>
          <MessageCircle className="hidden lg:flex h-4 w-4" />
          Comentarios
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <CandidateGeneralTab candidate={candidate} />
      </TabsContent>

      <TabsContent value="files">
        <CandidateFilesTab candidate={candidate} />
      </TabsContent>

      <TabsContent value="comments">
        <CandidateCommentsTab candidate={candidate} />
      </TabsContent>
    </Tabs>
  );
};
