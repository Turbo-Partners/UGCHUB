import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Image, Plus, Trash2, Link2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BrandCanvasReference, BrandCanvasAsset, BrandCanvasCompetitor } from "@shared/schema";

interface Props {
  open: boolean;
  onClose: () => void;
  data: BrandCanvasReference;
  onChange: (data: BrandCanvasReference) => void;
}

export function BrandCanvasReferencesSheet({ open, onClose, data, onChange }: Props) {
  const update = (partial: Partial<BrandCanvasReference>) => {
    onChange({ ...data, ...partial });
  };

  const competitors = data.competitors || [];

  const addCompetitor = () => {
    if (competitors.length >= 5) return;
    update({ competitors: [...competitors, { name: "" }] });
  };

  const updateCompetitor = (i: number, partial: Partial<BrandCanvasCompetitor>) => {
    const updated = [...competitors];
    updated[i] = { ...updated[i], ...partial };
    update({ competitors: updated });
  };

  const removeCompetitor = (i: number) => {
    update({ competitors: competitors.filter((_, idx) => idx !== i) });
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[520px] sm:w-[680px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-teal-600" />
            Referências & Concorrentes
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Structured Competitors */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-semibold">Concorrentes</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Adicione até 5 concorrentes para análise estratégica</p>
            </div>

            {competitors.map((comp, i) => (
              <Card key={i} className="border-dashed">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Concorrente {i + 1}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-400 hover:text-red-600"
                      onClick={() => removeCompetitor(i)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Nome</Label>
                      <Input
                        value={comp.name || ""}
                        onChange={(e) => updateCompetitor(i, { name: e.target.value })}
                        placeholder="Marca"
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Instagram</Label>
                      <Input
                        value={comp.instagram || ""}
                        onChange={(e) => updateCompetitor(i, { instagram: e.target.value })}
                        placeholder="@perfil"
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Site</Label>
                      <Input
                        value={comp.website || ""}
                        onChange={(e) => updateCompetitor(i, { website: e.target.value })}
                        placeholder="www..."
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {competitors.length < 5 && (
              <Button variant="outline" size="sm" className="w-full" onClick={addCompetitor}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Adicionar Concorrente
              </Button>
            )}
          </div>

          {/* Reference Brands */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Marcas de Referência</Label>
            <p className="text-xs text-muted-foreground">Marcas que vocês admiram e gostariam de ter como referência</p>
            <div className="flex flex-wrap gap-1.5">
              {(data.referenceBrands || []).map((brand, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-red-100 hover:text-red-700"
                  onClick={() => update({ referenceBrands: (data.referenceBrands || []).filter((_, idx) => idx !== i) })}
                >
                  {brand} ×
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Nome da marca (Enter)"
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  e.preventDefault();
                  update({ referenceBrands: [...(data.referenceBrands || []), e.currentTarget.value.trim()] });
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>

          {/* Avoid Words */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Palavras ou Termos a Evitar</Label>
            <p className="text-xs text-muted-foreground">Palavras, expressões ou conceitos que NÃO devem aparecer nos roteiros</p>
            <div className="flex flex-wrap gap-1.5">
              {(data.avoidWords || []).map((word, i) => (
                <Badge
                  key={i}
                  variant="destructive"
                  className="text-xs cursor-pointer hover:opacity-70"
                  onClick={() => update({ avoidWords: (data.avoidWords || []).filter((_, idx) => idx !== i) })}
                >
                  {word} ×
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Ex: 'milagre', 'garantido', 'emagrecimento rápido' (Enter)"
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  e.preventDefault();
                  update({ avoidWords: [...(data.avoidWords || []), e.currentTarget.value.trim()] });
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>

          {/* Reference Creators */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Creators de Referência</Label>
            <Textarea
              value={data.referenceCreators || ""}
              onChange={(e) => update({ referenceCreators: e.target.value })}
              placeholder="@creator1, @creator2 — descreva o estilo desejado"
              rows={2}
              className="text-sm resize-none"
              maxLength={500}
            />
          </div>

          {/* Brand Assets */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Ativos Visuais</Label>
            <div className="grid grid-cols-3 gap-2">
              {(data.brandAssets || []).map((asset, i) => (
                <div key={i} className="relative group">
                  {asset.type === 'image' ? (
                    <img src={asset.url} alt={asset.caption || ""} className="h-20 w-full object-cover rounded-lg border" />
                  ) : (
                    <div className="h-20 w-full bg-gray-100 dark:bg-gray-800 rounded-lg border flex items-center justify-center text-xs text-muted-foreground">
                      Video
                    </div>
                  )}
                  <button
                    onClick={() => update({ brandAssets: (data.brandAssets || []).filter((_, idx) => idx !== i) })}
                    className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <Input
              placeholder="URL da imagem/vídeo (Enter)"
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  e.preventDefault();
                  const newAsset: BrandCanvasAsset = {
                    url: e.currentTarget.value.trim(),
                    type: 'image',
                    source: 'upload',
                  };
                  update({ brandAssets: [...(data.brandAssets || []), newAsset] });
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
