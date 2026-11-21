import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { onlyDigits, isValidPhoneAO, formatPhoneAO } from "@/lib/validators";
import { cn } from "@/lib/utils";

interface PhoneAOInputProps {
  value: string; // raw 9 digits (no +244)
  onChange: (v: string) => void;
  label?: string;
  required?: boolean;
  id?: string;
}

export const PhoneAOInput = ({ value, onChange, label = "Telefone", required, id = "phone" }: PhoneAOInputProps) => {
  const valid = isValidPhoneAO(value);
  const show = value.length > 0;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium" translate="no">
        {label} {required && "*"}
      </Label>
      <div className="relative flex items-stretch">
        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border/60 bg-muted/40 text-xs font-medium text-muted-foreground select-none" translate="no">
          +244
        </span>
        <Input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          translate="no"
          value={formatPhoneAO(value)}
          onChange={(e) => onChange(onlyDigits(e.target.value).slice(0, 9))}
          placeholder="9XX XXX XXX"
          required={required}
          className={cn("h-10 bg-background/50 border-border/60 focus:bg-background transition-colors rounded-l-none pr-9")}
        />
        {show && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            {valid ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
          </div>
        )}
      </div>
      {show && (
        <p className={cn("text-[11px]", valid ? "text-emerald-600" : "text-amber-600")}>
          {valid ? "Telefone válido" : `Devem ser 9 dígitos (${value.length}/9)`}
        </p>
      )}
    </div>
  );
};

export default PhoneAOInput;
