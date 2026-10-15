import { OpportunitiesPage } from "@/components/opportunities/opportunities-page";
import { CommercialOnly } from "@/components/opportunities/opportunity-ui";

export default function OpportunitiesNextPage() {
  return (
    <div className="flex w-full flex-col">
      <CommercialOnly>
        <OpportunitiesPage />
      </CommercialOnly>
    </div>
  );
}
