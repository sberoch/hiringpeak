import { Metadata } from "next";

import { TasksPage } from "@/components/tasks/tasks-page";

export const metadata: Metadata = {
  title: "Tareas",
};

export default function TareasNextPage() {
  return (
    <div className="flex flex-col">
      <TasksPage />
    </div>
  );
}
