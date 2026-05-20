import { PaginatedResponse } from "@workspace/shared/types/api";
import {
  BaseTask,
  Task,
  TaskParams,
  TaskWithRelations,
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
