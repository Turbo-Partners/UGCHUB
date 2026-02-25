import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface InstagramAvatarProps {
  username: string;
  initialPicUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  'data-testid'?: string;
  skipAutoFetch?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const fallbackSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

const picCache = new Map<string, { url: string | null; timestamp: number }>();
const inFlightRequests = new Map<string, Promise<string | null>>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

async function fetchPicUrlFromServer(username: string): Promise<string | null> {
  const cleanUsername = username.replace('@', '').trim().toLowerCase();
  if (!cleanUsername) return null;

  const cached = picCache.get(cleanUsername);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.url;
  }

  const existing = inFlightRequests.get(cleanUsername);
  if (existing) {
    return existing;
  }

  const promise = (async () => {
    try {
      const response = await fetch(
        `/api/instagram/profile-pic/${encodeURIComponent(cleanUsername)}`,
        {
          credentials: 'include',
        },
      );
      if (response.ok) {
        const data = await response.json();
        const url = data.profilePicUrl || null;
        picCache.set(cleanUsername, { url, timestamp: Date.now() });
        return url;
      }
    } catch (error) {
      console.error(`[InstagramAvatar] Error fetching pic for ${cleanUsername}:`, error);
    } finally {
      inFlightRequests.delete(cleanUsername);
    }
    return null;
  })();

  inFlightRequests.set(cleanUsername, promise);
  return promise;
}

export async function batchFetchProfilePics(usernames: string[]): Promise<Map<string, string>> {
  const clean = usernames.map((u) => u.replace('@', '').trim().toLowerCase()).filter(Boolean);
  const unique = Array.from(new Set(clean));
  const result = new Map<string, string>();

  const needed: string[] = [];
  for (const u of unique) {
    const cached = picCache.get(u);
    if (cached && cached.url && Date.now() - cached.timestamp < CACHE_TTL) {
      result.set(u, cached.url);
    } else {
      needed.push(u);
    }
  }

  if (needed.length === 0) return result;

  try {
    const response = await fetch('/api/instagram/profile-pics/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ usernames: needed }),
    });
    if (response.ok) {
      const data = await response.json();
      const pics = data.pics || {};
      for (const [username, url] of Object.entries(pics)) {
        if (url) {
          picCache.set(username.toLowerCase(), { url: url as string, timestamp: Date.now() });
          result.set(username.toLowerCase(), url as string);
        }
      }
    }
  } catch (error) {
    console.error('[InstagramAvatar] Batch fetch error:', error);
  }

  return result;
}

export function InstagramAvatar({
  username,
  initialPicUrl,
  size = 'md',
  className = '',
  onClick,
  'data-testid': testId,
  skipAutoFetch = false,
}: InstagramAvatarProps) {
  const [picUrl, setPicUrl] = useState<string | null>(initialPicUrl || null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedFromApi, setFetchedFromApi] = useState(false);

  const cleanUsername = username?.replace('@', '').trim().toLowerCase() || '';
  const initial = (cleanUsername.charAt(0) || 'U').toUpperCase();

  useEffect(() => {
    setPicUrl(initialPicUrl || null);
    setHasError(false);
    setFetchedFromApi(false);
  }, [initialPicUrl, username]);

  const fetchPicFromApi = async () => {
    if (fetchedFromApi || isLoading || !cleanUsername || skipAutoFetch) return;

    setIsLoading(true);
    setFetchedFromApi(true);

    const url = await fetchPicUrlFromServer(cleanUsername);
    if (url) {
      setPicUrl(url);
      setHasError(false);
    }
    setIsLoading(false);
  };

  const handleImageError = () => {
    setHasError(true);
    setPicUrl(null);
    if (!skipAutoFetch) {
      fetchPicFromApi();
    }
  };

  useEffect(() => {
    if (!initialPicUrl && cleanUsername && !fetchedFromApi && !skipAutoFetch) {
      fetchPicFromApi();
    }
  }, [cleanUsername, initialPicUrl, fetchedFromApi, skipAutoFetch]);

  return (
    <Avatar
      className={`${sizeClasses[size]} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      data-testid={testId}
    >
      {picUrl && !hasError ? (
        <AvatarImage src={picUrl} alt={cleanUsername} onError={handleImageError} />
      ) : null}
      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
        {isLoading ? (
          <div className="animate-pulse">
            <User className={fallbackSizes[size]} />
          </div>
        ) : (
          initial
        )}
      </AvatarFallback>
    </Avatar>
  );
}
