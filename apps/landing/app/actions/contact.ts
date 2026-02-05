"use server";

export async function submitContact(formData: FormData) {
  const name = formData.get("name") as string | null;
  const company = formData.get("company") as string | null;
  const email = formData.get("email") as string | null;

  // Placeholder: in production you would send to CRM, email, or API
  if (!name?.trim() || !email?.trim()) {
    return { ok: false, error: "Nombre y email son requeridos." };
  }

  // TODO: integrate with your backend or email service
  console.log("Contact demo request:", { name, company, email });

  return { ok: true };
}
