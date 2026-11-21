import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { evaluatePassword } from "@/lib/validators";
import { cn } from "@/lib/utils";

interface PasswordInputProps {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  required?: boolean;
  id?: string;
  placeholder?: string;
  showStrength?: boolean;
  showHint?: boolean;
}

export const PasswordInput = ({
  value, onChange, label = "Senha", required, id = "password",
  placeholder = "••••••••", showStrength = true, showHint = true,
}: PasswordInputProps) => {
  const [visible, setVisible] = useState(false);
  const strength = evaluatePassword(value);
  const segments = [1, 2, 3, 4];

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium" translate="no">
        {label} {required && "*"}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          translate="no"
          autoComplete="new-password"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 64))}
          placeholder={placeholder}
          required={required}
          minLength={8}
          maxLength={64}
          className="h-10 bg-background/50 border-border/60 focus:bg-background transition-colors pr-10"
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {showStrength && value.length > 0 && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {segments.map(i => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i <= strength.score ? strength.color : "bg-muted"
                )}
              />
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground" translate="no">
            Força: <span className="font-medium text-foreground">{strength.label}</span>
          </p>
        </div>
      )}
      {showHint && value.length === 0 && (
        <p className="text-[11px] text-muted-foreground">
          Mín. 8 caracteres — combine maiúsculas, minúsculas, números e símbolos.
        </p>
      )}
    </div>
  );
};

export default PasswordInput;
