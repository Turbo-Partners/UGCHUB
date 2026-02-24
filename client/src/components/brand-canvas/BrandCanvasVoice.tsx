import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TagsInput } from "@/components/ui/tags-input";
import { BRAND_VOICE_OPTIONS, LANGUAGE_STYLE_OPTIONS, EMOJI_USAGE_OPTIONS, PERSONALITY_TRAIT_OPTIONS } from "@shared/constants";
import type { BrandCanvasVoice } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { MessageSquare, Check, Ban } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  data: BrandCanvasVoice;
  onChange: (data: BrandCanvasVoice) => void;
}

export function BrandCanvasVoiceSheet({ open, onClose, data, onChange }: Props) {
  const update = (partial: Partial<BrandCanvasVoice>) => {
    onChange({ ...data, ...partial });
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[520px] sm:w-[680px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-violet-600" />
            Voz da Marca
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Tone Type */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Tom de Voz</Label>
            <Select value={data.toneType || ""} onValueChange={(v) => update({ toneType: v })}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Selecione o tom" />
              </SelectTrigger>
              <SelectContent>
                {BRAND_VOICE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tone Description */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Descrição do Tom</Label>
            <Textarea
              value={data.toneDescription || ""}
              onChange={(e) => update({ toneDescription: e.target.value })}
              placeholder="Descreva como a marca se comunica..."
              rows={3}
              className="text-sm resize-none"
              maxLength={500}
            />
          </div>

          {/* Personality Traits */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Traços de Personalidade</Label>
            <div className="flex flex-wrap gap-1.5">
              {PERSONALITY_TRAIT_OPTIONS.map(trait => {
                const selected = data.personalityTraits?.includes(trait.value);
                return (
                  <Badge
                    key={trait.value}
                    variant={selected ? "default" : "outline"}
                    className={`text-xs cursor-pointer transition-colors ${selected ? 'bg-violet-600 hover:bg-violet-700' : 'hover:bg-violet-50 dark:hover:bg-violet-950'}`}
                    onClick={() => {
                      const traits = data.personalityTraits || [];
                      update({
                        personalityTraits: selected
                          ? traits.filter(t => t !== trait.value)
                          : [...traits, trait.value].slice(0, 10),
                      });
                    }}
                  >
                    {trait.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Language Style */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Estilo de Linguagem</Label>
            <Select value={data.languageStyle || ""} onValueChange={(v) => update({ languageStyle: v })}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Selecione o estilo" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_STYLE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Emoji Usage */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Uso de Emojis</Label>
            <Select value={data.emojiUsage || ""} onValueChange={(v: any) => update({ emojiUsage: v })}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {EMOJI_USAGE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Palavras-chave da Marca</Label>
            <TagsInput
              value={data.keywords || []}
              onChange={(keywords) => update({ keywords })}
              placeholder="Adicionar palavra-chave"
            />
          </div>

          {/* Do/Don't side-by-side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Faça isso
              </Label>
              <TagsInput
                value={data.doList || []}
                onChange={(doList) => update({ doList })}
                placeholder="Adicionar orientação"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-1">
                <Ban className="h-3.5 w-3.5" /> Evite isso
              </Label>
              <TagsInput
                value={data.dontList || []}
                onChange={(dontList) => update({ dontList })}
                placeholder="Adicionar restrição"
              />
            </div>
          </div>

          {/* Example Captions */}
          {(data.exampleCaptions?.length ?? 0) > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Legendas de Exemplo</Label>
              <div className="space-y-2">
                {data.exampleCaptions!.map((cap, i) => (
                  <div key={i} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border text-sm italic text-muted-foreground">
                    "{cap}"
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="sticky bottom-0 bg-background border-t pt-3 mt-6 flex justify-end">
            <Button onClick={onClose}>Salvar e Fechar</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
