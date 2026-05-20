import { PaginatedResponse } from "@workspace/shared/types/api";
import {
  BaseTask,
  Task,
  TaskParams,
  TaskWithRelations,
  UpdateTaskPayload,
} from "@workspace/shared/types/task";

import api from ".";
import { filtersToSearchParams } from "../utils";

export const TASK_API_KEY = "task";

export async function getAllTasks(params: TaskParams = {}) {
  const searchParams = filtersToSearchParams(params);
  const response = await api.get<PaginatedResponse<TaskWithRelations>>(
    `/task${searchParams}`
  );
  return response.data;
}

export async function createTask(task: BaseTask) {
  const response = await api.post<Task>("/task", task);
  return response.data;
}

export async function updateTask(id: number, patch: UpdateTaskPayload) {
  const response = await api.patch<Task>(`/task/${id}`, patch);
  return response.data;
}

export async function completeTask(id: number) {
  const response = await api.post<Task>(`/task/${id}/complete`);
  return response.data;
}

export async function reopenTask(id: number) {
  const response = await api.post<Task>(`/task/${id}/reopen`);
  return response.data;
}

export async function deleteTask(id: number) {
  const response = await api.delete<Task>(`/task/${id}`);
  return response.data;
}
