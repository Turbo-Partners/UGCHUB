import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { FieldWithAI } from "./FieldWithAI";

interface Props {
  open: boolean;
  onClose: () => void;
  problemsAndDesires: string[];
  transformationStories: string;
  valueProposition: string;
  commercialStrategies: string;
  onChangeProblemsAndDesires: (v: string[]) => void;
  onChangeTransformationStories: (v: string) => void;
  onChangeValueProposition: (v: string) => void;
  onChangeCommercialStrategies: (v: string) => void;
}

export function BrandCanvasAnglesSheet({
  open, onClose,
  problemsAndDesires, transformationStories, valueProposition, commercialStrategies,
  onChangeProblemsAndDesires, onChangeTransformationStories, onChangeValueProposition, onChangeCommercialStrategies,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[520px] sm:w-[680px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-teal-600" />
            Ângulos & Gatilhos
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Problems and Desires */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Problemas e desejos que a marca resolve *</Label>
            <p className="text-xs text-muted-foreground">
              Quais são os principais problemas ou desejos que essa marca atende? Estes viram ângulos nos roteiros UGC.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {problemsAndDesires.map((item, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-red-100 hover:text-red-700"
                  onClick={() => onChangeProblemsAndDesires(problemsAndDesires.filter((_, idx) => idx !== i))}
                >
                  {item} ×
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Ex: Desejo de cuidar do corpo com ciência (Enter)"
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  e.preventDefault();
                  onChangeProblemsAndDesires([...problemsAndDesires, e.currentTarget.value.trim()]);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>

          {/* Value Proposition */}
          <FieldWithAI
            label="Proposta de Valor"
            value={valueProposition}
            onChange={onChangeValueProposition}
            maxLength={300}
            placeholder="Ex: 'Poder comer de tudo e emagrecer', 'Moda consciente para um mundo melhor'"
          />

          {/* Commercial Strategies */}
          <FieldWithAI
            label="Estratégias Comerciais para Roteiros"
            value={commercialStrategies}
            onChange={onChangeCommercialStrategies}
            multiline
            maxLength={500}
            placeholder="Ex: frete grátis na região Sudeste, cupom de primeira compra, cashback, parcelamento..."
          />

          {/* Transformation Stories */}
          <FieldWithAI
            label="Histórias de Transformação"
            value={transformationStories}
            onChange={onChangeTransformationStories}
            multiline
            maxLength={1000}
            placeholder="Casos emblemáticos que mostram o impacto da marca. Ex: 'Cliente que perdeu 20kg em 6 meses'..."
          />

          {/* Footer */}
          <div className="sticky bottom-0 bg-background border-t pt-3 mt-6 flex justify-end">
            <Button onClick={onClose}>Salvar e Fechar</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
