import { db } from "../db";
import { instagramContacts, instagramInteractions } from "@shared/schema";
import type { InstagramContact, InstagramInteraction } from "@shared/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";

export async function upsertContact(
  companyId: number,
  data: {
    username: string;
    instagramUserId?: string;
    fullName?: string;
    profilePicUrl?: string;
    instagramProfileId?: number;
    userId?: number;
    followers?: number;
    isVerified?: boolean;
    bio?: string;
  }
): Promise<InstagramContact> {
  const normalizedUsername = data.username.toLowerCase().replace("@", "");

  const [contact] = await db
    .insert(instagramContacts)
    .values({
      companyId,
      username: normalizedUsername,
      instagramUserId: data.instagramUserId,
      fullName: data.fullName,
      profilePicUrl: data.profilePicUrl,
      instagramProfileId: data.instagramProfileId,
      userId: data.userId,
      followers: data.followers,
      isVerified: data.isVerified,
      bio: data.bio,
    })
    .onConflictDoUpdate({
      target: [instagramContacts.companyId, instagramContacts.username],
      set: {
        ...(data.instagramUserId ? { instagramUserId: data.instagramUserId } : {}),
        ...(data.fullName ? { fullName: data.fullName } : {}),
        ...(data.profilePicUrl ? { profilePicUrl: data.profilePicUrl } : {}),
        ...(data.instagramProfileId ? { instagramProfileId: data.instagramProfileId } : {}),
        ...(data.userId ? { userId: data.userId } : {}),
        ...(data.followers !== undefined ? { followers: data.followers } : {}),
        ...(data.isVerified !== undefined ? { isVerified: data.isVerified } : {}),
        ...(data.bio ? { bio: data.bio } : {}),
        updatedAt: new Date(),
      },
    })
    .returning();

  console.log(`[Contacts] Upserted contact ${normalizedUsername} for company ${companyId} (id: ${contact.id})`);
  return contact;
}

function getCounterField(type: string): string | null {
  switch (type) {
    case "dm_received": return "totalDmsReceived";
    case "dm_sent": return "totalDmsSent";
    case "comment_on_post": return "totalCommentsOnPosts";
    case "mention": return "totalMentions";
    case "story_reply": return "totalStoryReplies";
    case "tagged_post": return "totalTaggedPosts";
    default: return null;
  }
}

function calculateScore(counters: {
  totalDmsReceived: number;
  totalDmsSent: number;
  totalCommentsOnPosts: number;
  totalMentions: number;
  totalStoryReplies: number;
  totalTaggedPosts: number;
}): number {
  return (
    (counters.totalDmsReceived * 3) +
    (counters.totalDmsSent * 2) +
    (counters.totalCommentsOnPosts * 5) +
    (counters.totalMentions * 4) +
    (counters.totalStoryReplies * 3) +
    (counters.totalTaggedPosts * 4)
  );
}

export async function recordInteraction(data: {
  contactId: number;
  companyId: number;
  type: typeof import("@shared/schema").instagramInteractionTypeEnum[number];
  referenceId?: string;
  contentPreview?: string;
  metadata?: any;
  occurredAt: Date;
}): Promise<void> {
  if (data.referenceId) {
    const [existing] = await db
      .select({ id: instagramInteractions.id })
      .from(instagramInteractions)
      .where(
        and(
          eq(instagramInteractions.contactId, data.contactId),
          eq(instagramInteractions.type, data.type),
          eq(instagramInteractions.referenceId, data.referenceId)
        )
      )
      .limit(1);

    if (existing) return;
  }

  await db.insert(instagramInteractions).values({
    contactId: data.contactId,
    companyId: data.companyId,
    type: data.type,
    referenceId: data.referenceId,
    contentPreview: data.contentPreview,
    metadata: data.metadata,
    occurredAt: data.occurredAt,
  });

  const counterField = getCounterField(data.type);
  const counterUpdate: Record<string, any> = {};
  if (counterField) {
    counterUpdate[counterField] = sql`COALESCE(${instagramContacts[counterField as keyof typeof instagramContacts]}, 0) + 1`;
  }

  const [contact] = await db
    .select({
      firstInteractionAt: instagramContacts.firstInteractionAt,
      lastInteractionAt: instagramContacts.lastInteractionAt,
      totalDmsReceived: instagramContacts.totalDmsReceived,
      totalDmsSent: instagramContacts.totalDmsSent,
      totalCommentsOnPosts: instagramContacts.totalCommentsOnPosts,
      totalMentions: instagramContacts.totalMentions,
      totalStoryReplies: instagramContacts.totalStoryReplies,
      totalTaggedPosts: instagramContacts.totalTaggedPosts,
    })
    .from(instagramContacts)
    .where(eq(instagramContacts.id, data.contactId))
    .limit(1);

  if (!contact) return;

  const updatedCounters = {
    totalDmsReceived: (contact.totalDmsReceived || 0) + (data.type === "dm_received" ? 1 : 0),
    totalDmsSent: (contact.totalDmsSent || 0) + (data.type === "dm_sent" ? 1 : 0),
    totalCommentsOnPosts: (contact.totalCommentsOnPosts || 0) + (data.type === "comment_on_post" ? 1 : 0),
    totalMentions: (contact.totalMentions || 0) + (data.type === "mention" ? 1 : 0),
    totalStoryReplies: (contact.totalStoryReplies || 0) + (data.type === "story_reply" ? 1 : 0),
    totalTaggedPosts: (contact.totalTaggedPosts || 0) + (data.type === "tagged_post" ? 1 : 0),
  };

  const newScore = calculateScore(updatedCounters);

  const updateSet: Record<string, any> = {
    ...updatedCounters,
    interactionScore: newScore,
    updatedAt: new Date(),
  };

  if (!contact.firstInteractionAt || data.occurredAt < contact.firstInteractionAt) {
    updateSet.firstInteractionAt = data.occurredAt;
  }

  if (!contact.lastInteractionAt || data.occurredAt > contact.lastInteractionAt) {
    updateSet.lastInteractionAt = data.occurredAt;
  }

  await db
    .update(instagramContacts)
    .set(updateSet)
    .where(eq(instagramContacts.id, data.contactId));
}

export async function recalculateContactScore(contactId: number): Promise<void> {
  const [contact] = await db
    .select({
      totalDmsReceived: instagramContacts.totalDmsReceived,
      totalDmsSent: instagramContacts.totalDmsSent,
      totalCommentsOnPosts: instagramContacts.totalCommentsOnPosts,
      totalMentions: instagramContacts.totalMentions,
      totalStoryReplies: instagramContacts.totalStoryReplies,
      totalTaggedPosts: instagramContacts.totalTaggedPosts,
    })
    .from(instagramContacts)
    .where(eq(instagramContacts.id, contactId))
    .limit(1);

  if (!contact) return;

  const score = calculateScore({
    totalDmsReceived: contact.totalDmsReceived || 0,
    totalDmsSent: contact.totalDmsSent || 0,
    totalCommentsOnPosts: contact.totalCommentsOnPosts || 0,
    totalMentions: contact.totalMentions || 0,
    totalStoryReplies: contact.totalStoryReplies || 0,
    totalTaggedPosts: contact.totalTaggedPosts || 0,
  });

  await db
    .update(instagramContacts)
    .set({ interactionScore: score, updatedAt: new Date() })
    .where(eq(instagramContacts.id, contactId));
}

export async function getContactByUsername(
  companyId: number,
  username: string
): Promise<InstagramContact | null> {
  const normalizedUsername = username.toLowerCase().replace("@", "");
  const [contact] = await db
    .select()
    .from(instagramContacts)
    .where(
      and(
        eq(instagramContacts.companyId, companyId),
        eq(instagramContacts.username, normalizedUsername)
      )
    )
    .limit(1);

  return contact || null;
}

export async function getContactsForCompany(
  companyId: number,
  options?: {
    status?: string;
    sortBy?: "score" | "lastInteraction" | "name";
    limit?: number;
    offset?: number;
  }
): Promise<InstagramContact[]> {
  const conditions = [eq(instagramContacts.companyId, companyId)];

  if (options?.status) {
    conditions.push(eq(instagramContacts.status, options.status as any));
  }

  let orderBy;
  switch (options?.sortBy) {
    case "score":
      orderBy = desc(instagramContacts.interactionScore);
      break;
    case "lastInteraction":
      orderBy = desc(instagramContacts.lastInteractionAt);
      break;
    case "name":
      orderBy = asc(instagramContacts.username);
      break;
    default:
      orderBy = desc(instagramContacts.interactionScore);
  }

  return db
    .select()
    .from(instagramContacts)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(options?.limit || 50)
    .offset(options?.offset || 0);
}

export async function getInteractionsForContact(
  contactId: number,
  options?: {
    type?: string;
    limit?: number;
    offset?: number;
  }
): Promise<InstagramInteraction[]> {
  const conditions = [eq(instagramInteractions.contactId, contactId)];

  if (options?.type) {
    conditions.push(eq(instagramInteractions.type, options.type as any));
  }

  return db
    .select()
    .from(instagramInteractions)
    .where(and(...conditions))
    .orderBy(desc(instagramInteractions.occurredAt))
    .limit(options?.limit || 50)
    .offset(options?.offset || 0);
}
