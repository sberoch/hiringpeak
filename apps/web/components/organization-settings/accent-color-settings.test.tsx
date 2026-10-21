import { fireEvent, render, screen } from "@testing-library/react";

import { AccentColorSettings } from "./accent-color-settings";

function renderSettings(
  props: Partial<Parameters<typeof AccentColorSettings>[0]> = {},
) {
  const onSave = vi.fn();
  render(
    <AccentColorSettings
      accentColor={null}
      logoUrl={null}
      organizationName="Acme Talent"
      busy={false}
      onSave={onSave}
      onClear={vi.fn()}
      {...props}
    />,
  );
  return { onSave };
}

const typeHex = (value: string) =>
  fireEvent.change(screen.getByLabelText("Código hexadecimal"), {
    target: { value },
  });

describe("AccentColorSettings", () => {
  it("previews the default blue with white text when no accent is set", () => {
    renderSettings();

    expect(screen.getByTestId("preview-accent-bar")).toHaveStyle({
      backgroundColor: "#0066ff",
    });
    expect(screen.getByText("Texto sobre el acento")).toHaveStyle({
      color: "#ffffff",
    });
  });

  it("previews a picked light color with black text before saving", () => {
    renderSettings();

    typeHex("#ffd400");

    expect(screen.getByTestId("preview-accent-bar")).toHaveStyle({
      backgroundColor: "#ffd400",
    });
    expect(screen.getByText("Texto sobre el acento")).toHaveStyle({
      color: "#000000",
    });
  });

  it("explains why a mid-tone can't be used and doesn't let it be saved", () => {
    renderSettings();

    typeHex("#777777");

    expect(screen.getByRole("alert")).toHaveTextContent(
      /ni con texto negro ni con texto blanco/,
    );
    expect(
      screen.getByRole("button", { name: "Guardar color" }),
    ).toBeDisabled();
  });

  it("saves the picked color", () => {
    const { onSave } = renderSettings();

    typeHex("#1a1a2e");
    fireEvent.click(screen.getByRole("button", { name: "Guardar color" }));

    expect(onSave).toHaveBeenCalledWith("#1a1a2e");
  });
});
