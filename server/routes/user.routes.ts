import type { Express, Request, Response } from 'express';
import { storage } from '../storage';
import { openai } from '../lib/openai';
import { triggerCreatorEnrichment } from '../jobs/autoEnrichmentJob';
import { db } from '../db';
import { creatorPosts, instagramProfiles } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

export function registerUserRoutes(app: Express): void {
  // ============================================================
  // USER PROFILE MANAGEMENT
  // ============================================================

  app.patch('/api/user/:id', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = parseInt(req.params.id);

    const effectiveUserId = req.session.impersonation
      ? req.session.impersonation.impersonatedUserId
      : req.user!.id;

    if (Number(effectiveUserId) !== userId) return res.sendStatus(403);

    try {
      console.log('[API] Updating user with data:', JSON.stringify(req.body, null, 2));

      const userData = { ...req.body };
      if (userData.instagramLastUpdated && typeof userData.instagramLastUpdated === 'string') {
        userData.instagramLastUpdated = new Date(userData.instagramLastUpdated);
      }

      const updatedUser = await storage.updateUser(userId, userData);
      res.json(updatedUser);

      if (updatedUser.role === 'creator' && updatedUser.instagram) {
        const needsEnrichment =
          updatedUser.instagramFollowers === null ||
          updatedUser.instagramFollowers === undefined ||
          updatedUser.instagramProfilePic === null ||
          updatedUser.instagramProfilePic === undefined ||
          updatedUser.instagramBio === null ||
          updatedUser.instagramBio === undefined;
        if (needsEnrichment) {
          triggerCreatorEnrichment(userId, updatedUser.instagram).catch(() => {});
        }
      }
    } catch (error) {
      console.error('[API] Error updating user:', error);
      console.error('[API] Request body was:', JSON.stringify(req.body, null, 2));
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  app.patch('/api/user', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const effectiveUserId = req.session.impersonation
      ? req.session.impersonation.impersonatedUserId
      : req.user!.id;

    try {
      const { name, phone, cpf, avatar } = req.body;
      const updateData: Record<string, any> = {};

      if (name !== undefined && typeof name === 'string') updateData.name = name.trim() || null;
      if (phone !== undefined && typeof phone === 'string') updateData.phone = phone.trim() || null;
      if (cpf !== undefined && typeof cpf === 'string') updateData.cpf = cpf.trim() || null;
      if (avatar !== undefined && (typeof avatar === 'string' || avatar === null))
        updateData.avatar = avatar;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
      }

      const updatedUser = await storage.updateUser(effectiveUserId, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error('[API] Error updating user:', error);
      res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
  });

  app.delete('/api/user', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const userId = req.user!.id;

    try {
      await storage.deleteUser(userId);

      req.logout((err) => {
        if (err) {
          console.error('[API] Error during logout after delete:', err);
        }
        req.session.destroy(() => {
          res.json({ success: true });
        });
      });
    } catch (error) {
      console.error('[API] Error deleting user:', error);
      res.status(500).json({ error: 'Erro ao deletar conta' });
    }
  });

  app.post('/api/user/change-password', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
    }

    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      if (user.googleId && !user.password) {
        return res.status(400).json({ error: 'Usuários com login Google não podem alterar senha' });
      }

      const { scrypt, timingSafeEqual, randomBytes } = await import('crypto');
      const { promisify } = await import('util');
      const scryptAsync = promisify(scrypt);

      const [hashed, salt] = (user.password || '').split('.');
      if (!hashed || !salt) {
        return res.status(400).json({ error: 'Senha atual inválida' });
      }

      const hashedBuf = Buffer.from(hashed, 'hex');
      const suppliedBuf = (await scryptAsync(currentPassword, salt, 64)) as Buffer;

      if (!timingSafeEqual(hashedBuf, suppliedBuf)) {
        return res.status(400).json({ error: 'Senha atual incorreta' });
      }

      const newSalt = randomBytes(16).toString('hex');
      const newHashedBuf = (await scryptAsync(newPassword, newSalt, 64)) as Buffer;
      const newHashedPassword = `${newHashedBuf.toString('hex')}.${newSalt}`;

      await storage.updateUser(userId, { password: newHashedPassword });

      res.json({ success: true });
    } catch (error) {
      console.error('[API] Error changing password:', error);
      res.status(500).json({ error: 'Erro ao alterar senha' });
    }
  });

  app.get('/api/users/:id', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const user = await storage.getUser(id);
    if (!user) return res.sendStatus(404);

    // Enrich with instagram external URL from instagramProfiles
    let instagramExternalUrl: string | null = null;
    if (user.instagram) {
      try {
        const cleanUsername = user.instagram.replace('@', '').trim().toLowerCase();
        const [profile] = await db
          .select({ externalUrl: instagramProfiles.externalUrl })
          .from(instagramProfiles)
          .where(sql`LOWER(${instagramProfiles.username}) = ${cleanUsername}`)
          .limit(1);
        instagramExternalUrl = profile?.externalUrl || null;
      } catch (err) {
        // Non-critical - continue without external URL
      }
    }

    res.json({ ...user, instagramExternalUrl });
  });

  // ============================================================
  // USER RATINGS & REVIEWS
  // ============================================================

  app.get('/api/users/:userId/rating', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const result = await storage.getCreatorAverageRating(userId);
      res.json(result);
    } catch (error) {
      console.error('[API] Error fetching user rating:', error);
      res.status(500).json({ error: 'Erro ao buscar avaliação' });
    }
  });

  app.get('/api/users/:userId/reviews', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const reviews = await storage.getCreatorReviews(userId);
      res.json(reviews);
    } catch (error) {
      console.error('[API] Error fetching user reviews:', error);
      res.status(500).json({ error: 'Erro ao buscar avaliações' });
    }
  });

  app.post('/api/users/:userId/reviews', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'company') return res.sendStatus(403);

    try {
      const creatorId = parseInt(req.params.userId);
      const companyId = req.session.activeCompanyId;
      if (!companyId) return res.status(400).json({ error: 'Empresa não selecionada' });

      const { rating, comment, campaignId } = req.body;
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating deve ser entre 1 e 5' });
      }

      const existing = await storage.getExistingReview(companyId, creatorId, campaignId || null);
      if (existing) {
        const updated = await storage.updateCreatorReview(existing.id, { rating, comment });
        return res.json(updated);
      }

      const review = await storage.createCreatorReview({
        creatorId,
        companyId,
        campaignId: campaignId || null,
        rating,
        comment: comment || null,
      });
      res.status(201).json(review);
    } catch (error) {
      console.error('[API] Error creating review:', error);
      res.status(500).json({ error: 'Erro ao criar avaliação' });
    }
  });

  app.get('/api/users/:userId/completed-jobs', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const userId = parseInt(req.params.userId);
      const jobs = await storage.getCreatorCompletedJobs(userId);
      res.json(jobs);
    } catch (error) {
      console.error('[API] Error fetching completed jobs:', error);
      res.status(500).json({ error: 'Erro ao buscar jobs concluídos' });
    }
  });

  app.get('/api/users/:userId/communities', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const userId = parseInt(req.params.userId);
      const communities = await storage.getCreatorCommunities(userId);
      res.json(communities);
    } catch (error) {
      console.error('[API] Error fetching communities:', error);
      res.status(500).json({ error: 'Erro ao buscar comunidades' });
    }
  });

  app.get('/api/users/:userId/posts', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const userId = parseInt(req.params.userId);
      const platform = req.query.platform as 'instagram' | 'tiktok' | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 12;

      const posts = await storage.getCreatorPosts(userId, platform, limit);
      res.json(posts);

      // Background: migrate CDN thumbnails to GCS
      const cdnPosts = posts.filter((p) => p.thumbnailUrl && p.thumbnailUrl.startsWith('http'));
      if (cdnPosts.length > 0) {
        setImmediate(async () => {
          try {
            const { savePostThumbnail } = await import('../lib/image-storage');
            for (const post of cdnPosts.slice(0, 12)) {
              try {
                const saved = await savePostThumbnail(
                  post.thumbnailUrl!,
                  post.platform,
                  post.postId,
                );
                if (saved && saved !== post.thumbnailUrl) {
                  await db
                    .update(creatorPosts)
                    .set({ thumbnailUrl: saved })
                    .where(eq(creatorPosts.id, post.id));
                }
              } catch {
                // Skip individual post failures
              }
            }
          } catch (err) {
            console.error('[Posts] Background thumbnail migration error:', err);
          }
        });
      }
    } catch (error) {
      console.error('[API] Error fetching creator posts:', error);
      res.status(500).json({ error: 'Erro ao buscar posts' });
    }
  });

  app.post('/api/ai/analyze-post', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const {
        postId,
        caption,
        likes,
        comments,
        views,
        engagementRate,
        hashtags,
        postType,
        creatorName,
        creatorFollowers,
      } = req.body;

      const prompt = `Você é um especialista em marketing de influenciadores. Analise este post do Instagram e forneça insights valiosos para uma empresa que está considerando trabalhar com este criador.

Dados do Post:
- Caption: "${caption || 'Sem caption'}"
- Curtidas: ${likes || 0}
- Comentários: ${comments || 0}
- Visualizações: ${views || 'N/A'}
- Taxa de Engajamento: ${engagementRate || 'N/A'}
- Tipo: ${postType || 'imagem'}
- Hashtags: ${hashtags?.join(', ') || 'Nenhuma'}

Dados do Criador:
- Nome: ${creatorName || 'Desconhecido'}
- Seguidores: ${creatorFollowers || 'N/A'}

Por favor, analise e responda em português brasileiro com:

1. **Performance do Post**: Avalie se as métricas são boas para o nicho
2. **Qualidade do Conteúdo**: Analise a caption, uso de hashtags e formato
3. **Potencial para Marcas**: Como este tipo de conteúdo pode beneficiar uma marca parceira
4. **Sugestões**: Dicas para melhorar o desempenho

Seja conciso e direto, focando em insights acionáveis.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Você é um especialista em marketing de influenciadores e análise de redes sociais. Responda sempre em português brasileiro.',
          },
          { role: 'user', content: prompt },
        ],
        max_completion_tokens: 800,
      });

      const analysis = response.choices[0]?.message?.content || 'Não foi possível gerar análise.';

      if (postId) {
        try {
          await db
            .update(creatorPosts)
            .set({ aiAnalysis: analysis })
            .where(eq(creatorPosts.id, parseInt(postId)));
        } catch (dbErr) {
          console.error('[API] Failed to save AI analysis to DB:', dbErr);
        }
      }

      res.json({ analysis });
    } catch (error) {
      console.error('[API] Error analyzing post with AI:', error);
      res.status(500).json({ error: 'Erro ao analisar post' });
    }
  });

  console.log('[Routes] User routes registered');
}
