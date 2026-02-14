import { redirect } from "next/navigation";

export default function UsersPage() {
  redirect("/organization-settings/users");
}
