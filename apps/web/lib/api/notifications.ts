import { PaginatedResponse } from "@workspace/shared/types/api";
import {
  Notification,
  NotificationParams,
  NotificationWithRelations,
} from "@workspace/shared/types/notification";

import api from ".";
import { filtersToSearchParams } from "../utils";

export const NOTIFICATION_API_KEY = "notification";

export async function getAllNotifications(
  params: NotificationParams = {},
) {
  const searchParams = filtersToSearchParams(params);
  const response = await api.get<
    PaginatedResponse<NotificationWithRelations>
  >(`/notification${searchParams}`);
  return response.data;
}

export async function getUnreadNotificationCount() {
  const response = await api.get<{ count: number }>(
    `/notification/unread-count`,
  );
  return response.data;
}

export async function markNotificationRead(id: number) {
  const response = await api.post<Notification>(`/notification/${id}/read`);
  return response.data;
}

export async function dismissNotification(id: number) {
  const response = await api.delete<Notification>(`/notification/${id}`);
  return response.data;
}
