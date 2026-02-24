import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type {
  XhsFeed,
  FeedDetail,
  UserProfile,
  PublishContentParams,
  PublishResult,
  SearchFeedsParams,
} from "./xhsTypes";

class XhsMcpClient {
  private client: Client | null = null;
  private connected = false;
  private mcpUrl: string;

  constructor() {
    this.mcpUrl = process.env.XHS_MCP_URL || "http://148.135.72.113:18060/mcp";
  }

  private async ensureConnected(): Promise<Client> {
    if (this.client && this.connected) return this.client;

    this.client = new Client({ name: "rednote-ugc", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(new URL(this.mcpUrl));

    try {
      await this.client.connect(transport);
      this.connected = true;
      return this.client;
    } catch (error) {
      this.connected = false;
      this.client = null;
      throw new Error(`MCP connection failed: ${(error as Error).message}`);
    }
  }

  private async callTool(
    name: string,
    args: Record<string, unknown> = {}
  ): Promise<{ text?: string; image?: string }> {
    try {
      const client = await this.ensureConnected();
      const result = await client.callTool({ name, arguments: args });

      let text: string | undefined;
      let image: string | undefined;

      for (const block of (result.content as Array<{ type: string; text?: string; data?: string; mimeType?: string }>) || []) {
        if (block.type === "text") text = block.text;
        if (block.type === "image") image = `data:${block.mimeType};base64,${block.data}`;
      }

      return { text, image };
    } catch (error) {
      this.connected = false;
      this.client = null;
      throw error;
    }
  }

  async checkLoginStatus(): Promise<{ logged_in: boolean; username?: string }> {
    const { text } = await this.callTool("check_login_status");
    if (!text) return { logged_in: false };

    // Try JSON first
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === "object" && parsed !== null) {
        const loggedIn = parsed.logged_in ?? parsed.loggedIn ?? parsed.is_logged_in ?? parsed.status === "logged_in";
        const name = parsed.username ?? parsed.nickname ?? parsed.user_name ?? parsed.name;
        if (typeof loggedIn === "boolean") return { logged_in: loggedIn, username: name };
      }
    } catch {
      // not JSON, fall through to text matching
    }

    // Text matching fallback
    const notLoggedIn = text.includes("未登录") || text.toLowerCase().includes("not logged in") || text.includes("需要登录");
    if (notLoggedIn) return { logged_in: false };

    const isLoggedIn = text.includes("已登录") || text.toLowerCase().includes("logged in") || text.includes("登录成功");
    const usernameMatch = text.match(/(?:用户名|nickname|昵称)[：:\s]*(.+)/i);
    return { logged_in: isLoggedIn, username: usernameMatch?.[1]?.trim() };
  }

  async getLoginQrcode(): Promise<{ qrcode: string }> {
    const { image, text } = await this.callTool("get_login_qrcode");
    if (image) return { qrcode: image };
    if (text) return { qrcode: text };
    throw new Error("Failed to get QR code");
  }

  async deleteCookies(): Promise<void> {
    await this.callTool("delete_cookies");
  }

  async publishContent(params: PublishContentParams): Promise<PublishResult> {
    const { text } = await this.callTool("publish_content", {
      title: params.title,
      content: params.content,
      images: params.images,
      ...(params.tags && { tags: params.tags }),
    });
    const parsed = text ? JSON.parse(text) : {};
    return { success: !parsed.error, noteId: parsed.noteId, message: parsed.message || text };
  }

  async listFeeds(): Promise<XhsFeed[]> {
    const { text } = await this.callTool("list_feeds");
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : parsed.feeds || parsed.data || [];
    } catch {
      return [];
    }
  }

  async searchFeeds(params: SearchFeedsParams): Promise<XhsFeed[]> {
    const filters: Record<string, string> = {};
    if (params.sort_by) filters.sort_by = params.sort_by;
    if (params.note_type) filters.note_type = params.note_type;
    if (params.publish_time) filters.publish_time = params.publish_time;

    const args: Record<string, unknown> = { keyword: params.keyword };
    if (Object.keys(filters).length > 0) args.filters = filters;

    const { text } = await this.callTool("search_feeds", args);
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : parsed.feeds || parsed.data || [];
    } catch {
      return [];
    }
  }

  async getFeedDetail(
    feedId: string,
    xsecToken: string
  ): Promise<FeedDetail | null> {
    const { text } = await this.callTool("get_feed_detail", {
      feed_id: feedId,
      xsec_token: xsecToken,
    });
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  async getUserProfile(
    userId: string,
    xsecToken: string
  ): Promise<UserProfile | null> {
    const { text } = await this.callTool("user_profile", {
      user_id: userId,
      xsec_token: xsecToken,
    });
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  async postComment(
    feedId: string,
    xsecToken: string,
    content: string
  ): Promise<void> {
    await this.callTool("post_comment_to_feed", {
      feed_id: feedId,
      xsec_token: xsecToken,
      content,
    });
  }

  async likeFeed(feedId: string, xsecToken: string, unlike = false): Promise<void> {
    await this.callTool("like_feed", {
      feed_id: feedId,
      xsec_token: xsecToken,
      ...(unlike && { unlike: true }),
    });
  }

  async favoriteFeed(feedId: string, xsecToken: string, unfavorite = false): Promise<void> {
    await this.callTool("favorite_feed", {
      feed_id: feedId,
      xsec_token: xsecToken,
      ...(unfavorite && { unfavorite: true }),
    });
  }
}

export const xhsMcpClient = new XhsMcpClient();
