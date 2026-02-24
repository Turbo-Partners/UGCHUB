import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TagsInput } from "@/components/ui/tags-input";
import { Sparkles } from "lucide-react";
import { FieldWithAI } from "./FieldWithAI";
import { IDEAL_CONTENT_TYPES } from "@shared/constants";
import type { BrandCanvasContentStrategy } from "@shared/schema";

interface Props {
  open: boolean;
  onClose: () => void;
  data: BrandCanvasContentStrategy;
  onChange: (data: BrandCanvasContentStrategy) => void;
}

export function BrandCanvasContentSheet({ open, onClose, data, onChange }: Props) {
  const update = (partial: Partial<BrandCanvasContentStrategy>) => {
    onChange({ ...data, ...partial });
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[520px] sm:w-[680px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            Estratégia de Conteúdo
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Content Types */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Tipos de Conteúdo Ideais</Label>
            <div className="flex flex-wrap gap-1.5">
              {IDEAL_CONTENT_TYPES.map(type => {
                const selected = data.idealContentTypes?.includes(type.value);
                return (
                  <Badge
                    key={type.value}
                    variant={selected ? "default" : "outline"}
                    className={`text-xs cursor-pointer transition-colors ${selected ? 'bg-violet-600 hover:bg-violet-700' : 'hover:bg-violet-50 dark:hover:bg-violet-950'}`}
                    onClick={() => {
                      const types = data.idealContentTypes || [];
                      update({
                        idealContentTypes: selected
                          ? types.filter(t => t !== type.value)
                          : [...types, type.value],
                      });
                    }}
                  >
                    {type.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Hooks */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Ganchos de Conteúdo</Label>
            <p className="text-xs text-muted-foreground">Frases de abertura que captam atenção</p>
            <TagsInput
              value={data.hooks || []}
              onChange={(hooks) => update({ hooks })}
              placeholder="Ex: Você sabia que..."
            />
          </div>

          {/* Key Messages */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Mensagens-chave</Label>
            <p className="text-xs text-muted-foreground">Pontos que devem ser comunicados</p>
            <TagsInput
              value={data.keyMessages || []}
              onChange={(keyMessages) => update({ keyMessages })}
              placeholder="Mensagem importante..."
            />
          </div>

          {/* CTA */}
          <FieldWithAI
            label="Call to Action"
            value={data.callToAction || ""}
            onChange={(v) => update({ callToAction: v })}
            placeholder="Ex: Compre agora com desconto"
            maxLength={300}
          />

          {/* Avoid Topics */}
          <FieldWithAI
            label="Temas a Evitar"
            value={data.avoidTopics || ""}
            onChange={(v) => update({ avoidTopics: v })}
            multiline
            placeholder="Temas que creators devem evitar"
            maxLength={500}
          />

          {/* Hashtag Strategy */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Estratégia de Hashtags</Label>
            <TagsInput
              value={data.hashtagStrategy || []}
              onChange={(hashtagStrategy) => update({ hashtagStrategy })}
              placeholder="#hashtag (Enter)"
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
