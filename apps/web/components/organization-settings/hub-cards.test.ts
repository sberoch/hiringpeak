import { PermissionCode } from "@workspace/shared/enums";

import { organizationSettingsCards } from "./hub-cards";

const titles = (codes: PermissionCode[]) =>
  organizationSettingsCards(codes).map((card) => card.title);

describe("organizationSettingsCards", () => {
  it("shows the Branding card with ORGANIZATION_MANAGE", () => {
    expect(titles([PermissionCode.ORGANIZATION_MANAGE])).toEqual(["Branding"]);
  });

  it("hides the Branding card without ORGANIZATION_MANAGE", () => {
    expect(
      titles([PermissionCode.USER_READ, PermissionCode.ROLE_MANAGE]),
    ).toEqual(["Usuarios", "Roles y permisos", "Registro de auditoría"]);
  });
});
