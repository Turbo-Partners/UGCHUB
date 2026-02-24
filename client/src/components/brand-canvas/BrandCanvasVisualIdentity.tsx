import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorPalette } from "./ColorSwatch";
import { VISUAL_AESTHETIC_OPTIONS, FONT_SCALE_OPTIONS } from "@shared/constants";
import type { BrandCanvasVisualIdentity } from "@shared/schema";
import { Paintbrush } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  data: BrandCanvasVisualIdentity;
  onChange: (data: BrandCanvasVisualIdentity) => void;
}

export function BrandCanvasVisualIdentitySheet({ open, onClose, data, onChange }: Props) {
  const update = (partial: Partial<BrandCanvasVisualIdentity>) => {
    onChange({ ...data, ...partial });
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[520px] sm:w-[680px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5 text-indigo-600" />
            Identidade Visual
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Color Palette */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Paleta de Cores</Label>
            <ColorPalette
              colors={data.colors || {}}
              onChange={(colors) => update({ colors })}
            />
          </div>

          {/* Logo */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Logo URL</Label>
            <Input
              value={data.logoUrl || ""}
              onChange={(e) => update({ logoUrl: e.target.value })}
              placeholder="https://..."
              className="text-sm"
            />
            {data.logoUrl && (
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <img
                  src={data.logoUrl}
                  alt="Logo"
                  className="max-h-20 object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            )}
          </div>

          {/* Logo Analysis */}
          {data.logoAnalysis && (
            <div className="space-y-1">
              <Label className="text-sm font-semibold">Análise do Logo</Label>
              <p className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border">
                {data.logoAnalysis}
              </p>
            </div>
          )}

          {/* Visual Aesthetic */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Estética Visual</Label>
            <Select value={data.visualAesthetic || ""} onValueChange={(v) => update({ visualAesthetic: v })}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Selecione a estética" />
              </SelectTrigger>
              <SelectContent>
                {VISUAL_AESTHETIC_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Typography */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Tipografia</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Fonte títulos</Label>
                <Input
                  value={data.typography?.headingFont || ""}
                  onChange={(e) => update({ typography: { ...data.typography, headingFont: e.target.value } })}
                  placeholder="Ex: Montserrat"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Fonte corpo</Label>
                <Input
                  value={data.typography?.bodyFont || ""}
                  onChange={(e) => update({ typography: { ...data.typography, bodyFont: e.target.value } })}
                  placeholder="Ex: Inter"
                  className="text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Escala</Label>
              <Select
                value={data.typography?.fontScale || "normal"}
                onValueChange={(v: any) => update({ typography: { ...data.typography, fontScale: v } })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_SCALE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {data.typography?.fontPairingSuggestion && (
              <p className="text-xs text-muted-foreground">{data.typography.fontPairingSuggestion}</p>
            )}
          </div>

          {/* Mood Keywords */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Keywords de mood</Label>
            <div className="flex flex-wrap gap-1.5">
              {(data.moodKeywords || []).map((kw, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-red-100 hover:text-red-700"
                  onClick={() => {
                    const updated = [...(data.moodKeywords || [])];
                    updated.splice(i, 1);
                    update({ moodKeywords: updated });
                  }}
                >
                  {kw} ×
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Adicionar keyword (Enter)"
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  e.preventDefault();
                  update({ moodKeywords: [...(data.moodKeywords || []), e.currentTarget.value.trim()] });
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-background border-t pt-3 mt-6 flex justify-end">
            <Button onClick={onClose}>Salvar e Fechar</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
