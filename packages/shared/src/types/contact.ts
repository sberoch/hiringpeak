/**
 * A Contact as every Company reader sees it (recruiters included): who the
 * person is and how to reach them.
 */
export type ContactBasic = {
  id: number;
  companyId: number | null;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
};

/** A Contact with the fields shown to commercial users and Contact managers. */
export type Contact = ContactBasic & {
  linkedin: string | null;
};

/** What the Company endpoints return per Contact; `linkedin` only when allowed. */
export type ContactView = ContactBasic & {
  linkedin?: string | null;
};

/** The Vacancy Contact as shown on a Vacancy: name and role only. */
export type VacancyContactSummary = Pick<ContactBasic, "id" | "name" | "role">;

export type CreateContactDto = {
  companyId: number;
  name: string;
  role?: string;
  email?: string | null;
  phone?: string | null;
  linkedin?: string | null;
};

export type UpdateContactDto = Partial<Omit<CreateContactDto, "companyId">>;
