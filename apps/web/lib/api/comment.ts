import { PaginatedResponse } from "@workspace/shared/types/api";
import {
  BaseComment,
  Comment,
  CommentParams,
} from "@workspace/shared/types/comment";

import api from ".";
import { filtersToSearchParams } from "../utils";

export const COMMENT_API_KEY = "comment";

export async function getAllComments(params: CommentParams) {
  const searchParams = filtersToSearchParams(params);
  const response = await api.get<PaginatedResponse<Comment>>(
    `/comment${searchParams}`
  );
  return response.data;
}

export async function getCommentById(id: number) {
  const response = await api.get<Comment>(`/comment/${id}`);
  return response.data;
}

export async function createComment(comment: BaseComment) {
  const response = await api.post<Comment>("/comment", comment);
  return response.data;
}

export async function updateComment(
  id: Comment["id"],
  comment: Partial<BaseComment>
) {
  const response = await api.patch<Comment>(`/comment/${id}`, comment);
  return response.data;
}

export async function deleteComment(id: Comment["id"], userId: number) {
  const response = await api.delete(`/comment/${id}`, {
    data: { userId },
  });
  return response.data;
}
