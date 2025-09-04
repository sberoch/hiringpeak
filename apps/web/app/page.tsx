import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { normalizeString } from "@workspace/shared/utils";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-svh">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Hello World</h1>
        <Button size="sm">Button</Button>
        <Input placeholder="Input" />
        <Label>Label</Label>
        <p>{normalizeString("áéíóúñÁÉÍÓÚÑ")}</p>
      </div>
    </div>
  );
}
