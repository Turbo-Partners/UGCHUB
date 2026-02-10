import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: string): string {
  const numericValue = value.replace(/\D/g, '');
  if (!numericValue) return '';
  const numberValue = parseInt(numericValue, 10) / 100;
  return numberValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseCurrency(formattedValue: string): string {
  return formattedValue.replace(/\./g, '').replace(',', '.');
}

export function getAvatarUrl(avatar: string | null | undefined, fallbackName?: string): string {
  if (!avatar) {
    return fallbackName 
      ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fallbackName)}`
      : '';
  }
  
  // Local uploads - use directly
  if (avatar.startsWith('/uploads/')) {
    return avatar;
  }
  
  // Instagram CDN URLs - use proxy
  if (avatar.includes('cdninstagram.com') || avatar.includes('fbcdn.net')) {
    return `/api/proxy-image?url=${encodeURIComponent(avatar)}`;
  }
  
  // Other URLs (dicebear, etc.) - use directly
  return avatar;
}

export function getPublicAvatarUrl(avatar: string | null | undefined, fallbackName?: string): string {
  if (!avatar) {
    return fallbackName 
      ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fallbackName)}`
      : '';
  }
  
  // Local uploads - use directly
  if (avatar.startsWith('/uploads/')) {
    return avatar;
  }
  
  // Instagram CDN URLs - use public proxy
  if (avatar.includes('cdninstagram.com') || avatar.includes('fbcdn.net')) {
    return `/api/public/proxy-image?url=${encodeURIComponent(avatar)}`;
  }
  
  // Other URLs (dicebear, etc.) - use directly
  return avatar;
}
