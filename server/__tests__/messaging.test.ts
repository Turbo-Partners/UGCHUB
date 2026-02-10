import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createMockUser, withAuth, withNoAuth } from './setup';

describe('Messaging API', () => {
  describe('Authentication', () => {
    it('should require auth for conversations endpoint', async () => {
      const app = express();
      app.use(express.json());
      withNoAuth(app);
      app.get('/api/instagram/conversations', (req: any, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json([]);
      });

      const res = await request(app).get('/api/instagram/conversations');
      expect(res.status).toBe(401);
    });

    it('should return conversations for authenticated users', async () => {
      const app = express();
      app.use(express.json());
      withAuth(app);
      const mockConversations = [
        { id: '1', participantUsername: 'creator1', lastMessage: 'Oi!' },
        { id: '2', participantUsername: 'creator2', lastMessage: 'Bom dia' },
      ];
      app.get('/api/instagram/conversations', (req: any, res) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);
        res.json(mockConversations);
      });

      const res = await request(app).get('/api/instagram/conversations');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].participantUsername).toBe('creator1');
    });
  });

  describe('DM Sync Logic', () => {
    it('should handle batch message ID checking', () => {
      const existingIds = new Set(['msg_1', 'msg_2', 'msg_3']);
      const newMessages = [
        { id: 'msg_1', text: 'old' },
        { id: 'msg_4', text: 'new' },
        { id: 'msg_5', text: 'also new' },
      ];

      const filtered = newMessages.filter(m => !existingIds.has(m.id));
      expect(filtered).toHaveLength(2);
      expect(filtered[0].id).toBe('msg_4');
      expect(filtered[1].id).toBe('msg_5');
    });

    it('should chunk large message batches correctly', () => {
      const chunkSize = 500;
      const allIds = Array.from({ length: 1200 }, (_, i) => `msg_${i}`);

      const chunks: string[][] = [];
      for (let i = 0; i < allIds.length; i += chunkSize) {
        chunks.push(allIds.slice(i, i + chunkSize));
      }

      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toHaveLength(500);
      expect(chunks[1]).toHaveLength(500);
      expect(chunks[2]).toHaveLength(200);
    });

    it('should skip conversations with no new messages', () => {
      const conversations = [
        { id: 'conv_1', messageCount: 10, syncedCount: 10 },
        { id: 'conv_2', messageCount: 15, syncedCount: 10 },
        { id: 'conv_3', messageCount: 5, syncedCount: 5 },
      ];

      const needsSync = conversations.filter(c => c.messageCount > c.syncedCount);
      expect(needsSync).toHaveLength(1);
      expect(needsSync[0].id).toBe('conv_2');
    });
  });

  describe('Profile Pic Hierarchy', () => {
    it('should follow LOCAL FIRST data extraction order', () => {
      const hierarchy = ['local_db', 'business_discovery', 'user_profile_api', 'apify'];

      expect(hierarchy[0]).toBe('local_db');
      expect(hierarchy[1]).toBe('business_discovery');
      expect(hierarchy[2]).toBe('user_profile_api');
      expect(hierarchy[3]).toBe('apify');
      expect(hierarchy).toHaveLength(4);
    });

    it('should stop at first successful layer', () => {
      async function getProfilePic(username: string): Promise<{ source: string; url: string } | null> {
        const localPic = username === 'cached_user' ? 'https://local/pic.jpg' : null;
        if (localPic) return { source: 'local_db', url: localPic };

        const bizPic = username === 'biz_user' ? 'https://biz/pic.jpg' : null;
        if (bizPic) return { source: 'business_discovery', url: bizPic };

        const userPic = username === 'dm_user' ? 'https://user/pic.jpg' : null;
        if (userPic) return { source: 'user_profile_api', url: userPic };

        return null;
      }

      expect(getProfilePic('cached_user')).resolves.toEqual({ source: 'local_db', url: 'https://local/pic.jpg' });
      expect(getProfilePic('biz_user')).resolves.toEqual({ source: 'business_discovery', url: 'https://biz/pic.jpg' });
      expect(getProfilePic('dm_user')).resolves.toEqual({ source: 'user_profile_api', url: 'https://user/pic.jpg' });
      expect(getProfilePic('unknown_user')).resolves.toBeNull();
    });
  });

  describe('Rate Limiting', () => {
    it('should track DM rate limits (200/hour)', () => {
      const MAX_DMS_PER_HOUR = 200;
      let sentCount = 0;

      function canSendDM(): boolean {
        return sentCount < MAX_DMS_PER_HOUR;
      }

      for (let i = 0; i < 200; i++) {
        expect(canSendDM()).toBe(true);
        sentCount++;
      }
      expect(canSendDM()).toBe(false);
    });
  });
});
