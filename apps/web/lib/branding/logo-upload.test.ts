import { logoFileError, uploadBrandingLogo, type LogoStorage } from "./logo-upload";

const MB = 1024 * 1024;

const fileOf = (name: string, type: string, size = 1000) =>
  new File([new Uint8Array(size)], name, { type });

describe("logoFileError", () => {
  it.each([
    ["logo.png", "image/png"],
    ["logo.jpg", "image/jpeg"],
  ])("accepts %s", (name, type) => {
    expect(logoFileError(fileOf(name, type))).toBeNull();
  });

  it("accepts a logo of exactly 10 MB", () => {
    expect(logoFileError(fileOf("logo.png", "image/png", 10 * MB))).toBeNull();
  });

  it("rejects an SVG with a clear message", () => {
    expect(logoFileError(fileOf("logo.svg", "image/svg+xml"))).toBe(
      "El logo debe ser un archivo PNG o JPG.",
    );
  });

  it("rejects a logo larger than 10 MB with a clear message", () => {
    expect(logoFileError(fileOf("logo.png", "image/png", 10 * MB + 1))).toBe(
      "El logo no puede superar los 10 MB.",
    );
  });
});

describe("uploadBrandingLogo", () => {
  /** Storage that keeps what it's given and serves it from a fake bucket. */
  const fakeStorage = () => {
    const stored = new Map<string, Blob>();
    const downscaledTo = new Map<Blob, number>();
    const storage: LogoStorage = {
      downscale: async (file, maxHeight) => {
        const copy = new Blob(["copy"], { type: file.type });
        downscaledTo.set(copy, maxHeight);
        return copy;
      },
      upload: async (blob, path) => {
        stored.set(path, blob);
        return `https://storage.test/o/${encodeURIComponent(path)}`;
      },
    };
    const at = (url: string) =>
      stored.get(decodeURIComponent(url.split("/o/")[1]!));
    return { storage, at, downscaledTo };
  };

  it("displays the copy downscaled to 600 px tall", async () => {
    const { storage, at, downscaledTo } = fakeStorage();

    const { logoUrl } = await uploadBrandingLogo(
      fileOf("logo.png", "image/png"),
      7,
      storage,
    );

    expect(downscaledTo.get(at(logoUrl)!)).toBe(600);
  });

  it("keeps the original as uploaded", async () => {
    const { storage, at } = fakeStorage();
    const original = fileOf("logo.png", "image/png", 4321);

    const { originalLogoUrl } = await uploadBrandingLogo(original, 7, storage);

    expect(at(originalLogoUrl)!.size).toBe(4321);
  });

  it("stores both under the Organization's Branding path", async () => {
    const { storage } = fakeStorage();

    const urls = await uploadBrandingLogo(
      fileOf("logo.png", "image/png"),
      7,
      storage,
    );

    expect(
      [urls.logoUrl, urls.originalLogoUrl].map((url) =>
        decodeURIComponent(url).startsWith(
          "https://storage.test/o/organizations/7/branding/",
        ),
      ),
    ).toEqual([true, true]);
  });

  it("refuses an invalid file before storing anything", async () => {
    const { storage } = fakeStorage();

    await expect(
      uploadBrandingLogo(fileOf("logo.svg", "image/svg+xml"), 7, storage),
    ).rejects.toThrow("El logo debe ser un archivo PNG o JPG.");
  });
});
