export type UserRole = "member" | "moderator" | "owner" | "guest";

export interface User {
  id: string;
  username: string;
  email?: string;
  displayName: string;
  avatarUrl: string;
  backgroundUrl: string | null;
  bio: string;
  university: string;
  department: string;
  joinedAt: string;
  followerCount: number;
  followingCount: number;
  clubCount: number;
  isFollowing: boolean;
  isVerified: boolean;
  role: string;
}

export type ClubCategory =
  | "Technology"
  | "Arts"
  | "Sports"
  | "Science"
  | "Business"
  | "Social"
  | "Cultural"
  | "Academic"
  | "Volunteering"
  | "Gaming";

export interface Club {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImageUrl: string;
  logoUrl: string | null;
  category: ClubCategory;
  university: string;
  memberCount: number;
  eventCount: number;
  articleCount: number;
  isPublic: boolean;
  status?: "PENDING" | "APPROVED";
  currentUserRole: UserRole;
  isMember: boolean;
  hasPendingRequest?: boolean;
  createdAt: string;
  moderators: Pick<User, "id" | "displayName" | "avatarUrl">[];
  tags: string[];
  moderationStats?: ModerationStats;
}

export type PostType = "text" | "image" | "link" | "poll" | "question";

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: Pick<User, "id" | "displayName" | "avatarUrl" | "username">;
  body: string;
  likeCount: number;
  isLiked: boolean;
  createdAt: string;
  replies?: Comment[];
}

export interface Post {
  id: string;
  authorId: string;
  author: Pick<User, "id" | "displayName" | "avatarUrl" | "username">;
  clubId: string;
  clubName: string;
  targetKind?: "club" | "user";
  type: PostType;
  title: string;
  body: string;
  imageUrl: string | null;
  linkUrl: string | null;
  channel: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
  authorRole: UserRole;
}

export type EventFormat = "in-person" | "online" | "hybrid";

export interface ClubEvent {
  id: string;
  clubId: string;
  clubSlug: string;
  clubName: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  format: EventFormat;
  location: string;
  startsAt: string;
  endsAt: string;
  maxMembers: number | null;
  attendeeCount: number;
  waitlistCount: number;
  isAttending: boolean;
  myRsvpStatus: "ATTENDING" | "NOT_ATTENDING" | "WAITLISTED" | null;
  questions: EventQuestion[];
  organizerId: string;
}

export type QuestionType =
  | "SHORT_TEXT" | "LONG_TEXT" | "SINGLE_CHOICE" | "MULTI_CHOICE" | "YES_NO";

export interface EventQuestion {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  position: number;
  options: string[];
}

export interface WikiArticle {
  id: string;
  clubId: string;
  clubSlug: string;
  clubName: string;
  title: string;
  summary: string;
  body: string;
  authorId: string;
  author: Pick<User, "id" | "displayName" | "avatarUrl" | "username">;
  updatedAt: string;
  isFeatured: boolean;
  canManage: boolean;
}

export interface MemberEntry {
  user: Pick<User, "id" | "displayName" | "avatarUrl" | "university" | "department">;
  role: UserRole;
  joinedAt: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isDirect: boolean;
  participantIds: string[];
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  sender: Pick<User, "id" | "displayName" | "avatarUrl">;
  body: string;
  sentAt: string;
}

export interface Notification {
  id: string;
  type: "follow" | "like" | "comment" | "join_request" | "event_reminder" | "mention";
  actorId: string;
  actor: Pick<User, "id" | "displayName" | "avatarUrl">;
  targetId: string;
  targetType: "post" | "club" | "event" | "user";
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ModerationStats {
  pendingRequests: number;
  openReports: number;
}