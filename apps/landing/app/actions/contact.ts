"use server";

export async function submitContact(formData: FormData): Promise<void> {
  const name = formData.get("name") as string | null;
  const company = formData.get("company") as string | null;
  const email = formData.get("email") as string | null;

  if (!name?.trim() || !email?.trim()) {
    throw new Error("Nombre y email son requeridos.");
  }

  // TODO: integrate with your backend or email service
  console.log("Contact demo request:", { name, company, email });
}
