import { canManageContacts, contactForViewer } from "./contact-access";

describe("canManageContacts", () => {
  it("allows a user with COMPANY_MANAGE", () => {
    expect(canManageContacts(["COMPANY_READ", "COMPANY_MANAGE"])).toBe(true);
  });

  it("allows a user with CRM_MANAGE", () => {
    expect(canManageContacts(["CRM_READ", "CRM_MANAGE"])).toBe(true);
  });

  it("denies a CRM_READ-only user", () => {
    expect(canManageContacts(["COMPANY_READ", "CRM_READ"])).toBe(false);
  });

  it("denies a recruiter with neither permission", () => {
    expect(canManageContacts(["COMPANY_READ", "VACANCY_MANAGE"])).toBe(false);
  });
});

describe("contactForViewer", () => {
  const contact = {
    id: 7,
    companyId: 3,
    name: "Ana Pérez",
    role: "CFO",
    email: "ana@acme.com",
    phone: "+54 11 5555-0000",
    linkedin: "linkedin.com/in/anaperez",
  };

  it("shows a recruiter only name, role, email and phone", () => {
    expect(
      contactForViewer(contact, ["COMPANY_READ", "VACANCY_MANAGE"]),
    ).toEqual({
      id: 7,
      companyId: 3,
      name: "Ana Pérez",
      role: "CFO",
      email: "ana@acme.com",
      phone: "+54 11 5555-0000",
    });
  });

  it("shows a commercial user the LinkedIn too", () => {
    expect(contactForViewer(contact, ["CRM_READ"]).linkedin).toBe(
      "linkedin.com/in/anaperez",
    );
  });

  it("shows a COMPANY_MANAGE user the LinkedIn they can edit", () => {
    expect(contactForViewer(contact, ["COMPANY_MANAGE"]).linkedin).toBe(
      "linkedin.com/in/anaperez",
    );
  });
});
