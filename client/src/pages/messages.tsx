import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstagramAvatar } from "@/components/instagram-avatar";
import { useMarketplace } from "@/lib/provider";
import { useBrand } from "@/lib/brand-context";
import { queryClient } from "@/lib/queryClient";
import { getAvatarUrl } from "@/lib/utils";
import { formatDistanceToNow, differenceInHours, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MessageSquare,
  Search,
  Send,
  Inbox,
  Users,
  Loader2,
  Wifi,
  WifiOff,
  Building2,
  Megaphone,
  Instagram,
  Lock,
  User,
  Clock,
  CheckCheck,
  Smile,
  Paperclip,
  Mic,
  CheckCircle2,
  Circle,
  Filter,
  X,
  UserPlus,
  ExternalLink,
  Eye,
  BadgeCheck,
  Grid,
  UserCheck,
  Heart,
  MessageCircle,
  RefreshCcw,
  CheckCheck as CheckAll,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  Calendar,
  User2,
  Tag,
  Plus,
  Pencil,
  Trash2,
  Check,
  Settings,
  StickyNote,
  Zap,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { WebSocketEvent } from "@shared/schema";

interface UnifiedConversation {
  id: number;
  type: 'brand' | 'campaign';
  status: 'open' | 'resolved';
  brandId: number;
  campaignId: number | null;
  creatorId: number;
  companyId: number;
  createdAt: string;
  updatedAt: string;
  brandName?: string;
  campaignTitle?: string;
  creatorName?: string;
  creatorAvatar?: string | null;
  creatorInstagram?: string | null;
  companyName?: string;
  companyLogo?: string | null;
  unreadCount?: number;
  lastMessage?: {
    body: string;
    createdAt: string;
  };
}

interface ConversationMessage {
  id: number;
  conversationId: number;
  senderId: number;
  body: string;
  createdAt: string;
  senderName?: string;
  senderAvatar?: string | null;
}

// Instagram DM interfaces
interface InstagramConversation {
  conversationId: string;
  participantId: string;
  participantUsername: string | null;
  participantProfilePic: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastIncomingMessageAt: string | null;
  sortTimestamp: number;
  unreadCount: number;
  incomingMessageCount: number;
  isIncoming: boolean;
}

interface InstagramAttachment {
  type: string;
  url?: string;
  preview?: string;
  width?: number;
  height?: number;
}

interface InstagramMessage {
  id: number;
  conversationId: string;
  messageId: string;
  senderId: string;
  senderUsername: string | null;
  recipientId: string;
  recipientUsername: string | null;
  messageText: string | null;
  messageType: string | null;
  attachments?: InstagramAttachment[] | null;
  isIncoming: boolean;
  isRead: boolean;
  sentAt: string | null;
  createdAt: string;
}

interface ConversationTag {
  id: number;
  companyId: number;
  name: string;
  color: string;
  description?: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface ContactNote {
  id: number;
  companyId: number;
  instagramUsername: string;
  content: string;
  createdBy: number;
  createdAt: string;
  updatedAt?: string;
}

const TAG_COLORS = [
  { name: "Vermelho", value: "#ef4444" },
  { name: "Laranja", value: "#f97316" },
  { name: "Amarelo", value: "#eab308" },
  { name: "Verde", value: "#22c55e" },
  { name: "Azul", value: "#3b82f6" },
  { name: "Roxo", value: "#8b5cf6" },
  { name: "Rosa", value: "#ec4899" },
];

function formatSmartDate(dateStr: string | null): string {
  if (!dateStr) return 'Sem mensagens';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Sem mensagens';
  
  const hoursAgo = differenceInHours(new Date(), date);
  
  if (hoursAgo < 24) {
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  }
  
  if (isToday(date)) {
    return `hoje ${format(date, 'HH:mm')}`;
  }
  
  if (isYesterday(date)) {
    return `ontem ${format(date, 'HH:mm')}`;
  }
  
  return format(date, "dd/MM/yyyy HH:mm");
}

export default function MessagesPage() {
  const { user } = useMarketplace();
  const { brandId: contextBrandId } = useBrand();
  const [, navigate] = useLocation();
  
  // Extract brandId from URL if on company brand route
  const [, routeParams] = useRoute("/company/brand/:brandId/messages");
  const urlBrandId = routeParams?.brandId ? parseInt(routeParams.brandId) : null;
  
  // Use URL brandId if available, otherwise fall back to context
  const brandId = urlBrandId || contextBrandId;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<UnifiedConversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [sourceFilters, setSourceFilters] = useState<{community: boolean; campaign: boolean; dm: boolean}>({
    community: true,
    campaign: true,
    dm: true,
  });
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'name' | 'unread'>('recent');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Instagram DM sync progress
  const [syncProgress, setSyncProgress] = useState<{ page: number; totalConversations: number; synced: number; errors: number; done: boolean } | null>(null);
  const isSyncing = syncProgress !== null && !syncProgress.done;

  // Instagram DM states
  const [selectedInstagramConversation, setSelectedInstagramConversation] = useState<InstagramConversation | null>(null);
  const [instagramMessageInput, setInstagramMessageInput] = useState("");
  const selectedInstagramConversationRef = useRef<InstagramConversation | null>(null);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);

  // Tag states
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [editingTag, setEditingTag] = useState<ConversationTag | null>(null);
  const [selectedTagFilters, setSelectedTagFilters] = useState<number[]>([]);

  // Notes states
  const [newNoteContent, setNewNoteContent] = useState("");

  const isCreator = user?.role === 'creator';
  const isCompanyUser = user?.role === 'company';

  useEffect(() => {
    setSelectedConversation(null);
    setSelectedInstagramConversation(null);
  }, [sourceFilters, readFilter]);

  // Derived state for determining if showing DMs only
  const showInstagramDMsOnly = sourceFilters.dm && !sourceFilters.community && !sourceFilters.campaign;

  // Keep ref in sync with state for WebSocket callbacks
  useEffect(() => {
    selectedInstagramConversationRef.current = selectedInstagramConversation;
  }, [selectedInstagramConversation]);

  const getApiBase = () => {
    if (isCreator) return '/api/creator/messages';
    if (isCompanyUser && brandId) return `/api/company/brand/${brandId}/messages`;
    return null;
  };

  const apiBase = getApiBase();

  const { data: conversations = [], isLoading: loadingConversations } = useQuery<UnifiedConversation[]>({
    queryKey: [apiBase, 'conversations', sourceFilters],
    queryFn: async () => {
      if (!apiBase) return [];
      const res = await fetch(`${apiBase}/conversations`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch conversations');
      return res.json();
    },
    enabled: !!user && !!apiBase && !showInstagramDMsOnly,
  });

  const { data: conversationData, isLoading: loadingMessages } = useQuery<{
    conversation: UnifiedConversation;
    messages: ConversationMessage[];
  }>({
    queryKey: [apiBase, 'conversations', selectedConversation?.id],
    queryFn: async () => {
      if (!apiBase || !selectedConversation) throw new Error('No conversation selected');
      const res = await fetch(`${apiBase}/conversations/${selectedConversation.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    enabled: !!apiBase && !!selectedConversation && !showInstagramDMsOnly,
  });

  const messages = conversationData?.messages || [];

  const { data: unreadCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: [apiBase, 'unread-count'],
    queryFn: async () => {
      if (!apiBase) return { count: 0 };
      const res = await fetch(`${apiBase}/unread-count`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch unread count');
      return res.json();
    },
    enabled: !!user && !!apiBase,
  });

  // Instagram DM queries
  const { data: instagramConversationsData, isLoading: isLoadingInstagramConversations, refetch: refetchInstagramConversations } = useQuery({
    queryKey: ["/api/instagram/conversations"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/instagram/conversations");
      return res.json();
    },
    enabled: sourceFilters.dm && isCompanyUser,
    refetchInterval: 15000,
  });

  const { data: instagramMessagesData, isLoading: isLoadingInstagramMessages, refetch: refetchInstagramMessages } = useQuery({
    queryKey: ["/api/instagram/conversations", selectedInstagramConversation?.conversationId, "messages"],
    queryFn: async () => {
      if (!selectedInstagramConversation) return null;
      const res = await apiRequest("GET", `/api/instagram/conversations/${encodeURIComponent(selectedInstagramConversation.conversationId)}/messages`);
      return res.json();
    },
    enabled: !!selectedInstagramConversation && sourceFilters.dm,
    refetchInterval: 10000,
  });

  // Query to fetch profile pic via Apify - always fetch when username is available
  // Instagram CDN URLs expire quickly, so we always fetch a fresh URL
  const { data: apifyProfilePic } = useQuery({
    queryKey: ["/api/instagram/profile-pic", selectedInstagramConversation?.participantUsername],
    queryFn: async () => {
      if (!selectedInstagramConversation?.participantUsername) return null;
      const res = await apiRequest("GET", `/api/instagram/profile-pic/${encodeURIComponent(selectedInstagramConversation.participantUsername)}`);
      return res.json();
    },
    enabled: !!selectedInstagramConversation?.participantUsername,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes (URLs can expire)
    retry: false,
  });

  // Query to fetch full profile data when drawer opens
  const { data: fullProfileData, isLoading: loadingProfile } = useQuery({
    queryKey: ["/api/instagram/profile", selectedInstagramConversation?.participantUsername, profileDrawerOpen],
    queryFn: async () => {
      if (!selectedInstagramConversation?.participantUsername) return null;
      const res = await apiRequest("GET", `/api/instagram/profile/${encodeURIComponent(selectedInstagramConversation.participantUsername)}`);
      return res.json();
    },
    enabled: !!selectedInstagramConversation?.participantUsername && profileDrawerOpen,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    retry: false,
  });

  const syncInstagramMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/instagram/conversations/sync");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.status === 'sync_started') {
        setSyncProgress({ page: 0, totalConversations: 0, synced: 0, errors: 0, done: false });
      } else if (data.status === 'already_syncing') {
        // Already syncing, no action needed
      } else {
        refetchInstagramConversations();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao sincronizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncPostsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/instagram/posts/sync");
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Posts sincronizados",
        description: `${data.postsSync} posts e ${data.commentsSync} comentários importados`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao sincronizar posts",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendInstagramMessageMutation = useMutation({
    mutationFn: async ({ recipientId, message, conversationId }: { recipientId: string; message: string; conversationId: string }) => {
      const res = await apiRequest("POST", "/api/instagram/messages/send", {
        recipientId,
        message,
        conversationId,
      });
      return res.json();
    },
    onSuccess: () => {
      setInstagramMessageInput("");
      refetchInstagramMessages();
      refetchInstagramConversations();
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to invite Instagram user to community
  const inviteToCommunityMutation = useMutation({
    mutationFn: async ({ instagramUsername }: { instagramUsername: string }) => {
      const res = await apiRequest("POST", `/api/company/brand/${brandId}/community/invite`, {
        instagramHandle: instagramUsername,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Convite enviado",
        description: `Link de convite criado para @${data.invite?.instagramHandle || "usuário"}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao convidar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to mark all Instagram messages as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/instagram/conversations/mark-all-read");
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Tudo lido",
        description: `${data.markedCount || 0} mensagens marcadas como lidas`,
      });
      refetchInstagramConversations();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao marcar como lidas",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const instagramConversations: InstagramConversation[] = instagramConversationsData?.conversations || [];
  const instagramMessages: InstagramMessage[] = instagramMessagesData?.messages || [];
  const instagramUnreadCount = instagramConversationsData?.unreadCount || 0;
  const instagramUsername = instagramConversationsData?.instagramUsername;
  const businessProfilePicUrl = instagramConversationsData?.businessProfilePicUrl;
  const instagramAccountId = instagramConversationsData?.accountId;

  // Tag queries and mutations
  const { data: allTags = [], refetch: refetchTags } = useQuery<ConversationTag[]>({
    queryKey: ['/api/conversation-tags'],
    queryFn: async () => {
      const res = await fetch('/api/conversation-tags', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isCompanyUser,
  });

  const { data: currentConversationTags = [], refetch: refetchConversationTags } = useQuery<ConversationTag[]>({
    queryKey: ['/api/conversations', selectedInstagramConversation?.conversationId, 'tags'],
    queryFn: async () => {
      if (!selectedInstagramConversation?.conversationId) return [];
      const res = await fetch(`/api/conversations/${selectedInstagramConversation.conversationId}/tags`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedInstagramConversation?.conversationId && isCompanyUser,
  });

  // Fetch tags for all conversations in a single batch request (optimized)
  const { data: allConversationTagsMap = {} } = useQuery<Record<string, ConversationTag[]>>({
    queryKey: ['/api/conversations/tags-batch', instagramConversations.map(c => c.conversationId).join(',')],
    queryFn: async () => {
      const conversationIds = instagramConversations.map(c => c.conversationId);
      const res = await fetch('/api/conversations/tags-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ conversationIds }),
      });
      if (!res.ok) return {};
      return res.json();
    },
    enabled: isCompanyUser && instagramConversations.length > 0,
    staleTime: 30000,
  });

  const createTagMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const res = await fetch('/api/conversation-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Erro ao criar tag');
      return res.json();
    },
    onSuccess: () => {
      refetchTags();
      setNewTagName("");
      setNewTagColor("#3b82f6");
      toast({ title: "Tag criada com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao criar tag", variant: "destructive" });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: async (data: { id: number; name: string; color: string }) => {
      const res = await fetch(`/api/conversation-tags/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: data.name, color: data.color }),
      });
      if (!res.ok) throw new Error('Erro ao atualizar tag');
      return res.json();
    },
    onSuccess: () => {
      refetchTags();
      refetchConversationTags();
      setEditingTag(null);
      toast({ title: "Tag atualizada com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar tag", variant: "destructive" });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: number) => {
      const res = await fetch(`/api/conversation-tags/${tagId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Erro ao excluir tag');
      return res.json();
    },
    onSuccess: () => {
      refetchTags();
      refetchConversationTags();
      toast({ title: "Tag excluída com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir tag", variant: "destructive" });
    },
  });

  const addTagToConversationMutation = useMutation({
    mutationFn: async ({ conversationId, tagId }: { conversationId: string; tagId: number }) => {
      if (!instagramAccountId) throw new Error('Instagram account not found');
      const res = await fetch(`/api/conversations/${conversationId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tagId, instagramAccountId }),
      });
      if (!res.ok) throw new Error('Erro ao adicionar tag');
      return res.json();
    },
    onSuccess: () => {
      refetchConversationTags();
      refetchInstagramConversations();
    },
    onError: () => {
      toast({ title: "Erro ao adicionar tag", variant: "destructive" });
    },
  });

  const removeTagFromConversationMutation = useMutation({
    mutationFn: async ({ conversationId, tagId }: { conversationId: string; tagId: number }) => {
      const res = await fetch(`/api/conversations/${conversationId}/tags/${tagId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Erro ao remover tag');
      return res.json();
    },
    onSuccess: () => {
      refetchConversationTags();
      refetchInstagramConversations();
    },
    onError: () => {
      toast({ title: "Erro ao remover tag", variant: "destructive" });
    },
  });

  // Contact Notes queries and mutations
  const { data: contactNotes = [], isLoading: loadingNotes, refetch: refetchNotes } = useQuery<ContactNote[]>({
    queryKey: ['/api/contact-notes', selectedInstagramConversation?.participantUsername],
    queryFn: async () => {
      if (!selectedInstagramConversation?.participantUsername) return [];
      const res = await fetch(`/api/contact-notes/${encodeURIComponent(selectedInstagramConversation.participantUsername)}`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedInstagramConversation?.participantUsername && profileDrawerOpen && isCompanyUser,
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ instagramUsername, content }: { instagramUsername: string; content: string }) => {
      const res = await fetch(`/api/contact-notes/${encodeURIComponent(instagramUsername)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Erro ao adicionar nota');
      return res.json();
    },
    onSuccess: () => {
      refetchNotes();
      setNewNoteContent("");
      toast({ title: "Nota adicionada com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao adicionar nota", variant: "destructive" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      const res = await fetch(`/api/contact-notes/${noteId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Erro ao excluir nota');
      return res.json();
    },
    onSuccess: () => {
      refetchNotes();
      toast({ title: "Nota excluída com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir nota", variant: "destructive" });
    },
  });

  // Refetch conversations after messages are loaded to update unread count
  // The backend marks messages as read when they are fetched
  useEffect(() => {
    if (instagramMessagesData?.messages && selectedInstagramConversation) {
      // Small delay to ensure backend has finished marking as read
      const timer = setTimeout(() => {
        refetchInstagramConversations();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedInstagramConversation?.conversationId]);

  const filteredInstagramConversations = instagramConversations.filter((conv) => {
    if (!searchTerm) return true;
    return conv.participantUsername?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSendInstagramMessage = () => {
    if (!instagramMessageInput.trim() || !selectedInstagramConversation) return;
    
    sendInstagramMessageMutation.mutate({
      recipientId: selectedInstagramConversation.participantId,
      message: instagramMessageInput,
      conversationId: selectedInstagramConversation.conversationId,
    });
  };

  useEffect(() => {
    if (!user) return;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/notifications`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Messages WebSocket] Connected');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'message:new') {
            const convId = data.conversationId || data.payload?.conversationId;
            queryClient.invalidateQueries({ queryKey: [apiBase, 'conversations'] });
            queryClient.invalidateQueries({ queryKey: [apiBase, 'unread-count'] });
            if (selectedConversation && convId === selectedConversation.id) {
              queryClient.invalidateQueries({ 
                queryKey: [apiBase, 'conversations', selectedConversation.id] 
              });
            }
          }
          
          if (data.type === 'instagram_dm') {
            console.log('[Messages WebSocket] Instagram DM received:', data.data?.conversationId);
            queryClient.invalidateQueries({ queryKey: ["/api/instagram/conversations"] });
            
            if (selectedInstagramConversationRef.current && 
                data.data?.conversationId === selectedInstagramConversationRef.current.conversationId) {
              queryClient.invalidateQueries({ 
                queryKey: ["/api/instagram/conversations", selectedInstagramConversationRef.current.conversationId, "messages"] 
              });
            }
          }

          if (data.type === 'dm_sync_progress') {
            setSyncProgress(data.data);
            if (data.data.synced > 0 || data.data.done) {
              queryClient.invalidateQueries({ queryKey: ["/api/instagram/conversations"] });
            }
            if (data.data.done) {
              setTimeout(() => setSyncProgress(null), 3000);
            }
          }
        } catch (error) {
          console.error('[Messages WebSocket] Error parsing message:', error);
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('[Messages WebSocket] Disconnected');
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[Messages WebSocket] Attempting to reconnect...');
          connect();
        }, 5000);
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [user, apiBase, selectedConversation]);

  const sendMessageMutation = useMutation({
    mutationFn: async (body: string) => {
      if (!apiBase || !selectedConversation) throw new Error('No conversation selected');
      const res = await fetch(`${apiBase}/conversations/${selectedConversation.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: [apiBase, 'conversations', selectedConversation?.id] });
      queryClient.invalidateQueries({ queryKey: [apiBase, 'conversations'] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-sync Instagram conversations on mount
  const hasSyncedRef = useRef(false);
  useEffect(() => {
    if (isCompanyUser && sourceFilters.dm && !hasSyncedRef.current && !syncInstagramMutation.isPending) {
      hasSyncedRef.current = true;
      syncInstagramMutation.mutate();
    }
  }, [isCompanyUser, sourceFilters.dm]);

  const filteredConversations = conversations.filter((conv) => {
    // Source filter
    if (conv.type === 'brand' && !sourceFilters.community) return false;
    if (conv.type === 'campaign' && !sourceFilters.campaign) return false;
    
    // Read filter
    const hasUnread = (conv.unreadCount || 0) > 0;
    if (readFilter === 'unread' && !hasUnread) return false;
    if (readFilter === 'read' && hasUnread) return false;
    
    // Search filter
    const name = isCreator ? (conv.companyName || conv.brandName || "") : (conv.creatorName || "");
    const context = conv.type === 'brand' ? (conv.brandName || "") : (conv.campaignTitle || "");
    const instagram = conv.creatorInstagram || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           context.toLowerCase().includes(searchTerm.toLowerCase()) ||
           instagram.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Filter instagram conversations by read status, search, and tags
  const filteredInstagramByRead = instagramConversations
    .filter((conv) => {
      const hasUnread = conv.unreadCount > 0;
      if (readFilter === 'unread' && !hasUnread) return false;
      if (readFilter === 'read' && hasUnread) return false;
      if (searchTerm && !conv.participantUsername?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      // Tag filter: conversation must have at least one of the selected tags
      if (selectedTagFilters.length > 0) {
        const convTags = allConversationTagsMap[conv.conversationId] || [];
        const hasMatchingTag = convTags.some((tag) => selectedTagFilters.includes(tag.id));
        if (!hasMatchingTag) return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return (b.sortTimestamp || 0) - (a.sortTimestamp || 0);
        case 'oldest':
          return (a.sortTimestamp || 0) - (b.sortTimestamp || 0);
        case 'name':
          return (a.participantUsername || '').localeCompare(b.participantUsername || '');
        case 'unread':
          return b.unreadCount - a.unreadCount;
        default:
          return (b.sortTimestamp || 0) - (a.sortTimestamp || 0);
      }
    });

  const handleEmojiClick = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    toast({
      title: "Funcionalidade em breve",
      description: "O envio de arquivos estará disponível em breve.",
    });
    e.target.value = '';
  };

  const handleAudioRecord = () => {
    toast({
      title: "Funcionalidade em breve", 
      description: "A gravação de áudio estará disponível em breve.",
    });
  };

  // Mutation for updating conversation status
  const updateConversationStatusMutation = useMutation({
    mutationFn: async ({ conversationId, status }: { conversationId: number; status: 'open' | 'resolved' }) => {
      if (!apiBase) throw new Error('No API base');
      const res = await fetch(`${apiBase}/conversations/${conversationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiBase, 'conversations'] });
      if (selectedConversation) {
        setSelectedConversation({ ...selectedConversation, status: selectedConversation.status === 'open' ? 'resolved' : 'open' });
      }
      toast({
        title: "Status atualizado",
        description: "O status da conversa foi atualizado com sucesso.",
      });
    },
  });

  const toggleConversationStatus = () => {
    if (!selectedConversation) return;
    const newStatus = selectedConversation.status === 'open' ? 'resolved' : 'open';
    updateConversationStatusMutation.mutate({ conversationId: selectedConversation.id, status: newStatus });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getConversationDisplayName = (conv: UnifiedConversation) => {
    if (isCreator) {
      return conv.brandName || conv.companyName || "Empresa";
    }
    return conv.creatorName || "Criador";
  };

  const getConversationAvatar = (conv: UnifiedConversation) => {
    if (isCreator) {
      return conv.companyLogo || null;
    }
    return conv.creatorAvatar || null;
  };

  const getConversationContext = (conv: UnifiedConversation) => {
    if (conv.type === 'brand') {
      return `Comunidade • ${conv.brandName || ''}`;
    }
    return `Campanha • ${conv.campaignTitle || ''}`;
  };

  if (isCompanyUser && !brandId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
        <Building2 className="h-12 w-12 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Selecione uma marca</h2>
        <p className="text-center max-w-md">
          Para acessar as mensagens, primeiro selecione uma marca no menu lateral.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-heading tracking-tight flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            Mensagens
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="outline" className="gap-1.5 text-green-600 border-green-200 bg-green-50">
              <Wifi className="h-3 w-3" />
              Tempo real
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1.5 text-muted-foreground">
              <WifiOff className="h-3 w-3" />
              Reconectando...
            </Badge>
          )}
        </div>
      </div>

      {syncProgress && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm animate-in fade-in duration-300" data-testid="sync-progress-bar">
          <RefreshCcw className="h-4 w-4 text-blue-500 animate-spin flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {syncProgress.done ? (
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                Sincronização concluída! {syncProgress.synced > 0 ? `${syncProgress.synced} novas mensagens` : 'Tudo atualizado'}
              </span>
            ) : (
              <span className="text-blue-600 dark:text-blue-400">
                Sincronizando mensagens do Instagram...
                {syncProgress.synced > 0 && ` (${syncProgress.synced} novas)`}
                {syncProgress.page > 0 && ` • Página ${syncProgress.page}`}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 h-[calc(100vh-120px)] min-h-[500px]">
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-3 space-y-3">
            {/* Read status filter tabs */}
            <Tabs value={readFilter} onValueChange={(v) => setReadFilter(v as 'all' | 'unread' | 'read')}>
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="all" className="text-xs px-2" data-testid="tab-all">
                  Todas
                </TabsTrigger>
                <TabsTrigger value="unread" className="text-xs px-2" data-testid="tab-unread">
                  Não lidas
                  {(unreadCount.count + instagramUnreadCount) > 0 && (
                    <Badge variant="destructive" className="ml-1.5 h-4 min-w-4 text-[10px] px-1">
                      {unreadCount.count + instagramUnreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="read" className="text-xs px-2" data-testid="tab-read">
                  Lidas
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Search and source filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversas..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-messages"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0" data-testid="button-source-filter">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filtrar por fonte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={sourceFilters.community}
                    onCheckedChange={(checked) => setSourceFilters(prev => ({ ...prev, community: checked }))}
                    data-testid="filter-community"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Comunidade
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={sourceFilters.campaign}
                    onCheckedChange={(checked) => setSourceFilters(prev => ({ ...prev, campaign: checked }))}
                    data-testid="filter-campaign"
                  >
                    <Megaphone className="h-4 w-4 mr-2" />
                    Campanhas
                  </DropdownMenuCheckboxItem>
                  {isCompanyUser && (
                    <DropdownMenuCheckboxItem
                      checked={sourceFilters.dm}
                      onCheckedChange={(checked) => setSourceFilters(prev => ({ ...prev, dm: checked }))}
                      data-testid="filter-dm"
                    >
                      <Instagram className="h-4 w-4 mr-2" />
                      DMs Instagram
                      {instagramUnreadCount > 0 && (
                        <Badge variant="destructive" className="ml-auto h-4 min-w-4 text-[10px] px-1">
                          {instagramUnreadCount}
                        </Badge>
                      )}
                    </DropdownMenuCheckboxItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                    <DropdownMenuRadioItem value="recent" data-testid="sort-recent">
                      <Calendar className="h-4 w-4 mr-2" />
                      Mais recentes
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="oldest" data-testid="sort-oldest">
                      <Calendar className="h-4 w-4 mr-2" />
                      Mais antigas
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="name" data-testid="sort-name">
                      <User2 className="h-4 w-4 mr-2" />
                      Nome (A-Z)
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="unread" data-testid="sort-unread">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Não lidas primeiro
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                  
                  {isCompanyUser && instagramUnreadCount > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sm font-normal px-2"
                        onClick={() => markAllAsReadMutation.mutate()}
                        disabled={markAllAsReadMutation.isPending}
                        data-testid="button-mark-all-read"
                      >
                        {markAllAsReadMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckAll className="h-4 w-4 mr-2" />
                        )}
                        Marcar tudo como lido
                      </Button>
                    </>
                  )}
                  
                  {isCompanyUser && allTags.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Filtrar por tags</DropdownMenuLabel>
                      {allTags.map((tag) => (
                        <DropdownMenuCheckboxItem
                          key={tag.id}
                          checked={selectedTagFilters.includes(tag.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTagFilters((prev) => [...prev, tag.id]);
                            } else {
                              setSelectedTagFilters((prev) => prev.filter((id) => id !== tag.id));
                            }
                          }}
                          data-testid={`filter-tag-${tag.id}`}
                        >
                          <span
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </DropdownMenuCheckboxItem>
                      ))}
                      {selectedTagFilters.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-sm font-normal px-2 text-muted-foreground"
                          onClick={() => setSelectedTagFilters([])}
                          data-testid="button-clear-tag-filters"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Limpar filtros de tags
                        </Button>
                      )}
                    </>
                  )}
                  
                  {isCompanyUser && (
                    <>
                      <DropdownMenuSeparator />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sm font-normal px-2"
                        onClick={() => setTagManagerOpen(true)}
                        data-testid="button-manage-tags"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Gerenciar tags
                      </Button>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {/* Combined list: Instagram DMs + Regular conversations */}
              {loadingConversations || (sourceFilters.dm && isLoadingInstagramConversations) ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (filteredConversations.length === 0 && filteredInstagramByRead.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Inbox className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Nenhuma conversa</h3>
                  <p className="text-muted-foreground text-center text-sm max-w-[250px]">
                    {searchTerm 
                      ? "Nenhuma conversa encontrada para essa busca."
                      : isCreator 
                        ? "Suas conversas aparecerão aqui quando você entrar em uma comunidade ou for aceito em uma campanha."
                        : "Suas conversas com criadores aparecerão aqui."
                    }
                  </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {/* Regular conversations */}
                    {filteredConversations.map((conv) => {
                      const displayName = isCreator ? (conv.brandName || conv.companyName || "Empresa") : (conv.creatorName || "Criador");
                      const avatar = isCreator ? conv.companyLogo : conv.creatorAvatar;
                      const instagramHandle = conv.creatorInstagram;
                      
                      return (
                        <button
                          key={`conv-${conv.id}`}
                          onClick={() => {
                            setSelectedConversation(conv);
                            setSelectedInstagramConversation(null);
                          }}
                          className={`w-full p-3 text-left hover:bg-muted/50 transition-colors ${
                            selectedConversation?.id === conv.id ? "bg-muted" : ""
                          }`}
                          data-testid={`conversation-${conv.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={getAvatarUrl(avatar, displayName)} />
                              <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <p className={`font-medium truncate ${(conv.unreadCount || 0) > 0 ? "font-semibold" : ""}`}>
                                    {instagramHandle ? `@${instagramHandle}` : displayName}
                                  </p>
                                  {conv.status === 'resolved' && (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {conv.type === 'brand' ? (
                                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                  ) : (
                                    <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                  {(conv.unreadCount || 0) > 0 && (
                                    <Badge variant="default" className="h-5 min-w-5 flex items-center justify-center text-[10px]">
                                      {conv.unreadCount}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {conv.lastMessage?.createdAt 
                                  ? formatDistanceToNow(new Date(conv.lastMessage.createdAt), {
                                      addSuffix: true,
                                      locale: ptBR,
                                    })
                                  : 'Sem mensagens'
                                }
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    
                    {/* Instagram DMs */}
                    {sourceFilters.dm && isCompanyUser && filteredInstagramByRead
                      .map((conv) => {
                        const displayName = conv.participantUsername || "Usuário";
                        const initial = displayName.charAt(0).toUpperCase();
                        
                        return (
                          <button
                            key={`ig-${conv.conversationId}`}
                            onClick={() => {
                              setSelectedInstagramConversation(conv);
                              setSelectedConversation(null);
                            }}
                            className={`w-full p-3 text-left hover:bg-muted/50 transition-colors ${
                              selectedInstagramConversation?.conversationId === conv.conversationId ? "bg-muted" : ""
                            }`}
                            data-testid={`instagram-conversation-${conv.conversationId}`}
                          >
                            <div className="flex items-center gap-3">
                              <InstagramAvatar
                                username={displayName}
                                initialPicUrl={conv.participantProfilePic}
                                size="md"
                                data-testid={`avatar-instagram-${conv.conversationId}`}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className={`font-medium truncate ${conv.unreadCount > 0 ? "font-semibold" : ""}`}>
                                    @{displayName}
                                  </p>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <Instagram className="h-3.5 w-3.5 text-muted-foreground" />
                                    {conv.unreadCount > 0 && (
                                      <Badge variant="default" className="h-5 min-w-5 flex items-center justify-center text-[10px]">
                                        {conv.unreadCount}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-0.5 mt-0.5">
                                  <p className="text-xs text-muted-foreground" data-testid={`date-last-msg-${conv.conversationId}`}>
                                    {formatSmartDate(conv.lastMessageAt)}
                                  </p>
                                  {conv.lastIncomingMessageAt && conv.lastIncomingMessageAt !== conv.lastMessageAt && (
                                    <p className="text-[10px] text-muted-foreground/70" data-testid={`date-last-incoming-${conv.conversationId}`}>
                                      <User2 className="inline h-3 w-3 mr-0.5" />
                                      {formatSmartDate(conv.lastIncomingMessageAt)}
                                    </p>
                                  )}
                                </div>
                                {/* Tags display */}
                                {allConversationTagsMap[conv.conversationId]?.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {allConversationTagsMap[conv.conversationId].slice(0, 3).map((tag) => (
                                      <span
                                        key={tag.id}
                                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] text-white"
                                        style={{ backgroundColor: tag.color }}
                                        data-testid={`tag-badge-${tag.id}`}
                                      >
                                        {tag.name}
                                      </span>
                                    ))}
                                    {allConversationTagsMap[conv.conversationId].length > 3 && (
                                      <span className="text-[10px] text-muted-foreground">
                                        +{allConversationTagsMap[conv.conversationId].length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="flex flex-col overflow-hidden">
          {selectedInstagramConversation ? (
            // Instagram DM conversation view
            <>
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <InstagramAvatar
                    username={selectedInstagramConversation.participantUsername || ""}
                    size="md"
                    className="hover:ring-2 hover:ring-primary transition-all"
                    onClick={() => setProfileDrawerOpen(true)}
                    data-testid="avatar-open-profile"
                  />
                  <button 
                    className="flex-1 text-left hover:underline"
                    onClick={() => setProfileDrawerOpen(true)}
                    data-testid="button-open-profile"
                  >
                    <CardTitle className="text-lg">@{selectedInstagramConversation.participantUsername || "Usuário"}</CardTitle>
                  </button>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setProfileDrawerOpen(true)}
                      data-testid="button-view-profile"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver perfil
                    </Button>
                    {/* Tag assignment popover */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" data-testid="button-assign-tags">
                          <Tag className="h-4 w-4 mr-2" />
                          Tags
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64" align="end">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Gerenciar tags</h4>
                          
                          {/* Current tags */}
                          {currentConversationTags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {currentConversationTags.map((tag) => (
                                <span
                                  key={tag.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-white"
                                  style={{ backgroundColor: tag.color }}
                                  data-testid={`current-tag-${tag.id}`}
                                >
                                  {tag.name}
                                  <button
                                    onClick={() => removeTagFromConversationMutation.mutate({
                                      conversationId: selectedInstagramConversation.conversationId,
                                      tagId: tag.id,
                                    })}
                                    className="hover:opacity-80"
                                    data-testid={`remove-tag-${tag.id}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* Available tags to add */}
                          <div className="border-t pt-2">
                            <p className="text-xs text-muted-foreground mb-2">Adicionar tag</p>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {allTags
                                .filter((tag) => !currentConversationTags.some((ct) => ct.id === tag.id))
                                .map((tag) => (
                                  <button
                                    key={tag.id}
                                    onClick={() => addTagToConversationMutation.mutate({
                                      conversationId: selectedInstagramConversation.conversationId,
                                      tagId: tag.id,
                                    })}
                                    className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-muted text-sm"
                                    data-testid={`add-tag-${tag.id}`}
                                  >
                                    <span
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: tag.color }}
                                    />
                                    {tag.name}
                                  </button>
                                ))}
                              {allTags.filter((tag) => !currentConversationTags.some((ct) => ct.id === tag.id)).length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                  {allTags.length === 0 ? "Nenhuma tag criada" : "Todas as tags aplicadas"}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => setTagManagerOpen(true)}
                            data-testid="button-open-tag-manager-from-popover"
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Gerenciar tags
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    
                    {brandId && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          if (selectedInstagramConversation.participantUsername) {
                            inviteToCommunityMutation.mutate({ 
                              instagramUsername: selectedInstagramConversation.participantUsername 
                            });
                          }
                        }}
                        disabled={inviteToCommunityMutation.isPending || !selectedInstagramConversation.participantUsername}
                        data-testid="button-invite-to-community"
                      >
                        {inviteToCommunityMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Convidar
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                  {isLoadingInstagramMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : instagramMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                      <p>Nenhuma mensagem ainda</p>
                      <p className="text-sm">Envie a primeira mensagem!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {instagramMessages.map((msg) => (
                        <div 
                          key={msg.id}
                          className={`flex gap-2 ${msg.isIncoming ? "justify-start" : "justify-end"}`}
                          data-testid={`instagram-message-${msg.id}`}
                        >
                          {msg.isIncoming ? (
                            <InstagramAvatar
                              username={msg.senderUsername || selectedInstagramConversation?.participantUsername || ""}
                              size="sm"
                              data-testid={`avatar-message-${msg.id}`}
                            />
                          ) : (
                            instagramUsername && (
                              <InstagramAvatar
                                username={instagramUsername}
                                initialPicUrl={businessProfilePicUrl}
                                size="sm"
                                className="order-last"
                                data-testid={`avatar-message-business-${msg.id}`}
                              />
                            )
                          )}
                          <div 
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              msg.isIncoming 
                                ? "bg-muted text-foreground" 
                                : "bg-primary text-primary-foreground"
                            }`}
                          >
                            {msg.isIncoming && msg.senderUsername && (
                              <p className="text-xs font-medium mb-1 opacity-70">@{msg.senderUsername}</p>
                            )}
                            {/* Display attachments if present */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mb-2 space-y-2">
                                {msg.attachments.map((att, idx) => (
                                  <div key={idx}>
                                    {/* Detect images: by type, messageType, or by presence of width/height with file type */}
                                    {(att.type === 'image' || msg.messageType === 'image' || 
                                      (att.type === 'file' && att.width && att.height && att.url?.includes('fbsbx.com'))) && att.url && (
                                      <img 
                                        src={att.url} 
                                        alt="Anexo" 
                                        className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                        style={{ maxHeight: '300px' }}
                                        onClick={() => window.open(att.url, '_blank')}
                                      />
                                    )}
                                    {(att.type === 'video' || msg.messageType === 'video') && att.url && (
                                      <video 
                                        src={att.url} 
                                        controls 
                                        className="max-w-full rounded-lg"
                                        style={{ maxHeight: '300px' }}
                                      />
                                    )}
                                    {(att.type === 'audio' || msg.messageType === 'audio') && att.url && (
                                      <audio src={att.url} controls className="w-full" />
                                    )}
                                    {att.type === 'share' && (
                                      <a 
                                        href={att.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-500 underline text-sm"
                                      >
                                        Compartilhamento externo
                                      </a>
                                    )}
                                    {(att.type === 'story_mention' || msg.messageType === 'story_mention') && (
                                      <div className="flex items-center gap-2 text-sm opacity-80">
                                        <Instagram className="h-4 w-4" />
                                        Menção no Story
                                        {att.url && (
                                          <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                                            Ver
                                          </a>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Display message text */}
                            {msg.messageText ? (
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.messageText}</p>
                            ) : (!msg.attachments || msg.attachments.length === 0) ? (
                              <p className="text-sm whitespace-pre-wrap break-words opacity-60">
                                {msg.messageType === 'text' ? "[Conteúdo indisponível]" : `[${msg.messageType || 'Anexo'}]`}
                              </p>
                            ) : null}
                            <div className={`flex items-center gap-1 mt-1 text-xs ${
                              msg.isIncoming ? "text-muted-foreground" : "text-primary-foreground/70"
                            }`}>
                              <Clock className="h-3 w-3" />
                              {msg.sentAt && format(new Date(msg.sentAt), "HH:mm", { locale: ptBR })}
                              {!msg.isIncoming && (
                                <CheckCheck className={`h-3 w-3 ml-1 ${msg.isRead ? "text-blue-400" : ""}`} />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
              <div className="p-4 border-t">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendInstagramMessage(); }}
                  className="flex items-center gap-2"
                >
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        data-testid="button-emoji-picker"
                      >
                        <Smile className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2" align="start">
                      <div className="grid grid-cols-8 gap-1">
                        {['😀', '😂', '😍', '🥰', '😊', '🤗', '😎', '🤩',
                          '👍', '👏', '🙌', '💪', '🔥', '❤️', '💕', '✨',
                          '🎉', '🎊', '💯', '⭐', '🌟', '💫', '💖', '💗',
                          '👋', '🤝', '🙏', '💬', '📸', '🎥', '📱', '💼',
                          '✅', '🚀', '💡', '🎯', '📈', '🏆', '👑', '💎'].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className="text-xl hover:bg-muted rounded p-1 transition-colors"
                            onClick={() => setInstagramMessageInput(prev => prev + emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        data-testid="button-attachment"
                        title="Enviar anexo"
                      >
                        <Paperclip className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" align="start">
                      <p className="text-sm text-muted-foreground">
                        O envio de imagens e anexos via Instagram DM ainda nao e suportado pela API do Meta.
                      </p>
                    </PopoverContent>
                  </Popover>
                  <Input 
                    placeholder="Digite sua mensagem..." 
                    value={instagramMessageInput}
                    onChange={(e) => setInstagramMessageInput(e.target.value)}
                    disabled={sendInstagramMessageMutation.isPending}
                    className="flex-1"
                    data-testid="input-instagram-message"
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={!instagramMessageInput.trim() || sendInstagramMessageMutation.isPending}
                    data-testid="button-send-instagram-message"
                  >
                    {sendInstagramMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : selectedConversation ? (
            // Regular conversation view
            <>
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getAvatarUrl(getConversationAvatar(selectedConversation), getConversationDisplayName(selectedConversation))} />
                    <AvatarFallback>{getConversationDisplayName(selectedConversation).charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">
                        {selectedConversation.creatorInstagram 
                          ? `@${selectedConversation.creatorInstagram}`
                          : getConversationDisplayName(selectedConversation)
                        }
                      </CardTitle>
                      {selectedConversation.status === 'resolved' && (
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Resolvida
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      {selectedConversation.type === 'brand' ? (
                        <Building2 className="h-3 w-3" />
                      ) : (
                        <Megaphone className="h-3 w-3" />
                      )}
                      <span>{getConversationContext(selectedConversation)}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleConversationStatus}
                    disabled={updateConversationStatusMutation.isPending}
                    data-testid="button-toggle-status"
                  >
                    {updateConversationStatusMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : selectedConversation.status === 'open' ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        Marcar resolvida
                      </>
                    ) : (
                      <>
                        <Circle className="h-4 w-4 mr-1.5" />
                        Reabrir
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                      <p>Nenhuma mensagem ainda</p>
                      <p className="text-sm">Envie a primeira mensagem!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isOwnMessage = message.senderId === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                isOwnMessage
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              {!isOwnMessage && message.senderName && (
                                <p className="text-xs font-medium mb-1 opacity-70">
                                  {message.senderName}
                                </p>
                              )}
                              <p className="text-sm">{message.body}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                                }`}
                              >
                                {formatDistanceToNow(new Date(message.createdAt), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
              <div className="p-4 border-t">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,video/*,.pdf,.doc,.docx"
                />
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          data-testid="button-emoji"
                        >
                          <Smile className="h-5 w-5 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="top" align="start" className="w-64 p-2">
                        <div className="grid grid-cols-8 gap-1">
                          {['😀', '😂', '😍', '🥰', '😊', '🤗', '😎', '🤩',
                            '👍', '👏', '🙌', '💪', '🔥', '❤️', '💕', '✨',
                            '🎉', '🎊', '💯', '⭐', '🌟', '💫', '💖', '💗',
                            '👋', '🤝', '🙏', '💬', '📸', '🎥', '📱', '💼',
                            '✅', '🚀', '💡', '🎯', '📈', '🏆', '👑', '💎'].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              className="text-xl hover:bg-muted rounded p-1 transition-colors"
                              onClick={() => handleEmojiClick(emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={handleFileUpload}
                      data-testid="button-attach"
                    >
                      <Paperclip className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={handleAudioRecord}
                      data-testid="button-audio"
                    >
                      <Mic className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sendMessageMutation.isPending}
                    className="flex-1"
                    data-testid="input-new-message"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    data-testid="button-send-message"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            // Empty state
            <CardContent className="h-full flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-6 mb-4">
                <MessageSquare className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Selecione uma conversa</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Escolha uma conversa na lista ao lado para visualizar as mensagens e continuar a comunicação.
              </p>
              <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{conversations.length + (sourceFilters.dm ? instagramConversations.length : 0)} conversas</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>{unreadCount.count + (sourceFilters.dm ? instagramUnreadCount : 0)} não lidas</span>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Profile Drawer */}
      <Sheet open={profileDrawerOpen} onOpenChange={setProfileDrawerOpen}>
        <SheetContent className="w-full max-w-[520px] sm:max-w-[560px] p-0 border-l border-border/50 overflow-hidden" data-testid="profile-drawer">
          <div className="h-full flex flex-col">
            {/* Gradient Header */}
            <div className="relative bg-gradient-to-br from-purple-600/90 via-pink-500/80 to-orange-400/70 px-6 pt-8 pb-14">
              <button
                onClick={() => setProfileDrawerOpen(false)}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/30 transition-all"
                data-testid="button-close-drawer"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                <Instagram className="h-4 w-4" />
                <span>Perfil do Instagram</span>
              </div>
            </div>

            {/* Avatar overlapping header */}
            <div className="relative -mt-10 px-6 mb-3">
              <div className="flex flex-col items-center">
                <div className="rounded-full p-1 bg-background shadow-xl">
                  <InstagramAvatar
                    username={selectedInstagramConversation?.participantUsername || ""}
                    size="xl"
                    data-testid="avatar-profile-drawer"
                  />
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-8">
              {loadingProfile ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Username & Name */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <h3 className="text-xl font-bold">
                        @{fullProfileData?.username || selectedInstagramConversation?.participantUsername || "Usuário"}
                      </h3>
                      {fullProfileData?.isVerified && (
                        <BadgeCheck className="h-5 w-5 text-blue-500" />
                      )}
                      {fullProfileData?.isPrivate && (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    {fullProfileData?.fullName && (
                      <p className="text-muted-foreground mt-0.5 text-sm">{fullProfileData.fullName}</p>
                    )}
                  </div>

                  {/* Stats Row */}
                  {fullProfileData && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 rounded-xl bg-muted/50 border border-border/50">
                        <p className="text-xl font-bold tabular-nums">
                          {fullProfileData.postsCount?.toLocaleString('pt-BR') || '–'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">Posts</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-muted/50 border border-border/50">
                        <p className="text-xl font-bold tabular-nums">
                          {fullProfileData.followers?.toLocaleString('pt-BR') || '–'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">Seguidores</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-muted/50 border border-border/50">
                        <p className="text-xl font-bold tabular-nums">
                          {fullProfileData.following?.toLocaleString('pt-BR') || '–'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">Seguindo</p>
                      </div>
                    </div>
                  )}

                  {/* Bio */}
                  {fullProfileData?.bio && (
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
                      <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                        {fullProfileData.bio}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons - Inline */}
                  <div className="flex gap-2 items-center">
                    {brandId && selectedInstagramConversation?.participantUsername && (
                      <Button 
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white border-0 h-9"
                        onClick={() => {
                          inviteToCommunityMutation.mutate({ 
                            instagramUsername: selectedInstagramConversation.participantUsername! 
                          });
                          setProfileDrawerOpen(false);
                        }}
                        disabled={inviteToCommunityMutation.isPending}
                        data-testid="button-invite-from-drawer-top"
                      >
                        {inviteToCommunityMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <UserPlus className="h-4 w-4 mr-2" />
                        )}
                        Convidar para Comunidade
                      </Button>
                    )}
                    <Button 
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => {
                        const username = fullProfileData?.username || selectedInstagramConversation?.participantUsername;
                        if (username) {
                          window.open(`https://instagram.com/${username}`, '_blank');
                        }
                      }}
                      data-testid="button-open-instagram"
                      title="Abrir no Instagram"
                    >
                      <Instagram className="h-4 w-4" />
                    </Button>
                    {fullProfileData?.externalUrl && (
                      <Button 
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => window.open(fullProfileData.externalUrl, '_blank')}
                        data-testid="button-open-website"
                        title="Abrir site externo"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Timeline - First & Last Interaction */}
                  <div className="grid grid-cols-2 gap-2" data-testid="section-interaction-dates">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/15">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <Calendar className="h-3.5 w-3.5 text-blue-400" />
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Primeira msg</span>
                      </div>
                      <p className="font-bold text-sm tabular-nums text-foreground pl-9">
                        {fullProfileData?.messageStats?.firstMessageAt 
                          ? format(new Date(fullProfileData.messageStats.firstMessageAt), "dd/MM/yyyy", { locale: ptBR })
                          : selectedInstagramConversation?.lastMessageAt 
                          ? format(new Date(selectedInstagramConversation.lastMessageAt), "dd/MM/yyyy", { locale: ptBR })
                          : '–'
                        }
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/5 to-green-500/5 border border-emerald-500/15">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <Clock className="h-3.5 w-3.5 text-emerald-400" />
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Última msg</span>
                      </div>
                      <p className="font-bold text-sm tabular-nums text-foreground pl-9">
                        {fullProfileData?.messageStats?.lastMessageAt 
                          ? formatDistanceToNow(new Date(fullProfileData.messageStats.lastMessageAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })
                          : selectedInstagramConversation?.lastMessageAt 
                          ? formatDistanceToNow(new Date(selectedInstagramConversation.lastMessageAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })
                          : '–'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Profile Engagement Metrics */}
                  {fullProfileData && (fullProfileData.totalLikes !== undefined || fullProfileData.totalComments !== undefined) && (
                    <div className="space-y-3" data-testid="section-engagement-metrics">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-1 rounded-full bg-gradient-to-b from-red-500 to-orange-500" />
                        <h4 className="font-semibold text-sm">Engajamento do Perfil</h4>
                        <span className="text-xs text-muted-foreground">(últimos 30 posts)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-red-500/5 border border-red-500/10" data-testid="stat-total-likes">
                          <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                            <Heart className="h-3.5 w-3.5 text-red-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-base tabular-nums leading-tight">{fullProfileData.totalLikes?.toLocaleString('pt-BR') || '–'}</p>
                            <p className="text-[10px] text-muted-foreground">Likes</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/10" data-testid="stat-total-comments">
                          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                            <MessageCircle className="h-3.5 w-3.5 text-blue-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-base tabular-nums leading-tight">{fullProfileData.totalComments?.toLocaleString('pt-BR') || '–'}</p>
                            <p className="text-[10px] text-muted-foreground">Comentários</p>
                          </div>
                        </div>
                      </div>
                      {(fullProfileData.avgLikesPerPost !== undefined && fullProfileData.avgCommentsPerPost !== undefined) && (
                        <p className="text-[10px] text-muted-foreground text-center" data-testid="text-avg-engagement">
                          Média: {fullProfileData.avgLikesPerPost?.toLocaleString('pt-BR')} likes · {fullProfileData.avgCommentsPerPost?.toLocaleString('pt-BR')} comentários/post
                        </p>
                      )}
                    </div>
                  )}

                  {/* Interações com a Empresa - Unified Block */}
                  <div className="space-y-3" data-testid="section-company-engagement">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-1 rounded-full bg-gradient-to-b from-violet-500 to-indigo-500" />
                        <div>
                          <h4 className="font-semibold text-sm">Interações com a Empresa</h4>
                          <p className="text-[10px] text-muted-foreground">Comentários e mensagens trocadas</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => syncPostsMutation.mutate()}
                        disabled={syncPostsMutation.isPending}
                        data-testid="btn-sync-posts"
                        title="Atualizar comentários"
                      >
                        <RefreshCcw className={`h-3.5 w-3.5 ${syncPostsMutation.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-xl bg-violet-500/5 border border-violet-500/10 text-center" data-testid="stat-company-comments">
                        <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center mx-auto mb-1.5">
                          <MessageCircle className="h-3.5 w-3.5 text-violet-500" />
                        </div>
                        <p className="font-bold text-base tabular-nums leading-tight">{(fullProfileData?.contact?.totalCommentsOnPosts || fullProfileData?.companyEngagement?.commentsCount || 0).toLocaleString('pt-BR')}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Comentários</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-green-500/5 border border-green-500/10 text-center">
                        <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center mx-auto mb-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-green-600" />
                        </div>
                        <p className="font-bold text-base tabular-nums leading-tight">{fullProfileData?.contact?.totalDmsReceived || fullProfileData?.messageStats?.totalIncoming || selectedInstagramConversation?.incomingMessageCount || 0}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Recebidas</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-center">
                        <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center mx-auto mb-1.5">
                          <Send className="h-3.5 w-3.5 text-indigo-600" />
                        </div>
                        <p className="font-bold text-base tabular-nums leading-tight">{fullProfileData?.contact?.totalDmsSent || fullProfileData?.messageStats?.totalOutgoing || 0}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Enviadas</p>
                      </div>
                    </div>
                    {(fullProfileData?.companyEngagement?.commentsCount || 0) === 0 && !fullProfileData?.contact?.totalCommentsOnPosts && (
                      <p className="text-[10px] text-muted-foreground italic text-center">
                        Clique em ↻ para buscar comentários nos seus posts
                      </p>
                    )}
                  </div>

                  {fullProfileData?.contact && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-primary/5 to-violet-500/5 border border-primary/10" data-testid="section-interaction-score">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Zap className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Score de Interação</p>
                          <p className="font-bold text-sm">{fullProfileData.contact.interactionScore || 0}</p>
                        </div>
                      </div>
                      <Badge variant={
                        fullProfileData.contact.status === 'vip' ? 'default' :
                        fullProfileData.contact.status === 'engaged' ? 'secondary' :
                        fullProfileData.contact.status === 'member' ? 'outline' :
                        'outline'
                      } className="text-[10px] capitalize">
                        {fullProfileData.contact.status || 'lead'}
                      </Badge>
                    </div>
                  )}

                  {/* Private Notes */}
                  <div className="space-y-3" data-testid="section-private-notes">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-1 rounded-full bg-gradient-to-b from-yellow-500 to-amber-500" />
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <StickyNote className="h-4 w-4 text-yellow-500" />
                        Notas Privadas
                      </h4>
                    </div>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto" data-testid="notes-list">
                      {loadingNotes ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : contactNotes.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic py-2 text-center" data-testid="text-no-notes">
                          Nenhuma nota adicionada
                        </p>
                      ) : (
                        contactNotes.map((note) => (
                          <div 
                            key={note.id} 
                            className="group p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10 relative"
                            data-testid={`note-card-${note.id}`}
                          >
                            <p className="text-sm whitespace-pre-wrap pr-6" data-testid={`note-content-${note.id}`}>
                              {note.content}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1.5" data-testid={`note-timestamp-${note.id}`}>
                              {formatDistanceToNow(new Date(note.createdAt), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => deleteNoteMutation.mutate(note.id)}
                              disabled={deleteNoteMutation.isPending}
                              data-testid={`button-delete-note-${note.id}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Note Form */}
                    <div className="space-y-2" data-testid="add-note-form">
                      <Textarea
                        placeholder="Adicione uma nota privada..."
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        className="min-h-[80px] resize-none rounded-xl"
                        data-testid="textarea-new-note"
                      />
                      <Button
                        className="w-full"
                        size="sm"
                        onClick={() => {
                          if (newNoteContent.trim() && selectedInstagramConversation?.participantUsername) {
                            addNoteMutation.mutate({
                              instagramUsername: selectedInstagramConversation.participantUsername,
                              content: newNoteContent.trim(),
                            });
                          }
                        }}
                        disabled={!newNoteContent.trim() || addNoteMutation.isPending}
                        data-testid="button-add-note"
                      >
                        {addNoteMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        Adicionar nota
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Tag Manager Dialog */}
      <Dialog open={tagManagerOpen} onOpenChange={setTagManagerOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-tag-manager">
          <DialogHeader>
            <DialogTitle>Gerenciar Tags</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Create new tag form */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="tag-name">Nome da tag</Label>
                <Input
                  id="tag-name"
                  value={editingTag ? editingTag.name : newTagName}
                  onChange={(e) => {
                    if (editingTag) {
                      setEditingTag({ ...editingTag, name: e.target.value });
                    } else {
                      setNewTagName(e.target.value);
                    }
                  }}
                  placeholder="Ex: Cliente VIP"
                  data-testid="input-tag-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => {
                        if (editingTag) {
                          setEditingTag({ ...editingTag, color: color.value });
                        } else {
                          setNewTagColor(color.value);
                        }
                      }}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        (editingTag ? editingTag.color : newTagColor) === color.value
                          ? "border-primary scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                      data-testid={`color-${color.name.toLowerCase()}`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                {editingTag ? (
                  <>
                    <Button
                      onClick={() => {
                        updateTagMutation.mutate({
                          id: editingTag.id,
                          name: editingTag.name,
                          color: editingTag.color,
                        });
                      }}
                      disabled={!editingTag.name.trim() || updateTagMutation.isPending}
                      className="flex-1"
                      data-testid="button-update-tag"
                    >
                      {updateTagMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Salvar
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingTag(null)}
                      data-testid="button-cancel-edit"
                    >
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => createTagMutation.mutate({ name: newTagName, color: newTagColor })}
                    disabled={!newTagName.trim() || createTagMutation.isPending}
                    className="w-full"
                    data-testid="button-create-tag"
                  >
                    {createTagMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar tag
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            
            {/* Existing tags list */}
            {allTags.length > 0 && (
              <div className="border-t pt-4">
                <Label className="mb-2 block">Tags existentes</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {allTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted"
                      data-testid={`tag-item-${tag.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm">{tag.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingTag(tag)}
                          data-testid={`button-edit-tag-${tag.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteTagMutation.mutate(tag.id)}
                          disabled={deleteTagMutation.isPending}
                          data-testid={`button-delete-tag-${tag.id}`}
                        >
                          {deleteTagMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
