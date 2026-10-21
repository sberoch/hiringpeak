import { OpportunityQueryParamsSchema } from "../dtos/opportunity.dto";

const order = (value: string) =>
  OpportunityQueryParamsSchema.safeParse({ order: value });

describe("Opportunity list sort order", () => {
  it("parses a sortable field and direction", () => {
    expect(order("closeDate:desc").data?.order).toEqual({
      field: "closeDate",
      direction: "desc",
    });
  });

  it.each([
    "estimatedFee:asc",
    "closeDate:sideways",
    "closeDate",
    "createdAt:asc:x",
  ])("rejects %j", (value) => {
    expect(order(value).success).toBe(false);
  });

  it("is optional: newest first is the service's default", () => {
    expect(OpportunityQueryParamsSchema.parse({}).order).toBeUndefined();
  });
});
