import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/FormError";
import { validateField } from "@/lib/validation";

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  required?: boolean;
  validators?: Array<(value: any) => string | null>;
  onBlur?: () => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: string;
}

export function FormField({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  required = false,
  validators = [],
  onBlur,
  disabled = false,
  min,
  max,
  step,
}: FormFieldProps) {
  const handleBlur = () => {
    if (validators.length > 0 && onBlur) {
      onBlur();
    }
  };

  return (
    <div className="space-y-1">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
        onBlur={handleBlur}
        disabled={disabled}
        className={error ? "border-red-500" : ""}
        min={min}
        max={max}
        step={step}
      />
      {error && <FormError message={error} />}
    </div>
  );
}
