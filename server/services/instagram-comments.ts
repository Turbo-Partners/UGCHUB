import { db } from "../db";

const FACEBOOK_GRAPH_API_VERSION = "v21.0";
const GRAPH_URL = `https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}`;
const IG_URL = `https://graph.instagram.com/${FACEBOOK_GRAPH_API_VERSION}`;

export class InstagramCommentsService {

  async getMediaComments(accessToken: string, mediaId: string, limit: number = 50, after?: string): Promise<{ comments: any[]; paging: any }> {
    let url = `${IG_URL}/${mediaId}/comments?fields=id,text,timestamp,username,like_count,replies{id,text,timestamp,username,like_count},hidden&limit=${limit}&access_token=${accessToken}`;
    if (after) url += `&after=${after}`;
    
    const response: Response = await fetch(url);
    const data: any = await response.json();
    
    if (data.error) {
      console.error("[Comments] API error:", data.error);
      throw new Error(data.error.message || "Erro ao buscar comentários");
    }
    
    return {
      comments: data.data || [],
      paging: data.paging || null,
    };
  }

  async getRecentComments(accessToken: string, instagramUserId: string, postsLimit: number = 10, commentsPerPost: number = 20): Promise<any[]> {
    const mediaUrl = `${IG_URL}/${instagramUserId}/media?fields=id,caption,media_type,permalink,timestamp,thumbnail_url,media_url&limit=${postsLimit}&access_token=${accessToken}`;
    const mediaResponse: Response = await fetch(mediaUrl);
    const mediaData: any = await mediaResponse.json();
    
    if (mediaData.error) {
      throw new Error(mediaData.error.message || "Erro ao buscar posts");
    }
    
    const posts = mediaData.data || [];
    const allComments: any[] = [];
    
    for (const post of posts) {
      try {
        const { comments } = await this.getMediaComments(accessToken, post.id, commentsPerPost);
        for (const comment of comments) {
          allComments.push({
            ...comment,
            post: {
              id: post.id,
              caption: post.caption?.slice(0, 100),
              mediaType: post.media_type,
              permalink: post.permalink,
              mediaUrl: post.media_url,
              thumbnailUrl: post.thumbnail_url,
              timestamp: post.timestamp,
            }
          });
        }
      } catch (e) {
      }
    }
    
    allComments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return allComments;
  }

  async replyToComment(accessToken: string, commentId: string, message: string): Promise<any> {
    const url = `${IG_URL}/${commentId}/replies`;
    
    const response: Response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        access_token: accessToken,
      }),
    });
    
    const data: any = await response.json();
    
    if (data.error) {
      console.error("[Comments] Reply error:", data.error);
      throw new Error(data.error.message || "Erro ao responder comentário");
    }
    
    return data;
  }

  async toggleHideComment(accessToken: string, commentId: string, hide: boolean): Promise<any> {
    const url = `${IG_URL}/${commentId}`;
    
    const response: Response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hide,
        access_token: accessToken,
      }),
    });
    
    const data: any = await response.json();
    
    if (data.error) {
      console.error("[Comments] Hide error:", data.error);
      throw new Error(data.error.message || "Erro ao ocultar comentário");
    }
    
    return data;
  }

  async deleteComment(accessToken: string, commentId: string): Promise<any> {
    const url = `${IG_URL}/${commentId}?access_token=${accessToken}`;
    
    const response: Response = await fetch(url, {
      method: "DELETE",
    });
    
    const data: any = await response.json();
    
    if (data.error) {
      console.error("[Comments] Delete error:", data.error);
      throw new Error(data.error.message || "Erro ao deletar comentário");
    }
    
    return data;
  }

  async analyzeSentiments(comments: { id: string; text: string; username: string }[]): Promise<any[]> {
    if (comments.length === 0) return [];
    
    try {
      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });
      
      const commentsText = comments.map((c, i) => `${i + 1}. @${c.username}: "${c.text}"`).join("\n");
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Analise o sentimento de cada comentário do Instagram. Classifique como "positivo", "neutro" ou "negativo". 
Responda APENAS com um JSON array no formato: [{"index": 1, "sentiment": "positivo|neutro|negativo", "emoji": "😊|😐|😠"}]
Não inclua explicações adicionais.`
          },
          {
            role: "user",
            content: commentsText
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });
      
      const content = response.choices[0]?.message?.content || "[]";
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error("[Comments] Sentiment analysis error:", error);
      return [];
    }
  }
}

export const instagramCommentsService = new InstagramCommentsService();
