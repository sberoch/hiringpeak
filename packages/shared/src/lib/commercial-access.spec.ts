import { hasCommercialAccess } from "./commercial-access";

describe("hasCommercialAccess", () => {
  it("grants access with CRM_READ only", () => {
    expect(hasCommercialAccess(["TASK_READ", "CRM_READ"])).toBe(true);
  });

  it("grants access with CRM_MANAGE only", () => {
    expect(hasCommercialAccess(["CRM_MANAGE"])).toBe(true);
  });

  it("denies access with neither commercial permission", () => {
    expect(
      hasCommercialAccess(["COMPANY_MANAGE", "TASK_READ_ALL", "TASK_MANAGE_ALL"]),
    ).toBe(false);
  });

  it("denies access with no permissions", () => {
    expect(hasCommercialAccess([])).toBe(false);
  });
});
