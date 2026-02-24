export interface XhsInteractInfo {
  likedCount: string;
  commentCount: string;
  collectedCount: string;
  shareCount: string;
}

export interface XhsCover {
  urlDefault: string;
  urlPre: string;
  width: number;
  height: number;
}

export interface XhsNoteCard {
  noteId: string;
  displayTitle: string;
  type: string;
  user: {
    userId: string;
    nickname: string;
    avatar: string;
  };
  cover: XhsCover;
  interactInfo: XhsInteractInfo;
  xsecToken: string;
}

export interface XhsFeed {
  noteCard: XhsNoteCard;
}

export interface XhsComment {
  id: string;
  content: string;
  userName: string;
  createTime: string;
  likeCount: string;
}

export interface FeedDetail {
  noteId: string;
  title: string;
  desc: string;
  type: string;
  imageList: { urlDefault: string }[];
  interactInfo: XhsInteractInfo;
  tagList: { name: string }[];
  comments: XhsComment[];
}

export interface UserProfile {
  basicInfo: {
    nickname: string;
    images: string;
    desc: string;
    gender: number;
    ipLocation: string;
  };
  interactions: {
    fans: string;
    follows: string;
    interaction: string;
  }[];
  feeds: XhsFeed[];
}

export interface PublishContentParams {
  title: string;
  content: string;
  images: string[];
  tags?: string[];
}

export interface PublishResult {
  success: boolean;
  noteId?: string;
  message?: string;
}

export interface SearchFeedsParams {
  keyword: string;
  sort_by?: string;
  note_type?: string;
  publish_time?: string;
}
