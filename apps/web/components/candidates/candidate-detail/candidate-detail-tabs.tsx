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
      className="w-full mt-4"
    >
      <TabsList className="grid w-fit grid-cols-3 my-4">
        <TabsTrigger value="general" className="flex items-center gap-2 px-6">
          <User className="hidden lg:flex h-4 w-4" />
          Perfil
        </TabsTrigger>
        <TabsTrigger value="files" className="flex items-center gap-2 px-6">
          <FileText className="hidden lg:flex h-4 w-4" />
          Archivos
        </TabsTrigger>
        <TabsTrigger value="comments" className="flex items-center gap-2 px-6">
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
