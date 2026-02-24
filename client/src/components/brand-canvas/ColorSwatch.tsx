import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

interface ColorSwatchProps {
  color: string;
  label: string;
  onChange: (color: string) => void;
  size?: "sm" | "md" | "lg";
}

export function ColorSwatch({ color, label, onChange, size = "md" }: ColorSwatchProps) {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14",
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(color || "");
    setCopied(true);
    toast.success("Cor copiada!");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex flex-col items-center gap-1 group">
          <div
            className={`${sizeClasses[size]} rounded-lg border-2 border-white shadow-md ring-1 ring-gray-200 transition-transform group-hover:scale-110 cursor-pointer`}
            style={{ backgroundColor: color || "#e5e7eb" }}
          />
          <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-3" align="start">
        <div className="space-y-3">
          <Label className="text-xs font-medium">{label}</Label>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="color"
              value={color || "#6366f1"}
              onChange={(e) => onChange(e.target.value)}
              className="h-8 w-8 rounded cursor-pointer border-0 p-0"
            />
            <Input
              value={color || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
              className="h-8 text-xs font-mono"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface ColorPaletteProps {
  colors: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
    additional?: string[];
  };
  onChange: (colors: any) => void;
  readOnly?: boolean;
}

export function ColorPalette({ colors, onChange, readOnly }: ColorPaletteProps) {
  const updateColor = (key: string, value: string) => {
    if (readOnly) return;
    onChange({ ...colors, [key]: value });
  };

  const paletteColors = [
    { key: "primary", label: "Principal", value: colors.primary },
    { key: "secondary", label: "Secundária", value: colors.secondary },
    { key: "accent", label: "Destaque", value: colors.accent },
    { key: "background", label: "Fundo", value: colors.background },
    { key: "text", label: "Texto", value: colors.text },
  ];

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {paletteColors.map(({ key, label, value }) => (
        <ColorSwatch
          key={key}
          color={value || ""}
          label={label}
          onChange={(c) => updateColor(key, c)}
        />
      ))}
      {colors.additional?.map((c, i) => (
        <ColorSwatch
          key={`add-${i}`}
          color={c}
          label={`Extra ${i + 1}`}
          onChange={(newColor) => {
            if (readOnly) return;
            const updated = [...(colors.additional || [])];
            updated[i] = newColor;
            onChange({ ...colors, additional: updated });
          }}
          size="sm"
        />
      ))}
    </div>
  );
}
