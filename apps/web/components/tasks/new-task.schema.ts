import { z } from "zod";

export const newTaskFormSchema = z.object({
  title: z.string().min(1, { message: "El título es obligatorio." }),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato esperado YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
  assignedTo: z
    .number({ message: "Selecciona un responsable." })
    .int()
    .positive(),
});

export type NewTaskFormSchema = z.infer<typeof newTaskFormSchema>;
