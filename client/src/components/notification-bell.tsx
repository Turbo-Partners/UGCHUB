import { useState, useEffect, useRef } from 'react';
import { Bell, Mail, CheckCircle, XCircle, Megaphone, MessageSquare, UserPlus, FileText, Gift, Instagram, Users, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocation } from 'wouter';
import type { Notification, WebSocketEvent, CampaignInvite, Campaign, User } from '@shared/schema';
import { formatDistanceToNow, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { useMarketplace } from '@/lib/provider';
import { cn } from '@/lib/utils';

function formatDateSafe(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return 'agora';
  
  try {
    const date = new Date(dateInput);
    if (!isValid(date)) return 'agora';
    
    return formatDistanceToNow(date, { 
      addSuffix: true,
      locale: ptBR 
    });
  } catch {
    return 'agora';
  }
}

type NotificationType =
  | 'campaign_invite'
  | 'application_accepted'
  | 'application_rejected'
  | 'new_campaign'
  | 'new_applicant'
  | 'message'
  | 'contract_created'
  | 'contract_signed'
  | 'deliverable_created'
  | 'deliverable_approved'
  | 'deliverable_rejected'
  | 'new_instagram_post'
  | 'community_join_request'
  | 'community_member_joined'
  | 'general';

interface NotificationStyle {
  bgColor: string;
  borderColor: string;
  iconBg: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

function getNotificationStyle(type: string): NotificationStyle {
  switch (type) {
    case 'campaign_invite':
      return {
        bgColor: 'bg-gradient-to-r from-purple-50 to-pink-50',
        borderColor: 'border-l-4 border-l-purple-400',
        iconBg: 'bg-purple-100',
        icon: <Gift className="h-4 w-4 text-purple-600" />,
        highlight: true,
      };
    case 'application_accepted':
      return {
        bgColor: 'bg-green-50',
        borderColor: 'border-l-4 border-l-green-400',
        iconBg: 'bg-green-100',
        icon: <CheckCircle className="h-4 w-4 text-green-600" />,
      };
    case 'application_rejected':
      return {
        bgColor: 'bg-red-50',
        borderColor: 'border-l-4 border-l-red-400',
        iconBg: 'bg-red-100',
        icon: <XCircle className="h-4 w-4 text-red-600" />,
      };
    case 'new_campaign':
      return {
        bgColor: 'bg-blue-50',
        borderColor: 'border-l-4 border-l-blue-400',
        iconBg: 'bg-blue-100',
        icon: <Megaphone className="h-4 w-4 text-blue-600" />,
      };
    case 'new_applicant':
      return {
        bgColor: 'bg-amber-50',
        borderColor: 'border-l-4 border-l-amber-400',
        iconBg: 'bg-amber-100',
        icon: <UserPlus className="h-4 w-4 text-amber-600" />,
      };
    case 'message':
      return {
        bgColor: 'bg-sky-50',
        borderColor: 'border-l-4 border-l-sky-400',
        iconBg: 'bg-sky-100',
        icon: <MessageSquare className="h-4 w-4 text-sky-600" />,
      };
    case 'contract_created':
    case 'contract_signed':
      return {
        bgColor: 'bg-indigo-50',
        borderColor: 'border-l-4 border-l-indigo-400',
        iconBg: 'bg-indigo-100',
        icon: <FileText className="h-4 w-4 text-indigo-600" />,
      };
    case 'deliverable_created':
      return {
        bgColor: 'bg-teal-50',
        borderColor: 'border-l-4 border-l-teal-400',
        iconBg: 'bg-teal-100',
        icon: <FileText className="h-4 w-4 text-teal-600" />,
      };
    case 'deliverable_approved':
      return {
        bgColor: 'bg-green-50',
        borderColor: 'border-l-4 border-l-green-400',
        iconBg: 'bg-green-100',
        icon: <ThumbsUp className="h-4 w-4 text-green-600" />,
      };
    case 'deliverable_rejected':
      return {
        bgColor: 'bg-orange-50',
        borderColor: 'border-l-4 border-l-orange-400',
        iconBg: 'bg-orange-100',
        icon: <ThumbsDown className="h-4 w-4 text-orange-600" />,
      };
    case 'community_join_request':
      return {
        bgColor: 'bg-violet-50',
        borderColor: 'border-l-4 border-l-violet-400',
        iconBg: 'bg-violet-100',
        icon: <UserPlus className="h-4 w-4 text-violet-600" />,
      };
    case 'community_member_joined':
      return {
        bgColor: 'bg-emerald-50',
        borderColor: 'border-l-4 border-l-emerald-400',
        iconBg: 'bg-emerald-100',
        icon: <Users className="h-4 w-4 text-emerald-600" />,
      };
    case 'new_instagram_post':
      return {
        bgColor: 'bg-gradient-to-r from-pink-50 to-purple-50',
        borderColor: 'border-l-4 border-l-pink-400',
        iconBg: 'bg-gradient-to-br from-pink-500 to-purple-600',
        icon: <Instagram className="h-4 w-4 text-white" />,
        highlight: true,
      };
    default:
      return {
        bgColor: 'bg-gray-50',
        borderColor: 'border-l-4 border-l-gray-300',
        iconBg: 'bg-gray-100',
        icon: <Bell className="h-4 w-4 text-gray-600" />,
      };
  }
}

type InviteWithDetails = CampaignInvite & { campaign: Campaign; company: User };

interface UnifiedNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string | null;
  isRead: boolean;
  createdAt: string | Date;
  inviteId?: number;
  campaignId?: number;
}

export function NotificationBell() {
  const [_, setLocation] = useLocation();
  const { user } = useMarketplace();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  const isCreator = user?.role === 'creator';

  const { data: pendingInvites = [] } = useQuery<InviteWithDetails[]>({
    queryKey: ['/api/invites/pending'],
    queryFn: async () => {
      const res = await fetch('/api/invites/pending', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isCreator,
    refetchInterval: 30000,
  });

  useEffect(() => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const duration = 0.25;
      const sampleRate = audioContextRef.current.sampleRate;
      const buffer = audioContextRef.current.createBuffer(1, duration * sampleRate, sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-5 * t);
        const freq1 = 659.25;
        const freq2 = 783.99;
        
        const tone1 = Math.sin(2 * Math.PI * freq1 * t) * envelope * 0.2;
        const tone2 = t > 0.08 ? Math.sin(2 * Math.PI * freq2 * (t - 0.08)) * envelope * 0.2 : 0;
        
        data[i] = tone1 + tone2;
      }
      
      audioBufferRef.current = buffer;
    } catch (e) {
      console.log('Audio initialization failed:', e);
    }
    
    const playNotificationSound = () => {
      if (!audioContextRef.current || !audioBufferRef.current) {
        return Promise.reject('Audio not initialized');
      }
      
      try {
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.connect(audioContextRef.current.destination);
        source.start(0);
        return Promise.resolve();
      } catch (e) {
        console.log('Audio play failed:', e);
        return Promise.reject(e);
      }
    };
    
    audioRef.current = { play: playNotificationSound };
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;
    
    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/notifications`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected to notification server');
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketEvent = JSON.parse(event.data);
          
          if (data.type === 'notification') {
            const notification = data.data;
            
            if (notification.type === 'campaign_invite') {
              queryClient.invalidateQueries({ queryKey: ['/api/invites'] });
              queryClient.invalidateQueries({ queryKey: ['/api/invites/pending'] });
              queryClient.invalidateQueries({ queryKey: ['/api/invites/count'] });
              
              if (audioRef.current) {
                audioRef.current.play().catch((e: any) => console.log('Audio play failed:', e));
              }
              return;
            }
            
            // Skip message notifications - they go to MessageIcon
            if (notification.type === 'message') {
              // Invalidate message queries for the MessageIcon
              queryClient.invalidateQueries({ queryKey: ['/api/messages/unread-count'] });
              queryClient.invalidateQueries({ queryKey: ['/api/messages/unread-conversations'] });
              return;
            }
            
            const safeNotification = {
              ...notification,
              createdAt: notification.createdAt || new Date().toISOString(),
            };
            
            setNotifications(prev => [safeNotification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Invalidate notification queries for layout badge
            queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
            queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });

            if (notification.type === 'new_campaign') {
              queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
            } else if (notification.type === 'new_applicant') {
              queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
            } else if (notification.type === 'application_accepted' || notification.type === 'application_rejected') {
              queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
              queryClient.invalidateQueries({ queryKey: ['/api/applications/active'] });
            }
            
            if (audioRef.current) {
              audioRef.current.play().catch((e: any) => console.log('Audio play failed:', e));
            }
          } else if (data.type === 'campaign:briefing_updated') {
            queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${data.campaignId}`] });
          } else if (data.type === 'deliverable:created') {
            queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${data.campaignId}/applications`] });
            queryClient.invalidateQueries({ queryKey: [`/api/applications/${data.applicationId}/deliverables`] });
          } else if (data.type === 'deliverable:comment_created') {
            queryClient.invalidateQueries({ queryKey: [`/api/deliverables/${data.deliverableId}/comments`] });
          } else if (data.type === 'application:created') {
            queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${data.campaignId}/applications`] });
            queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
          } else if (data.type === 'campaign_invite') {
            queryClient.invalidateQueries({ queryKey: ['/api/invites'] });
            queryClient.invalidateQueries({ queryKey: ['/api/invites/pending'] });
            queryClient.invalidateQueries({ queryKey: ['/api/invites/count'] });
            
            if (audioRef.current) {
              audioRef.current.play().catch((e: any) => console.log('Audio play failed:', e));
            }
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        reconnectTimeout = setTimeout(() => {
          console.log('[WebSocket] Attempting to reconnect...');
          connect();
        }, 5000);
      };
    };
    
    connect();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=20', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        // Filter out campaign_invite and message notifications (messages go to MessageIcon)
        const filteredNotifications = data.filter(
          (n: Notification) => n.type !== 'campaign_invite' && n.type !== 'message'
        );
        setNotifications(filteredNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        credentials: 'include'
      });
      
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        credentials: 'include'
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const inviteNotifications: UnifiedNotification[] = pendingInvites.map(invite => ({
    id: `invite-${invite.id}`,
    type: 'campaign_invite' as NotificationType,
    title: 'Novo convite para campanha!',
    message: `${invite.company?.name || 'Uma empresa'} convidou você para a campanha "${invite.campaign?.title || 'Nova campanha'}"`,
    actionUrl: '/creator/invites',
    isRead: false,
    createdAt: invite.createdAt,
    inviteId: invite.id,
    campaignId: invite.campaignId,
  }));

  const regularNotifications: UnifiedNotification[] = notifications.map(n => ({
    id: `notification-${n.id}`,
    type: n.type as NotificationType,
    title: n.title,
    message: n.message,
    actionUrl: n.actionUrl,
    isRead: n.isRead,
    createdAt: n.createdAt,
  }));

  const allNotifications = [...inviteNotifications, ...regularNotifications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalUnread = unreadCount + pendingInvites.length;

  const handleNotificationClick = (notification: UnifiedNotification) => {
    if (notification.id.startsWith('notification-')) {
      const id = parseInt(notification.id.replace('notification-', ''));
      if (!notification.isRead) {
        markAsRead(id);
      }
    }
    
    if (notification.actionUrl) {
      setLocation(notification.actionUrl);
      setIsOpen(false);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {totalUnread > 0 && (
            <span 
              className={cn(
                "absolute -top-1 -right-1 h-5 w-5 rounded-full text-white text-xs flex items-center justify-center font-semibold",
                pendingInvites.length > 0 
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" 
                  : "bg-red-500"
              )}
              data-testid="text-unread-count"
            >
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96">
        <div className="flex items-center justify-between px-3 py-2">
          <h3 className="font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={markAllAsRead}
              data-testid="button-mark-all-read"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[450px]">
          {allNotifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
              Nenhuma notificação
            </div>
          ) : (
            <div className="py-1">
              {allNotifications.map((notification) => {
                const style = getNotificationStyle(notification.type);
                
                return (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn(
                      "flex items-start p-3 cursor-pointer mx-1 my-1 rounded-lg transition-all",
                      style.bgColor,
                      style.borderColor,
                      !notification.isRead && "ring-1 ring-inset ring-gray-200",
                      style.highlight && "shadow-sm"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className={cn(
                      "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-3",
                      style.iconBg
                    )}>
                      {style.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm leading-tight",
                          !notification.isRead ? "font-semibold" : "font-medium"
                        )}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1.5">
                        {formatDateSafe(notification.createdAt)}
                      </p>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
