import { isBrandingStorageUrl } from "./branding-storage";

const url = (objectPath: string, host = "firebasestorage.googleapis.com") =>
  `https://${host}/v0/b/hp.appspot.com/o/${objectPath}?alt=media&token=abc`;

describe("isBrandingStorageUrl", () => {
  it("accepts a download URL under the Organization's Branding directory", () => {
    expect(
      isBrandingStorageUrl(url("organizations%2F7%2Fbranding%2Flogo.png"), 7),
    ).toBe(true);
  });

  it("rejects a file under another Organization's Branding directory", () => {
    expect(
      isBrandingStorageUrl(url("organizations%2F8%2Fbranding%2Flogo.png"), 7),
    ).toBe(false);
  });

  it("rejects a URL that is not https", () => {
    expect(
      isBrandingStorageUrl(
        url("organizations%2F7%2Fbranding%2Flogo.png").replace(
          "https:",
          "http:",
        ),
        7,
      ),
    ).toBe(false);
  });

  it("rejects a host other than Firebase Storage", () => {
    expect(
      isBrandingStorageUrl(
        url("organizations%2F7%2Fbranding%2Flogo.png", "evil.example.com"),
        7,
      ),
    ).toBe(false);
  });

  it("rejects a path that climbs out of the Branding directory", () => {
    expect(
      isBrandingStorageUrl(
        url("organizations%2F7%2Fbranding%2F..%2F..%2F8%2Fbranding%2Flogo.png"),
        7,
      ),
    ).toBe(false);
  });

  it("rejects a double-encoded climb out of the Branding directory", () => {
    expect(
      isBrandingStorageUrl(
        url("organizations%2F7%2Fbranding%2F%252E%252E%252Fsecret.png"),
        7,
      ),
    ).toBe(false);
  });

  it("rejects a file in another bucket when the bucket is given", () => {
    expect(
      isBrandingStorageUrl(
        url("organizations%2F7%2Fbranding%2Flogo.png").replace(
          "hp.appspot.com",
          "other.appspot.com",
        ),
        7,
        "hp.appspot.com",
      ),
    ).toBe(false);
  });

  it("accepts a file in the given bucket", () => {
    expect(
      isBrandingStorageUrl(
        url("organizations%2F7%2Fbranding%2Flogo.png"),
        7,
        "hp.appspot.com",
      ),
    ).toBe(true);
  });

  it("rejects something that is not a URL", () => {
    expect(isBrandingStorageUrl("not a url", 7)).toBe(false);
  });
});
