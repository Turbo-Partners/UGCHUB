const GRAPH_API_BASE = "https://graph.instagram.com/v21.0";

interface PublishImageParams {
  accessToken: string;
  igUserId: string;
  imageUrl: string;
  caption?: string;
  locationId?: string;
  userTags?: { username: string; x: number; y: number }[];
}

interface PublishCarouselParams {
  accessToken: string;
  igUserId: string;
  children: { imageUrl?: string; videoUrl?: string; isVideo?: boolean }[];
  caption?: string;
  locationId?: string;
}

interface PublishReelParams {
  accessToken: string;
  igUserId: string;
  videoUrl: string;
  caption?: string;
  coverUrl?: string;
  shareToFeed?: boolean;
  locationId?: string;
}

interface PublishStoryParams {
  accessToken: string;
  igUserId: string;
  imageUrl?: string;
  videoUrl?: string;
}

interface ContainerStatusResult {
  id: string;
  status: string;
  status_code?: string;
  error_message?: string;
}

class InstagramPublishingService {

  private async createContainer(
    accessToken: string,
    igUserId: string,
    params: Record<string, string>
  ): Promise<{ id: string }> {
    const url = `${GRAPH_API_BASE}/${igUserId}/media`;
    const body = new URLSearchParams({ ...params, access_token: accessToken });
    
    const res = await fetch(url, { method: "POST", body });
    const data = await res.json() as any;
    
    if (data.error) {
      console.error("[Publishing] Container creation error:", data.error);
      throw new Error(data.error.message || "Failed to create media container");
    }
    
    return { id: data.id };
  }

  private async publishContainer(
    accessToken: string,
    igUserId: string,
    containerId: string
  ): Promise<{ id: string }> {
    const url = `${GRAPH_API_BASE}/${igUserId}/media_publish`;
    const body = new URLSearchParams({
      creation_id: containerId,
      access_token: accessToken,
    });
    
    const res = await fetch(url, { method: "POST", body });
    const data = await res.json() as any;
    
    if (data.error) {
      console.error("[Publishing] Publish error:", data.error);
      throw new Error(data.error.message || "Failed to publish media");
    }
    
    return { id: data.id };
  }

  async checkContainerStatus(
    accessToken: string,
    containerId: string
  ): Promise<ContainerStatusResult> {
    const url = `${GRAPH_API_BASE}/${containerId}?fields=id,status,status_code&access_token=${accessToken}`;
    const res = await fetch(url);
    const data = await res.json() as any;
    
    if (data.error) {
      throw new Error(data.error.message || "Failed to check container status");
    }
    
    return {
      id: data.id,
      status: data.status || "UNKNOWN",
      status_code: data.status_code,
    };
  }

  private async waitForContainer(
    accessToken: string,
    containerId: string,
    maxWaitMs: number = 60000
  ): Promise<void> {
    const startTime = Date.now();
    const pollInterval = 3000;
    
    while (Date.now() - startTime < maxWaitMs) {
      const status = await this.checkContainerStatus(accessToken, containerId);
      
      if (status.status_code === "FINISHED" || status.status === "FINISHED") {
        return;
      }
      
      if (status.status_code === "ERROR" || status.status === "ERROR") {
        throw new Error(`Container processing failed: ${status.status_code}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    throw new Error("Container processing timed out");
  }

  async publishImage(params: PublishImageParams): Promise<{ id: string; permalink?: string }> {
    const containerParams: Record<string, string> = {
      image_url: params.imageUrl,
      media_type: "IMAGE",
    };
    
    if (params.caption) containerParams.caption = params.caption;
    if (params.locationId) containerParams.location_id = params.locationId;
    if (params.userTags?.length) {
      containerParams.user_tags = JSON.stringify(params.userTags.map(t => ({
        username: t.username, x: t.x, y: t.y,
      })));
    }
    
    const container = await this.createContainer(params.accessToken, params.igUserId, containerParams);
    const published = await this.publishContainer(params.accessToken, params.igUserId, container.id);
    
    const permalink = await this.getMediaPermalink(params.accessToken, published.id);
    return { id: published.id, permalink };
  }

  async publishCarousel(params: PublishCarouselParams): Promise<{ id: string; permalink?: string }> {
    const childIds: string[] = [];
    
    for (const child of params.children) {
      const childParams: Record<string, string> = {
        is_carousel_item: "true",
      };
      
      if (child.isVideo || child.videoUrl) {
        childParams.media_type = "VIDEO";
        childParams.video_url = child.videoUrl || "";
      } else {
        childParams.media_type = "IMAGE";
        childParams.image_url = child.imageUrl || "";
      }
      
      const childContainer = await this.createContainer(params.accessToken, params.igUserId, childParams);
      
      if (child.isVideo || child.videoUrl) {
        await this.waitForContainer(params.accessToken, childContainer.id);
      }
      
      childIds.push(childContainer.id);
    }
    
    const carouselParams: Record<string, string> = {
      media_type: "CAROUSEL",
      children: childIds.join(","),
    };
    
    if (params.caption) carouselParams.caption = params.caption;
    if (params.locationId) carouselParams.location_id = params.locationId;
    
    const container = await this.createContainer(params.accessToken, params.igUserId, carouselParams);
    const published = await this.publishContainer(params.accessToken, params.igUserId, container.id);
    
    const permalink = await this.getMediaPermalink(params.accessToken, published.id);
    return { id: published.id, permalink };
  }

  async publishReel(params: PublishReelParams): Promise<{ id: string; permalink?: string }> {
    const containerParams: Record<string, string> = {
      media_type: "REELS",
      video_url: params.videoUrl,
    };
    
    if (params.caption) containerParams.caption = params.caption;
    if (params.coverUrl) containerParams.cover_url = params.coverUrl;
    if (params.shareToFeed !== undefined) containerParams.share_to_feed = String(params.shareToFeed);
    if (params.locationId) containerParams.location_id = params.locationId;
    
    const container = await this.createContainer(params.accessToken, params.igUserId, containerParams);
    
    await this.waitForContainer(params.accessToken, container.id, 120000);
    
    const published = await this.publishContainer(params.accessToken, params.igUserId, container.id);
    
    const permalink = await this.getMediaPermalink(params.accessToken, published.id);
    return { id: published.id, permalink };
  }

  async publishStory(params: PublishStoryParams): Promise<{ id: string }> {
    const containerParams: Record<string, string> = {};
    
    if (params.videoUrl) {
      containerParams.media_type = "STORIES";
      containerParams.video_url = params.videoUrl;
    } else if (params.imageUrl) {
      containerParams.media_type = "STORIES";
      containerParams.image_url = params.imageUrl;
    } else {
      throw new Error("Either imageUrl or videoUrl is required for Stories");
    }
    
    const container = await this.createContainer(params.accessToken, params.igUserId, containerParams);
    
    if (params.videoUrl) {
      await this.waitForContainer(params.accessToken, container.id, 120000);
    }
    
    const published = await this.publishContainer(params.accessToken, params.igUserId, container.id);
    return { id: published.id };
  }

  async getPublishingLimit(
    accessToken: string,
    igUserId: string
  ): Promise<{ quota_usage: number; config: any }> {
    const url = `${GRAPH_API_BASE}/${igUserId}/content_publishing_limit?fields=config,quota_usage&access_token=${accessToken}`;
    const res = await fetch(url);
    const data = await res.json() as any;
    
    if (data.error) {
      return { quota_usage: 0, config: { quota_total: 25 } };
    }
    
    return {
      quota_usage: data.data?.[0]?.quota_usage || 0,
      config: data.data?.[0]?.config || { quota_total: 25 },
    };
  }

  private async getMediaPermalink(accessToken: string, mediaId: string): Promise<string | undefined> {
    try {
      const url = `${GRAPH_API_BASE}/${mediaId}?fields=permalink&access_token=${accessToken}`;
      const res = await fetch(url);
      const data = await res.json() as any;
      return data.permalink;
    } catch {
      return undefined;
    }
  }

  async getRecentMedia(
    accessToken: string,
    igUserId: string,
    limit: number = 12
  ): Promise<any[]> {
    const url = `${GRAPH_API_BASE}/${igUserId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=${limit}&access_token=${accessToken}`;
    const res = await fetch(url);
    const data = await res.json() as any;
    
    if (data.error) {
      console.error("[Publishing] Error fetching media:", data.error);
      return [];
    }
    
    return data.data || [];
  }
}

export const instagramPublishingService = new InstagramPublishingService();
