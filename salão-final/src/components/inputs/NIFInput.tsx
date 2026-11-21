import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { onlyDigits, isValidNIF } from "@/lib/validators";
import { cn } from "@/lib/utils";

interface NIFInputProps {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  required?: boolean;
  id?: string;
  className?: string;
}

export const NIFInput = ({ value, onChange, label = "NIF", required, id = "nif", className }: NIFInputProps) => {
  const valid = isValidNIF(value);
  const showFeedback = value.length > 0;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium" translate="no">
        {label} {required && "*"}
      </Label>
      <div className="relative">
        <Input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          maxLength={9}
          translate="no"
          value={value}
          onChange={(e) => onChange(onlyDigits(e.target.value).slice(0, 9))}
          placeholder="123456789"
          required={required}
          className={cn("h-10 bg-background/50 border-border/60 focus:bg-background transition-colors pr-9", className)}
        />
        {showFeedback && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            {valid ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
          </div>
        )}
      </div>
      {showFeedback && (
        <p className={cn("text-[11px]", valid ? "text-emerald-600" : "text-amber-600")}>
          {valid ? "NIF válido" : `NIF deve ter 9 dígitos (${value.length}/9)`}
        </p>
      )}
    </div>
  );
};

export default NIFInput;
