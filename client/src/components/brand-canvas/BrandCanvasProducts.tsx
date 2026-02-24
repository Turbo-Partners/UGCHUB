import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Plus, Trash2 } from "lucide-react";
import type { BrandCanvasProduct } from "@shared/schema";

interface Props {
  open: boolean;
  onClose: () => void;
  products: BrandCanvasProduct[];
  onChange: (products: BrandCanvasProduct[]) => void;
}

export function BrandCanvasProductsSheet({ open, onClose, products, onChange }: Props) {
  const addProduct = () => {
    onChange([...products, { name: "" }]);
  };

  const updateProduct = (index: number, partial: Partial<BrandCanvasProduct>) => {
    const updated = [...products];
    updated[index] = { ...updated[index], ...partial };
    onChange(updated);
  };

  const removeProduct = (index: number) => {
    onChange(products.filter((_, i) => i !== index));
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[520px] sm:w-[680px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-teal-600" />
            Produtos & Serviços
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {products.map((product, i) => (
            <Card key={i} className="border-dashed">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Nome</Label>
                      <Input
                        value={product.name}
                        onChange={(e) => updateProduct(i, { name: e.target.value })}
                        placeholder="Nome do produto"
                        className="text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Categoria</Label>
                        <Input
                          value={product.category || ""}
                          onChange={(e) => updateProduct(i, { category: e.target.value })}
                          placeholder="Ex: Skincare"
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Faixa de preço</Label>
                        <Input
                          value={product.priceRange || ""}
                          onChange={(e) => updateProduct(i, { priceRange: e.target.value })}
                          placeholder="Ex: R$ 50-100"
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Descrição</Label>
                      <Textarea
                        value={product.description || ""}
                        onChange={(e) => updateProduct(i, { description: e.target.value })}
                        placeholder="Descrição breve"
                        className="text-sm resize-none"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Benefícios</Label>
                      <Input
                        value={product.benefits || ""}
                        onChange={(e) => updateProduct(i, { benefits: e.target.value })}
                        placeholder="Principais benefícios"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Proposta de valor</Label>
                      <Input
                        value={product.valueProposition || ""}
                        onChange={(e) => updateProduct(i, { valueProposition: e.target.value })}
                        placeholder="O que diferencia este produto"
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 shrink-0"
                    onClick={() => removeProduct(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" className="w-full" onClick={addProduct}>
            <Plus className="h-4 w-4 mr-2" /> Adicionar Produto
          </Button>

          {/* Footer */}
          <div className="sticky bottom-0 bg-background border-t pt-3 mt-6 flex justify-end">
            <Button onClick={onClose}>Salvar e Fechar</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
