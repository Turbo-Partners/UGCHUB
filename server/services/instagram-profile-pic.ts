import { db } from '../db';
import {
  users,
  instagramAccounts,
  instagramProfiles,
  instagramMessages,
  instagramContacts,
} from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { objectStorageClient } from '../lib/object-storage';

const FACEBOOK_GRAPH_BASE_URL = 'https://graph.facebook.com/v21.0';

const BUCKET_ID = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
const PUBLIC_PATHS = process.env.PUBLIC_OBJECT_SEARCH_PATHS;

function getStorageConfig() {
  if (!BUCKET_ID) {
    throw new Error('DEFAULT_OBJECT_STORAGE_BUCKET_ID not configured');
  }
  if (!PUBLIC_PATHS) {
    throw new Error('PUBLIC_OBJECT_SEARCH_PATHS not configured');
  }
  const firstPublicPath = PUBLIC_PATHS.split(',')[0].trim();
  return { bucketId: BUCKET_ID, publicPath: firstPublicPath };
}

export interface ProfilePicResult {
  username: string;
  storagePath: string | null;
  publicUrl: string | null;
  fullName?: string | null;
  isVerified?: boolean;
  cached: boolean;
}

export async function getOrFetchProfilePic(username: string): Promise<ProfilePicResult> {
  const cleanUsername = username.replace('@', '').trim().toLowerCase();

  if (!cleanUsername) {
    return { username: '', storagePath: null, publicUrl: null, cached: false };
  }

  try {
    const existing = await db
      .select()
      .from(instagramProfiles)
      .where(sql`LOWER(${instagramProfiles.username}) = ${cleanUsername}`)
      .limit(1);

    if (existing.length > 0 && existing[0].profilePicStoragePath) {
      const record = existing[0];
      const publicUrl = getPublicUrl(record.profilePicStoragePath!);
      return {
        username: cleanUsername,
        storagePath: record.profilePicStoragePath,
        publicUrl,
        fullName: record.fullName,
        isVerified: record.isVerified || false,
        cached: true,
      };
    }

    const localPicUrl = await findProfilePicInLocalDB(cleanUsername);
    if (localPicUrl) {
      const storagePath = await downloadAndSaveToStorage(cleanUsername, localPicUrl);
      if (storagePath) {
        await db
          .update(instagramProfiles)
          .set({ profilePicStoragePath: storagePath, profilePicOriginalUrl: localPicUrl })
          .where(sql`LOWER(${instagramProfiles.username}) = ${cleanUsername}`);

        return {
          username: cleanUsername,
          storagePath,
          publicUrl: getPublicUrl(storagePath),
          cached: true,
        };
      }
      console.log(
        `[ProfilePic] Local DB URL expired/failed for @${cleanUsername}, trying other sources...`,
      );
    }

    // Step 3: Try Business Discovery API (FREE - $0 cost)
    const bizPicUrl = await tryBusinessDiscoveryPic(cleanUsername);
    if (bizPicUrl) {
      console.log(`[ProfilePic] Found via Business Discovery for @${cleanUsername}`);
      const storagePath = await downloadAndSaveToStorage(cleanUsername, bizPicUrl);
      await db
        .insert(instagramProfiles)
        .values({
          username: cleanUsername,
          ownerType: 'external',
          source: 'manual',
          profilePicUrl: bizPicUrl,
          profilePicStoragePath: storagePath,
          profilePicOriginalUrl: bizPicUrl,
          lastFetchedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [instagramProfiles.username, instagramProfiles.ownerType],
          set: {
            profilePicUrl: bizPicUrl,
            profilePicStoragePath: storagePath,
            profilePicOriginalUrl: bizPicUrl,
            lastFetchedAt: new Date(),
            updatedAt: new Date(),
          },
        });
      return {
        username: cleanUsername,
        storagePath,
        publicUrl: storagePath ? getPublicUrl(storagePath) : null,
        cached: true,
      };
    }

    const userProfilePicUrl = await tryUserProfileAPIPic(cleanUsername);
    if (userProfilePicUrl) {
      console.log(`[ProfilePic] Found via User Profile API (IGSID) for @${cleanUsername}`);
      const storagePath = await downloadAndSaveToStorage(cleanUsername, userProfilePicUrl);
      await db
        .insert(instagramProfiles)
        .values({
          username: cleanUsername,
          ownerType: 'external',
          source: 'manual',
          profilePicUrl: userProfilePicUrl,
          profilePicStoragePath: storagePath,
          profilePicOriginalUrl: userProfilePicUrl,
          lastFetchedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [instagramProfiles.username, instagramProfiles.ownerType],
          set: {
            profilePicUrl: userProfilePicUrl,
            profilePicStoragePath: storagePath,
            profilePicOriginalUrl: userProfilePicUrl,
            lastFetchedAt: new Date(),
            updatedAt: new Date(),
          },
        });
      return {
        username: cleanUsername,
        storagePath,
        publicUrl: storagePath ? getPublicUrl(storagePath) : null,
        cached: true,
      };
    }

    // Step 4: Apify as last resort (PAID ~$0.002/profile, batched)
    try {
      const { queueProfileScrape } = await import('../services/apify');
      const apifyResult = await queueProfileScrape(cleanUsername, { triggeredBy: 'on_demand' });

      if (apifyResult?.profilePicUrl) {
        console.log(`[ProfilePic] Found via Apify for @${cleanUsername} (~$0.002)`);
        const storagePath = await downloadAndSaveToStorage(
          cleanUsername,
          apifyResult.profilePicUrl,
        );
        await db
          .insert(instagramProfiles)
          .values({
            username: cleanUsername,
            ownerType: 'external',
            source: 'apify',
            profilePicUrl: apifyResult.profilePicUrl,
            profilePicStoragePath: storagePath,
            profilePicOriginalUrl: apifyResult.profilePicUrl,
            fullName: apifyResult.fullName || null,
            isVerified: apifyResult.isVerified || false,
            followers: apifyResult.followersCount || null,
            lastFetchedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [instagramProfiles.username, instagramProfiles.ownerType],
            set: {
              profilePicUrl: apifyResult.profilePicUrl,
              profilePicStoragePath: storagePath,
              profilePicOriginalUrl: apifyResult.profilePicUrl,
              fullName: apifyResult.fullName || null,
              isVerified: apifyResult.isVerified || false,
              lastFetchedAt: new Date(),
              updatedAt: new Date(),
            },
          });
        return {
          username: cleanUsername,
          storagePath,
          publicUrl: storagePath ? getPublicUrl(storagePath) : null,
          fullName: apifyResult.fullName,
          isVerified: apifyResult.isVerified || false,
          cached: true,
        };
      }
    } catch (apifyError) {
      console.error(`[ProfilePic] Apify fallback failed for @${cleanUsername}:`, apifyError);
    }

    console.log(
      `[ProfilePic] No pic found for @${cleanUsername} after all sources (including Apify)`,
    );
    return { username: cleanUsername, storagePath: null, publicUrl: null, cached: false };
  } catch (error) {
    console.error(`[ProfilePic] Error getting profile pic for ${cleanUsername}:`, error);
    return { username: cleanUsername, storagePath: null, publicUrl: null, cached: false };
  }
}

export async function downloadAndSaveToStorage(
  username: string,
  imageUrl: string,
): Promise<string | null> {
  try {
    const { bucketId, publicPath } = getStorageConfig();

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CreatorConnect/1.0)',
        Accept: 'image/*,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error(
        `[ProfilePic] Download failed: ${response.status} for ${imageUrl.substring(0, 80)}...`,
      );
      return null;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const extension = contentType.includes('png') ? 'png' : 'jpg';
    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length < 200) {
      console.error(
        `[ProfilePic] Image too small (${buffer.length} bytes) for @${username}, likely placeholder`,
      );
      return null;
    }

    const fileName = `instagram-profiles/${username}.${extension}`;
    const { bucketName, objectName } = parsePublicPath(publicPath, fileName);

    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    await file.save(buffer, {
      contentType,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });

    return fileName;
  } catch (error) {
    console.error(`[ProfilePic] Error saving to storage for @${username}:`, error);
    return null;
  }
}

function parsePublicPath(
  publicPath: string,
  fileName: string,
): { bucketName: string; objectName: string } {
  const cleanPath = publicPath.startsWith('/') ? publicPath.slice(1) : publicPath;
  const parts = cleanPath.split('/');
  const bucketName = parts[0];
  const basePath = parts.slice(1).join('/');
  const objectName = basePath ? `${basePath}/${fileName}` : fileName;
  return { bucketName, objectName };
}

export function getPublicUrl(storagePath: string): string {
  return `/api/storage/public/${storagePath}`;
}

function isObjectStorageUrl(url: string | null | undefined): boolean {
  return !!url && url.startsWith('/api/storage/');
}

async function findProfilePicInLocalDB(username: string): Promise<string | null> {
  const cleanUsername = username.toLowerCase();

  try {
    const userResult = await db
      .select({ pic: users.instagramProfilePic, avatar: users.avatar })
      .from(users)
      .where(sql`LOWER(REPLACE(${users.instagram}, '@', '')) = ${cleanUsername}`)
      .limit(1);

    if (userResult.length > 0) {
      if (isObjectStorageUrl(userResult[0].pic)) return userResult[0].pic;
      if (isObjectStorageUrl(userResult[0].avatar)) return userResult[0].avatar;
    }

    const cacheResult = await db
      .select({ storagePath: instagramProfiles.profilePicStoragePath })
      .from(instagramProfiles)
      .where(sql`LOWER(${instagramProfiles.username}) = ${cleanUsername}`)
      .limit(1);

    if (cacheResult.length > 0 && cacheResult[0].storagePath) {
      return getPublicUrl(cacheResult[0].storagePath);
    }

    return null;
  } catch (error) {
    console.error(`[ProfilePic LOCAL] Error searching local DB for ${cleanUsername}:`, error);
    return null;
  }
}

async function tryBusinessDiscoveryPic(targetUsername: string): Promise<string | null> {
  try {
    const accounts = await db
      .select()
      .from(instagramAccounts)
      .where(
        sql`${instagramAccounts.accessToken} IS NOT NULL AND ${instagramAccounts.instagramUserId} IS NOT NULL`,
      )
      .limit(1);

    if (!accounts.length) return null;

    const account = accounts[0];
    if (account.username?.toLowerCase() === targetUsername) return null;

    const apiUrl = `https://graph.instagram.com/v21.0/${account.instagramUserId}?fields=business_discovery.fields(username,name,profile_picture_url).username(${targetUsername})&access_token=${account.accessToken}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.error || !data.business_discovery) {
      console.log(`[ProfilePic BizDiscovery] No data for @${targetUsername}`);
      return null;
    }

    return data.business_discovery.profile_picture_url || null;
  } catch (error) {
    console.error(`[ProfilePic BizDiscovery] Error for @${targetUsername}:`, error);
    return null;
  }
}

async function tryUserProfileAPIPic(targetUsername: string): Promise<string | null> {
  try {
    const cleanUsername = targetUsername.toLowerCase().replace('@', '');

    const contactResult = await db
      .select({
        igsid: instagramContacts.instagramUserId,
        companyId: instagramContacts.companyId,
      })
      .from(instagramContacts)
      .where(
        sql`LOWER(${instagramContacts.username}) = ${cleanUsername} AND ${instagramContacts.instagramUserId} IS NOT NULL`,
      )
      .limit(1);

    let igsid: string | null = contactResult[0]?.igsid || null;
    const companyId: number | null = contactResult[0]?.companyId || null;

    if (!igsid) {
      const msgResult = await db
        .select({
          senderId: instagramMessages.senderId,
          accountId: instagramMessages.instagramAccountId,
        })
        .from(instagramMessages)
        .where(
          sql`LOWER(${instagramMessages.senderUsername}) = ${cleanUsername} AND ${instagramMessages.senderId} IS NOT NULL AND ${instagramMessages.senderId} != ''`,
        )
        .limit(1);
      igsid = msgResult[0]?.senderId || null;
    }

    if (!igsid) return null;

    let account: { accessToken: string | null } | null = null;
    if (companyId) {
      const [companyAccount] = await db
        .select({ accessToken: instagramAccounts.accessToken })
        .from(instagramAccounts)
        .where(
          sql`${instagramAccounts.companyId} = ${companyId} AND ${instagramAccounts.accessToken} IS NOT NULL`,
        )
        .limit(1);
      account = companyAccount || null;
    }
    if (!account) {
      const [anyAccount] = await db
        .select({ accessToken: instagramAccounts.accessToken })
        .from(instagramAccounts)
        .where(sql`${instagramAccounts.accessToken} IS NOT NULL`)
        .limit(1);
      account = anyAccount || null;
    }

    if (!account?.accessToken) return null;

    const response = await fetch(
      `${FACEBOOK_GRAPH_BASE_URL}/${igsid}?fields=name,profile_pic&access_token=${account.accessToken}`,
    );

    if (!response.ok) {
      console.log(
        `[ProfilePic UserProfileAPI] API error for @${cleanUsername} (IGSID: ${igsid}): ${response.status}`,
      );
      return null;
    }

    const data = await response.json();
    if (data.profile_pic) {
      console.log(`[ProfilePic UserProfileAPI] Found pic for @${cleanUsername} via IGSID`);
      return data.profile_pic;
    }

    return null;
  } catch (error) {
    console.error(`[ProfilePic UserProfileAPI] Error for @${targetUsername}:`, error);
    return null;
  }
}

export { tryUserProfileAPIPic };

export async function batchGetOrFetchProfilePics(usernames: string[]): Promise<ProfilePicResult[]> {
  const cleanUsernames = usernames
    .map((u) => u.replace('@', '').trim().toLowerCase())
    .filter(Boolean);

  if (cleanUsernames.length === 0) return [];

  const uniqueUsernames = Array.from(new Set(cleanUsernames));
  const results: Map<string, ProfilePicResult> = new Map();
  const needLocalDB: string[] = [];
  const needBizDiscovery: string[] = [];
  const needUserProfileAPI: string[] = [];
  const needApify: string[] = [];

  console.log(`[ProfilePic Batch] Starting batch for ${uniqueUsernames.length} usernames`);

  for (const username of uniqueUsernames) {
    try {
      const existing = await db
        .select()
        .from(instagramProfiles)
        .where(sql`LOWER(${instagramProfiles.username}) = ${username}`)
        .limit(1);

      if (existing.length > 0 && existing[0].profilePicStoragePath) {
        const record = existing[0];
        results.set(username, {
          username,
          storagePath: record.profilePicStoragePath,
          publicUrl: getPublicUrl(record.profilePicStoragePath!),
          fullName: record.fullName,
          isVerified: record.isVerified || false,
          cached: true,
        });
      } else if (existing.length > 0 && existing[0].profilePicUrl) {
        const record = existing[0];
        const storagePath = await downloadAndSaveToStorage(username, record.profilePicUrl!);
        if (storagePath) {
          await db
            .update(instagramProfiles)
            .set({
              profilePicStoragePath: storagePath,
              profilePicOriginalUrl: record.profilePicUrl,
            })
            .where(sql`LOWER(${instagramProfiles.username}) = ${username}`);
          results.set(username, {
            username,
            storagePath,
            publicUrl: getPublicUrl(storagePath),
            fullName: record.fullName,
            isVerified: record.isVerified || false,
            cached: true,
          });
        } else {
          needLocalDB.push(username);
        }
      } else {
        needLocalDB.push(username);
      }
    } catch {
      needLocalDB.push(username);
    }
  }

  console.log(
    `[ProfilePic Batch] ${results.size} found in cache, ${needLocalDB.length} need local DB check`,
  );

  for (const username of needLocalDB) {
    const localPicUrl = await findProfilePicInLocalDB(username);
    if (localPicUrl) {
      if (localPicUrl.startsWith('/api/storage/')) {
        results.set(username, {
          username,
          storagePath: localPicUrl.replace('/api/storage/public/', ''),
          publicUrl: localPicUrl,
          cached: true,
        });
        continue;
      }
      const storagePath = await downloadAndSaveToStorage(username, localPicUrl);
      if (storagePath) {
        await db
          .update(instagramProfiles)
          .set({ profilePicStoragePath: storagePath, profilePicOriginalUrl: localPicUrl })
          .where(sql`LOWER(${instagramProfiles.username}) = ${username}`);
        results.set(username, {
          username,
          storagePath,
          publicUrl: getPublicUrl(storagePath),
          cached: true,
        });
      } else {
        needBizDiscovery.push(username);
      }
    } else {
      needBizDiscovery.push(username);
    }
  }

  console.log(`[ProfilePic Batch] ${needBizDiscovery.length} need Business Discovery check`);

  const bizResults = await Promise.allSettled(
    needBizDiscovery.map(async (username) => {
      const bizPicUrl = await tryBusinessDiscoveryPic(username);
      return { username, bizPicUrl };
    }),
  );

  for (const result of bizResults) {
    if (result.status === 'fulfilled' && result.value.bizPicUrl) {
      const { username, bizPicUrl } = result.value;
      const storagePath = await downloadAndSaveToStorage(username, bizPicUrl);
      await db
        .insert(instagramProfiles)
        .values({
          username,
          ownerType: 'external',
          source: 'manual',
          profilePicUrl: bizPicUrl,
          profilePicStoragePath: storagePath,
          profilePicOriginalUrl: bizPicUrl,
          lastFetchedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [instagramProfiles.username, instagramProfiles.ownerType],
          set: {
            profilePicUrl: bizPicUrl,
            profilePicStoragePath: storagePath,
            profilePicOriginalUrl: bizPicUrl,
            lastFetchedAt: new Date(),
            updatedAt: new Date(),
          },
        });
      results.set(username, {
        username,
        storagePath,
        publicUrl: storagePath ? getPublicUrl(storagePath) : null,
        cached: true,
      });
    } else if (result.status === 'fulfilled') {
      needUserProfileAPI.push(result.value.username);
    } else {
      const username = needBizDiscovery[bizResults.indexOf(result)];
      if (username) needUserProfileAPI.push(username);
    }
  }

  if (needUserProfileAPI.length > 0) {
    console.log(
      `[ProfilePic Batch] ${needUserProfileAPI.length} need User Profile API (IGSID) check`,
    );
    const userProfileResults = await Promise.allSettled(
      needUserProfileAPI.map(async (username) => {
        const picUrl = await tryUserProfileAPIPic(username);
        return { username, picUrl };
      }),
    );

    for (const result of userProfileResults) {
      if (result.status === 'fulfilled' && result.value.picUrl) {
        const { username, picUrl } = result.value;
        const storagePath = await downloadAndSaveToStorage(username, picUrl);
        await db
          .insert(instagramProfiles)
          .values({
            username,
            ownerType: 'external',
            source: 'manual',
            profilePicUrl: picUrl,
            profilePicStoragePath: storagePath,
            profilePicOriginalUrl: picUrl,
            lastFetchedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [instagramProfiles.username, instagramProfiles.ownerType],
            set: {
              profilePicUrl: picUrl,
              profilePicStoragePath: storagePath,
              profilePicOriginalUrl: picUrl,
              lastFetchedAt: new Date(),
              updatedAt: new Date(),
            },
          });
        results.set(username, {
          username,
          storagePath,
          publicUrl: storagePath ? getPublicUrl(storagePath) : null,
          cached: true,
        });
      } else if (result.status === 'fulfilled') {
        needApify.push(result.value.username);
      } else {
        const username = needUserProfileAPI[userProfileResults.indexOf(result)];
        if (username) needApify.push(username);
      }
    }
  }

  if (needApify.length > 0) {
    console.log(`[ProfilePic Batch] ${needApify.length} need Apify (SINGLE batch call)`);
    try {
      const { scrapeProfiles } = await import('../services/apify');
      const apifyResults = await scrapeProfiles(needApify);

      const apifyMap = new Map<string, any>();
      for (const r of apifyResults) {
        if (r.username) {
          apifyMap.set(r.username.toLowerCase(), r);
        }
      }

      for (const username of needApify) {
        const apifyData = apifyMap.get(username);
        if (apifyData?.profilePicUrl) {
          const storagePath = await downloadAndSaveToStorage(username, apifyData.profilePicUrl);
          await db
            .insert(instagramProfiles)
            .values({
              username,
              ownerType: 'external',
              source: 'apify',
              profilePicUrl: apifyData.profilePicUrl,
              profilePicStoragePath: storagePath,
              profilePicOriginalUrl: apifyData.profilePicUrl,
              fullName: apifyData.fullName || null,
              isVerified: apifyData.isVerified || false,
              followers: apifyData.followersCount || null,
              lastFetchedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [instagramProfiles.username, instagramProfiles.ownerType],
              set: {
                profilePicUrl: apifyData.profilePicUrl,
                profilePicStoragePath: storagePath,
                profilePicOriginalUrl: apifyData.profilePicUrl,
                fullName: apifyData.fullName || null,
                isVerified: apifyData.isVerified || false,
                lastFetchedAt: new Date(),
                updatedAt: new Date(),
              },
            });
          results.set(username, {
            username,
            storagePath,
            publicUrl: storagePath ? getPublicUrl(storagePath) : null,
            fullName: apifyData.fullName,
            isVerified: apifyData.isVerified || false,
            cached: true,
          });
        } else {
          results.set(username, { username, storagePath: null, publicUrl: null, cached: false });
        }
      }
      console.log(
        `[ProfilePic Batch] Apify returned ${apifyResults.length} results for ${needApify.length} usernames`,
      );
    } catch (apifyError) {
      console.error(`[ProfilePic Batch] Apify batch call failed:`, apifyError);
      for (const username of needApify) {
        results.set(username, { username, storagePath: null, publicUrl: null, cached: false });
      }
    }
  }

  for (const username of uniqueUsernames) {
    if (!results.has(username)) {
      results.set(username, { username, storagePath: null, publicUrl: null, cached: false });
    }
  }

  console.log(
    `[ProfilePic Batch] Complete: ${results.size} total, ${needApify.length > 0 ? '1 Apify call' : '0 Apify calls'}`,
  );

  return uniqueUsernames.map((u) => results.get(u)!);
}

export async function refreshProfilePic(username: string): Promise<ProfilePicResult> {
  const cleanUsername = username.replace('@', '').trim().toLowerCase();

  await db
    .update(instagramProfiles)
    .set({ profilePicStoragePath: null, profilePicOriginalUrl: null })
    .where(sql`LOWER(${instagramProfiles.username}) = ${cleanUsername}`);

  return getOrFetchProfilePic(cleanUsername);
}
