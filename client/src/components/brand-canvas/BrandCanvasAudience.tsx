import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TagsInput } from "@/components/ui/tags-input";
import { Users, Plus, Trash2, UserPlus } from "lucide-react";
import { FieldWithAI } from "./FieldWithAI";
import type { BrandCanvasPersona } from "@shared/schema";

interface Props {
  open: boolean;
  onClose: () => void;
  targetAudience: string;
  demographics: string;
  personas: BrandCanvasPersona[];
  painPoints: string[];
  desiredEmotions: string[];
  onChangeAudience: (v: string) => void;
  onChangeDemographics: (v: string) => void;
  onChangePersonas: (v: BrandCanvasPersona[]) => void;
  onChangePainPoints: (v: string[]) => void;
  onChangeDesiredEmotions: (v: string[]) => void;
}

export function BrandCanvasAudienceSheet({
  open, onClose,
  targetAudience, demographics, personas, painPoints, desiredEmotions,
  onChangeAudience, onChangeDemographics, onChangePersonas, onChangePainPoints, onChangeDesiredEmotions,
}: Props) {
  const addPersona = () => {
    onChangePersonas([...personas, { id: `manual-${Date.now()}`, name: "" }]);
  };

  const updatePersona = (index: number, partial: Partial<BrandCanvasPersona>) => {
    const updated = [...personas];
    updated[index] = { ...updated[index], ...partial };
    onChangePersonas(updated);
  };

  const removePersona = (index: number) => {
    onChangePersonas(personas.filter((_, i) => i !== index));
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[520px] sm:w-[680px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-600" />
            Público-Alvo
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Target Audience */}
          <FieldWithAI
            label="Quem é o cliente ideal?"
            value={targetAudience}
            onChange={onChangeAudience}
            multiline
            maxLength={500}
            placeholder="Pessoa que se preocupa com saúde, busca soluções baseadas em ciência..."
          />

          {/* Demographics */}
          <FieldWithAI
            label="Informações Demográficas"
            value={demographics}
            onChange={onChangeDemographics}
            maxLength={500}
            placeholder="Ex: Majoritariamente feminino, 30-55 anos, Classe B e A, grandes centros urbanos"
          />

          {/* Pain Points */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">O que tira o sono desse cliente? *</Label>
            <p className="text-xs text-muted-foreground">Medos, frustrações e dores do público-alvo</p>
            <TagsInput
              value={painPoints}
              onChange={onChangePainPoints}
              placeholder="Ex: Medo de investir em produtos que não funcionam (Enter)"
            />
          </div>

          {/* Desired Emotions */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Emoções que a marca quer despertar *</Label>
            <TagsInput
              value={desiredEmotions}
              onChange={onChangeDesiredEmotions}
              placeholder="Ex: Confiança, Segurança, Bem-estar (Enter)"
            />
          </div>

          {/* Personas */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Personas</Label>

            {personas.map((persona, i) => (
              <Card key={persona.id || i} className="border-dashed">
                <CardHeader className="p-3 pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-teal-500" />
                      <Input
                        value={persona.name || ""}
                        onChange={(e) => updatePersona(i, { name: e.target.value })}
                        placeholder="Nome da persona"
                        className="text-sm font-medium h-8 border-0 p-0 focus-visible:ring-0 shadow-none"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-400 hover:text-red-600"
                      onClick={() => removePersona(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-2 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Idade</Label>
                      <Input
                        value={persona.ageRange || ""}
                        onChange={(e) => updatePersona(i, { ageRange: e.target.value })}
                        placeholder="25-34"
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Gênero</Label>
                      <Input
                        value={persona.gender || ""}
                        onChange={(e) => updatePersona(i, { gender: e.target.value })}
                        placeholder="Feminino"
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Localização</Label>
                      <Input
                        value={persona.location || ""}
                        onChange={(e) => updatePersona(i, { location: e.target.value })}
                        placeholder="São Paulo"
                        className="text-xs h-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Interesses</Label>
                    <TagsInput value={persona.interests || []} onChange={(v) => updatePersona(i, { interests: v })} placeholder="Adicionar interesse" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Dores</Label>
                    <TagsInput value={persona.painPoints || []} onChange={(v) => updatePersona(i, { painPoints: v })} placeholder="Adicionar dor" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Desejos</Label>
                    <TagsInput value={persona.desires || []} onChange={(v) => updatePersona(i, { desires: v })} placeholder="Adicionar desejo" />
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button variant="outline" className="w-full" onClick={addPersona}>
              <Plus className="h-4 w-4 mr-2" /> Adicionar Persona
            </Button>
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
