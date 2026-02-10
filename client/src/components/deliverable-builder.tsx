import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { DELIVERABLE_TYPE_OPTIONS } from '@shared/constants';
import type { StructuredDeliverable } from '@shared/schema';

interface DeliverableBuilderProps {
  value: StructuredDeliverable[];
  onChange: (deliverables: StructuredDeliverable[]) => void;
}

export function DeliverableBuilder({ value, onChange }: DeliverableBuilderProps) {
  const deliverables = value || [];

  const addDeliverable = () => {
    const newDeliverable: StructuredDeliverable = {
      type: 'instagram_post',
      quantity: 1,
      notes: '',
    };
    onChange([...deliverables, newDeliverable]);
  };

  const updateDeliverable = (index: number, field: keyof StructuredDeliverable, fieldValue: any) => {
    const updated = deliverables.map((d, i) => 
      i === index ? { ...d, [field]: fieldValue } : d
    );
    onChange(updated);
  };

  const removeDeliverable = (index: number) => {
    const updated = deliverables.filter((_, i) => i !== index);
    onChange(updated);
  };

  const getTypeLabel = (type: string) => {
    return DELIVERABLE_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type;
  };

  return (
    <div className="space-y-3" data-testid="deliverable-builder">
      {deliverables.map((deliverable, index) => (
        <Card key={index} className="p-3" data-testid={`deliverable-item-${index}`}>
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <Select
                value={deliverable.type}
                onValueChange={(val) => updateDeliverable(index, 'type', val)}
              >
                <SelectTrigger className="w-full" data-testid={`select-deliverable-type-${index}`}>
                  <SelectValue placeholder="Tipo de entregável" />
                </SelectTrigger>
                <SelectContent>
                  {DELIVERABLE_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-20">
              <Input
                type="number"
                min={1}
                value={deliverable.quantity}
                onChange={(e) => updateDeliverable(index, 'quantity', parseInt(e.target.value) || 1)}
                placeholder="Qtd"
                data-testid={`input-deliverable-qty-${index}`}
              />
            </div>
            <div className="flex-1">
              <Input
                value={deliverable.notes || ''}
                onChange={(e) => updateDeliverable(index, 'notes', e.target.value)}
                placeholder="Observação (opcional)"
                maxLength={200}
                data-testid={`input-deliverable-notes-${index}`}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeDeliverable(index)}
              className="text-destructive hover:text-destructive"
              data-testid={`button-remove-deliverable-${index}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addDeliverable}
        className="w-full"
        data-testid="button-add-deliverable"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Entregável
      </Button>

      {deliverables.length > 0 && (
        <div className="text-sm text-muted-foreground mt-2">
          Total: {deliverables.reduce((acc, d) => acc + d.quantity, 0)} entregável(is)
        </div>
      )}
    </div>
  );
}
