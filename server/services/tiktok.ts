/**
 * TikTok API v2 - Native Integration Service
 *
 * Handles OAuth token management and data fetching from TikTok's official API.
 * Follows the same patterns as the Instagram integration.
 *
 * API Reference: https://developers.tiktok.com/doc/overview/
 */

const TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const TIKTOK_REVOKE_URL = "https://open.tiktokapis.com/v2/oauth/revoke/";
const TIKTOK_USER_INFO_URL = "https://open.tiktokapis.com/v2/user/info/";
const TIKTOK_VIDEO_LIST_URL = "https://open.tiktokapis.com/v2/video/list/";

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET!;
const TIKTOK_REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI!;

// Scopes we request from TikTok
const TIKTOK_SCOPES = [
  "user.info.basic",
  "user.info.profile",
  "user.info.stats",
  "video.list",
];

// ==================== Types ====================

export interface TikTokTokenResponse {
  open_id: string;
  scope: string;
  access_token: string;
  expires_in: number; // seconds
  refresh_token: string;
  refresh_expires_in: number; // seconds
  token_type: string;
}

export interface TikTokUserInfo {
  open_id: string;
  union_id?: string;
  avatar_url?: string;
  avatar_url_100?: string;
  avatar_large_url?: string;
  display_name?: string;
  bio_description?: string;
  profile_deep_link?: string;
  is_verified?: boolean;
  username?: string;
  follower_count?: number;
  following_count?: number;
  likes_count?: number;
  video_count?: number;
}

export interface TikTokVideo {
  id: string;
  title?: string;
  description?: string; // same as caption
  cover_image_url?: string;
  video_description?: string;
  duration?: number; // seconds
  create_time?: number; // unix timestamp
  share_url?: string;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  view_count?: number;
}

export interface TikTokVideoListResponse {
  videos: TikTokVideo[];
  cursor: number;
  has_more: boolean;
}

export interface TikTokApiError {
  code: string;
  message: string;
  log_id?: string;
}

// ==================== Helper ====================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tiktokFetch(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) return response;

      // Rate limit
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get("retry-after") || "60", 10);
        console.log(`[TikTok API] Rate limit hit, waiting ${retryAfter}s (attempt ${attempt + 1}/${maxRetries + 1})`);
        if (attempt < maxRetries) {
          await delay(retryAfter * 1000);
          continue;
        }
      }

      // Transient server errors
      if (response.status >= 500 && attempt < maxRetries) {
        const delayMs = Math.min(5000 * Math.pow(2, attempt), 60000);
        console.log(`[TikTok API] Server error ${response.status}, retrying in ${delayMs / 1000}s`);
        await delay(delayMs);
        continue;
      }

      return response;
    } catch (error) {
      if (attempt < maxRetries) {
        const delayMs = Math.min(5000 * Math.pow(2, attempt), 60000);
        console.log(`[TikTok API] Network error, retrying in ${delayMs / 1000}s:`, error);
        await delay(delayMs);
      } else {
        throw error;
      }
    }
  }
  throw new Error("[TikTok API] Max retries exceeded");
}

// ==================== OAuth ====================

/**
 * Build the TikTok OAuth authorization URL.
 */
export function buildAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_key: TIKTOK_CLIENT_KEY,
    response_type: "code",
    scope: TIKTOK_SCOPES.join(","),
    redirect_uri: TIKTOK_REDIRECT_URI,
    state,
  });
  return `${TIKTOK_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange an authorization code for access + refresh tokens.
 */
export async function exchangeCodeForToken(code: string): Promise<TikTokTokenResponse> {
  const response = await tiktokFetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY,
      client_secret: TIKTOK_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: TIKTOK_REDIRECT_URI,
    }),
  });

  const data = await response.json() as any;

  if (data.error || !data.access_token) {
    const errMsg = data.error_description || data.error || "Unknown error";
    console.error("[TikTok OAuth] Token exchange failed:", data);
    throw new Error(`TikTok token exchange failed: ${errMsg}`);
  }

  return {
    open_id: data.open_id,
    scope: data.scope,
    access_token: data.access_token,
    expires_in: data.expires_in,
    refresh_token: data.refresh_token,
    refresh_expires_in: data.refresh_expires_in,
    token_type: data.token_type,
  };
}

/**
 * Refresh an expired access token using the refresh token.
 * Refresh tokens are valid for 365 days.
 */
export async function refreshAccessToken(refreshToken: string): Promise<TikTokTokenResponse> {
  const response = await tiktokFetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY,
      client_secret: TIKTOK_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json() as any;

  if (data.error || !data.access_token) {
    const errMsg = data.error_description || data.error || "Unknown error";
    console.error("[TikTok OAuth] Token refresh failed:", data);
    throw new Error(`TikTok token refresh failed: ${errMsg}`);
  }

  return {
    open_id: data.open_id,
    scope: data.scope,
    access_token: data.access_token,
    expires_in: data.expires_in,
    refresh_token: data.refresh_token,
    refresh_expires_in: data.refresh_expires_in,
    token_type: data.token_type,
  };
}

/**
 * Revoke an access token (disconnect account).
 */
export async function revokeToken(accessToken: string): Promise<void> {
  const response = await tiktokFetch(TIKTOK_REVOKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY,
      token: accessToken,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as any;
    console.error("[TikTok OAuth] Token revoke failed:", data);
    // Don't throw - we still want to clean up locally even if revoke fails
  }
}

// ==================== User Data ====================

/**
 * Fetch the authenticated user's profile info.
 * Requires scopes: user.info.basic, user.info.profile, user.info.stats
 */
export async function getUserInfo(accessToken: string): Promise<TikTokUserInfo> {
  const fields = [
    // user.info.basic
    "open_id",
    "union_id",
    "avatar_url",
    "avatar_url_100",
    "avatar_large_url",
    "display_name",
    "bio_description",
    "profile_deep_link",
    "is_verified",
    "username",
    // user.info.profile (currently same endpoint)
    // user.info.stats
    "follower_count",
    "following_count",
    "likes_count",
    "video_count",
  ];

  const url = `${TIKTOK_USER_INFO_URL}?fields=${fields.join(",")}`;

  const response = await tiktokFetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const result = await response.json() as any;

  if (result.error?.code !== "ok" && result.error?.code) {
    console.error("[TikTok API] getUserInfo failed:", result.error);
    throw new Error(`TikTok getUserInfo failed: ${result.error.message || result.error.code}`);
  }

  return result.data?.user || {};
}

/**
 * Fetch the authenticated user's video list (paginated).
 * Requires scope: video.list
 */
export async function listUserVideos(
  accessToken: string,
  cursor?: number,
  maxCount: number = 20,
): Promise<TikTokVideoListResponse> {
  const fields = [
    "id",
    "title",
    "video_description",
    "cover_image_url",
    "duration",
    "create_time",
    "share_url",
    "like_count",
    "comment_count",
    "share_count",
    "view_count",
  ];

  const body: Record<string, any> = { max_count: maxCount };
  if (cursor) {
    body.cursor = cursor;
  }

  const url = `${TIKTOK_VIDEO_LIST_URL}?fields=${fields.join(",")}`;

  const response = await tiktokFetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const result = await response.json() as any;

  if (result.error?.code !== "ok" && result.error?.code) {
    console.error("[TikTok API] listUserVideos failed:", result.error);
    throw new Error(`TikTok listUserVideos failed: ${result.error.message || result.error.code}`);
  }

  return {
    videos: result.data?.videos || [],
    cursor: result.data?.cursor || 0,
    has_more: result.data?.has_more || false,
  };
}

// ==================== Token Helpers ====================

/**
 * Check if an access token is expired (or about to expire in 5 minutes).
 */
export function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  const bufferMs = 5 * 60 * 1000; // 5 min buffer
  return new Date().getTime() >= expiresAt.getTime() - bufferMs;
}

/**
 * Check if a refresh token is expired.
 */
export function isRefreshTokenExpired(refreshExpiresAt: Date | null): boolean {
  if (!refreshExpiresAt) return true;
  return new Date().getTime() >= refreshExpiresAt.getTime();
}

/**
 * Calculate the expiration date from an expires_in value (seconds).
 */
export function calculateExpiresAt(expiresInSeconds: number): Date {
  return new Date(Date.now() + expiresInSeconds * 1000);
}

/**
 * Get the TikTok scopes we request.
 */
export function getScopes(): string[] {
  return [...TIKTOK_SCOPES];
}
