import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FieldWithAIProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  maxLength?: number;
  placeholder?: string;
}

export function FieldWithAI({ label, value, onChange, multiline, maxLength, placeholder }: FieldWithAIProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {multiline ? (
        <Textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={3}
          className="resize-none text-sm"
        />
      ) : (
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="text-sm"
        />
      )}
      {maxLength && (
        <p className="text-[10px] text-muted-foreground text-right">{(value || "").length}/{maxLength}</p>
      )}
    </div>
  );
}
