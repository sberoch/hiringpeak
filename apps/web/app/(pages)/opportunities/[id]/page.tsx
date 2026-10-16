"use client";

import { use } from "react";

import { OpportunityDetail } from "@/components/opportunities/opportunity-detail";
import { CommercialOnly } from "@/components/opportunities/commercial-access";

export default function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <CommercialOnly>
      <OpportunityDetail id={id} />
    </CommercialOnly>
  );
}
