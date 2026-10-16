import type { PaginationFilters } from "./api";
import type { User } from "./user";

export type BaseComment = {
  candidateId: number;
  userId: number;
  comment: string;
};

export type Comment = BaseComment & {
  id: number;
  createdAt: Date;
  user?: User;
};

export type CommentFilters = PaginationFilters & {
  candidateId?: number;
  userId?: number;
};

export type CommentParams = CommentFilters;
