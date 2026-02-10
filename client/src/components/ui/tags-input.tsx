import { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  maxTags?: number;
  disabled?: boolean;
}

export function TagsInput({
  value = [],
  onChange,
  placeholder = "Digite e pressione Enter",
  className,
  maxTags,
  disabled = false,
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    const trimmedValue = inputValue.trim();
    
    if (!trimmedValue) return;
    
    if (value.includes(trimmedValue)) {
      setInputValue('');
      return;
    }
    
    if (maxTags && value.length >= maxTags) {
      return;
    }
    
    onChange([...value, trimmedValue]);
    setInputValue('');
  };

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || (maxTags ? value.length >= maxTags : false)}
          data-testid="input-tags"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addTag}
          disabled={!inputValue.trim() || disabled || (maxTags ? value.length >= maxTags : false)}
          data-testid="button-add-tag"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="pl-2 pr-1 py-1 text-sm"
              data-testid={`tag-${index}`}
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                disabled={disabled}
                className="ml-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 p-0.5 transition-colors"
                data-testid={`button-remove-tag-${index}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      
      {maxTags && (
        <p className="text-xs text-muted-foreground">
          {value.length}/{maxTags} tags
        </p>
      )}
    </div>
  );
}
