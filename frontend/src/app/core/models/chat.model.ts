// src/app/core/models/chat.model.ts

export interface ChatMessage {
  messageId?:   number;
  senderId:     number;
  receiverId:   number;
  content:      string;
  timestamp?:   string;
  isRead?:      boolean;
  senderName?:  string;

  messageType?: MessageType;
  fileUrl?:     string;
  fileName?:    string;
  fileSize?:    number;
  duration?:    number;
  status?:      MessageStatus;
  replyTo?:     ReplyPreview;
  reactions?:   MessageReaction[];
  linkPreview?: LinkPreview;

  // Moderation / UI-only flags (never persisted)
  _warning?:    string;   // shown below bubble only to sender
  _isBubble?:   boolean;  // messenger-style mini-bubble in liste-posts
}

export type MessageType   = 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE' | 'LINK' | 'CALL';
export type MessageStatus = 'SENT' | 'DELIVERED' | 'SEEN';

export interface ReplyPreview {
  messageId:   number;
  senderName:  string;
  content:     string;
  messageType: MessageType;
}

export interface MessageReaction {
  emoji:   string;
  userId:  number;
  name?:   string;
}

export interface LinkPreview {
  url:          string;
  title?:       string;
  description?: string;
  imageUrl?:    string;
  siteName?:    string;
}

export interface ChatUser {
  id:           number;
  email:        string;
  role?:        string;
  is_active?:   boolean;
  displayName?: string;
  // sidebar extras
  lastMessage?: string;
  lastTime?:    string;
  unread?:      number;
  isArchived?:  boolean;
  isTyping?:    boolean;
}

export interface WsOutgoing {
  senderId:     number;
  receiverId:   number;
  content:      string;
  messageType?: MessageType;
  fileUrl?:     string;
  fileName?:    string;
  fileSize?:    number;
  duration?:    number;
  replyToId?:   number;
}

export interface ModerationEvent {
  type:        'WARNING' | 'BAN' | 'PEER_BANNED';
  reason:      string;
  banSeconds?: number;
  peerId?:     number;
  peerName?:   string;
}

export interface ConversationOrderEvent {
  type:        'CONVERSATION_ORDER';
  partnerId:   number;
  partnerName: string;
  lastMessage: string;
  timestamp:   string;
}