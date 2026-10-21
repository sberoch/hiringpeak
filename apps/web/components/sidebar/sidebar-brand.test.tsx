import { render, screen } from "@testing-library/react";

import { SidebarBrand, SidebarProductMark } from "./sidebar-brand";

const LOGO =
  "https://firebasestorage.googleapis.com/v0/b/hp/o/organizations%2F7%2Fbranding%2Flogo.png?alt=media";

describe("sidebar branding", () => {
  describe("with an Organization logo", () => {
    beforeEach(() => {
      render(
        <>
          <SidebarBrand logoUrl={LOGO} organizationName="Acme Talent" />
          <SidebarProductMark logoUrl={LOGO} />
        </>,
      );
    });

    it("shows the Organization's logo at the top", () => {
      expect(screen.getByRole("img", { name: "Acme Talent" })).toHaveAttribute(
        "src",
        LOGO,
      );
    });

    it("leaves HiringPeak only as a small mark at the bottom", () => {
      expect(
        screen.getAllByRole("img", { name: /HiringPeak/ }).map((img) =>
          img.getAttribute("alt"),
        ),
      ).toEqual(["Hecho con HiringPeak"]);
    });
  });

  describe("without a logo", () => {
    beforeEach(() => {
      render(
        <>
          <SidebarBrand logoUrl={null} organizationName="Acme Talent" />
          <SidebarProductMark logoUrl={null} />
        </>,
      );
    });

    it("shows HiringPeak's logo and wordmark as today", () => {
      expect(screen.getByRole("img", { name: "HiringPeak" })).toBeVisible();
      expect(screen.getByText("HiringPeak")).toBeInTheDocument();
    });

    it("adds no mark at the bottom", () => {
      expect(
        screen.queryByRole("img", { name: "Hecho con HiringPeak" }),
      ).not.toBeInTheDocument();
    });
  });
});
