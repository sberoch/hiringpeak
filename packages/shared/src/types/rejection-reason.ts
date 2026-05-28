import type { PaginationFilters } from "./api.js";

export type BaseRejectionReason = {
  name: string;
  sort: number;
};

export type RejectionReason = BaseRejectionReason & {
  id: number;
};

export type RejectionReasonParams = PaginationFilters & {
  name?: string;
};

export type CreateRejectionReasonDto = Partial<BaseRejectionReason> &
  Pick<BaseRejectionReason, "name">;
export type UpdateRejectionReasonDto = Partial<BaseRejectionReason>;
