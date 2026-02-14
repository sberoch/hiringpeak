export type MePermissionsResponse = {
  roleId: number | null;
  roleName: string | null;
  permissionCodes: string[];
};

export async function getMePermissions(
  accessToken: string
): Promise<MePermissionsResponse> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${base}/auth/me/permissions`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch permissions");
  return res.json();
}
