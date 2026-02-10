import { useState, useEffect, useRef } from 'react';
import { Mail, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useMarketplace } from '@/lib/provider';
import { queryClient } from '@/lib/queryClient';
import { formatDistanceToNow, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

interface UnreadConversation {
  applicationId: number;
  campaignId: number;
  campaignTitle: string;
  otherUser: {
    id: number;
    name: string;
    avatar: string | null;
  };
  unreadCount: number;
  lastMessage: {
    content: string;
    createdAt: string;
  };
}

export function MessageIcon() {
  const [_, setLocation] = useLocation();
  const { user } = useMarketplace();
  const [isOpen, setIsOpen] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const isCreator = user?.role === 'creator';

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['/api/messages/unread-count'],
    queryFn: async () => {
      const res = await fetch('/api/messages/unread-count', { credentials: 'include' });
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    refetchInterval: 30000,
    staleTime: 0,
  });

  // WebSocket listener for real-time message updates
  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isMounted = true;
    
    const connect = () => {
      if (!isMounted) return;
      
      // Clear any pending reconnection timeout
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/notifications`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Check for message notification in both formats
          const isMessageNotification = 
            data.type === 'message' ||
            (data.type === 'notification' && data.data?.type === 'message');
          
          if (isMessageNotification) {
            // Invalidate message queries to refresh the count and conversations
            queryClient.invalidateQueries({ queryKey: ['/api/messages/unread-count'] });
            queryClient.invalidateQueries({ queryKey: ['/api/messages/unread-conversations'] });
          }
        } catch (error) {
          console.error('[MessageIcon WebSocket] Error parsing message:', error);
        }
      };

      ws.onclose = () => {
        if (isMounted) {
          reconnectTimeout = setTimeout(() => {
            connect();
          }, 5000);
        }
      };
    };
    
    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const { data: conversations = [] } = useQuery<UnreadConversation[]>({
    queryKey: ['/api/messages/unread-conversations'],
    queryFn: async () => {
      const res = await fetch('/api/messages/unread-conversations', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOpen,
    refetchInterval: isOpen ? 10000 : false,
  });

  const unreadCount = unreadData?.count || 0;

  const handleConversationClick = (conversation: UnreadConversation) => {
    if (isCreator) {
      // Navigate to creator workspace with messages tab
      setLocation(`/campaign/${conversation.campaignId}/workspace?applicationId=${conversation.applicationId}&tab=messages`);
    } else {
      // Navigate to company campaign manage page with conversations tab
      setLocation(`/campaign/${conversation.campaignId}/manage?applicationId=${conversation.applicationId}&tab=conversas`);
    }
    setIsOpen(false);
  };

  const handleViewAllClick = () => {
    if (isCreator) {
      setLocation('/active-campaigns');
    } else {
      setLocation('/dashboard');
    }
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          data-testid="button-messages"
        >
          <MessageSquare className="h-5 w-5" />
          {unreadCount > 0 && (
            <span 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-sky-500 text-white text-xs flex items-center justify-center font-semibold"
              data-testid="text-unread-messages-count"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Mensagens
          </h3>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[350px]">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <Mail className="h-8 w-8 mx-auto mb-2 opacity-40" />
              {unreadCount > 0 
                ? 'Carregando conversas...' 
                : 'Nenhuma mensagem não lida'
              }
            </div>
          ) : (
            <div className="py-1">
              {conversations.map((conversation) => (
                <DropdownMenuItem
                  key={conversation.applicationId}
                  className={cn(
                    "flex items-start p-3 cursor-pointer mx-1 my-1 rounded-lg transition-all",
                    "bg-sky-50 border-l-4 border-l-sky-400",
                    "hover:bg-sky-100"
                  )}
                  onClick={() => handleConversationClick(conversation)}
                  data-testid={`conversation-${conversation.applicationId}`}
                >
                  <Avatar className="h-10 w-10 mr-3 flex-shrink-0">
                    <AvatarImage src={conversation.otherUser.avatar || undefined} />
                    <AvatarFallback className="bg-sky-200 text-sky-700">
                      {conversation.otherUser.name?.slice(0, 2).toUpperCase() || '??'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {conversation.otherUser.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {conversation.campaignTitle}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <span className="flex-shrink-0 h-5 min-w-5 px-1.5 rounded-full bg-sky-500 text-white text-xs flex items-center justify-center font-semibold">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {conversation.lastMessage.content}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {formatDateSafe(conversation.lastMessage.createdAt)}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>

        <DropdownMenuSeparator />
        
        <div className="p-2">
          <Button 
            variant="ghost" 
            className="w-full text-sm"
            onClick={handleViewAllClick}
            data-testid="button-view-all-messages"
          >
            Ver todas as mensagens
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
