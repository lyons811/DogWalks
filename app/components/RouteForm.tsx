import type { ChangeEvent } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

export type RouteFormValues = {
  name: string;
  notes: string;
};

export type RouteFormErrors = Partial<Record<keyof RouteFormValues, string | null | undefined>>;

type RouteFormProps = {
  values: RouteFormValues;
  onChange: (values: RouteFormValues) => void;
  disabled?: boolean;
  errors?: RouteFormErrors;
};

export function RouteForm({ values, onChange, disabled = false, errors }: RouteFormProps) {
  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...values, name: event.target.value });
  };

  const handleNotesChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...values, notes: event.target.value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="route-name">Route Name</Label>
        <Input
          id="route-name"
          value={values.name}
          onChange={handleNameChange}
          placeholder="e.g., Morning Beach Walk"
          disabled={disabled}
        />
        {errors?.name ? (
          <p className="text-sm text-destructive">{errors.name}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="route-notes">Notes (optional)</Label>
        <Textarea
          id="route-notes"
          value={values.notes}
          onChange={handleNotesChange}
          placeholder="Add notes about this route..."
          rows={4}
          disabled={disabled}
        />
        {errors?.notes ? (
          <p className="text-sm text-destructive">{errors.notes}</p>
        ) : null}
      </div>
    </div>
  );
}

export default RouteForm;
