import { CreateCandidateSchema, UpdateCandidateSchema } from "./candidate.dto";

const baseInput = {
  name: "Jane Doe",
  gender: "female",
  sourceId: 1,
  seniorityIds: [],
  areaIds: [],
  industryIds: [],
  fileIds: [],
  stars: 0,
  isInCompanyViaPratt: false,
  countries: [],
  provinces: [],
  languages: [],
};

describe("CreateCandidateSchema email", () => {
  it("accepts an omitted email without erroring", () => {
    const result = CreateCandidateSchema.parse({ ...baseInput });
    expect(result.email).toBeUndefined();
  });

  it("accepts an empty string email", () => {
    const result = CreateCandidateSchema.parse({ ...baseInput, email: "" });
    expect(result.email).toBe("");
  });

  it("accepts a valid email", () => {
    const result = CreateCandidateSchema.parse({
      ...baseInput,
      email: "jane@example.com",
    });
    expect(result.email).toBe("jane@example.com");
  });

  it("still rejects a malformed non-empty email", () => {
    expect(() =>
      CreateCandidateSchema.parse({ ...baseInput, email: "not-an-email" }),
    ).toThrow();
  });

  it("does not inject an email into a partial update that omits it", () => {
    const result = UpdateCandidateSchema.parse({ name: "Jane Doe" });
    expect("email" in result).toBe(false);
  });
});
