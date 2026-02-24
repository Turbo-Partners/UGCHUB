import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  CheckCheck,
  Megaphone,
  UserCheck,
  UserX,
  MessageSquare,
  RefreshCw,
  Upload,
  Mail,
  Heart,
  Star,
  Package,
  Loader2,
  Check,
  ExternalLink,
  Users,
  UserPlus,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import type { Notification } from "@shared/schema";

const notificationIcons: Record<string, React.ReactNode> = {
  new_campaign: <Megaphone className="h-5 w-5 text-blue-500" />,
  application_accepted: <UserCheck className="h-5 w-5 text-green-500" />,
  application_rejected: <UserX className="h-5 w-5 text-red-500" />,
  new_applicant: <UserCheck className="h-5 w-5 text-purple-500" />,
  message: <MessageSquare className="h-5 w-5 text-indigo-500" />,
  workflow_update: <RefreshCw className="h-5 w-5 text-amber-500" />,
  deliverable_uploaded: <Upload className="h-5 w-5 text-cyan-500" />,
  campaign_invite: <Mail className="h-5 w-5 text-pink-500" />,
  favorite_company_campaign: <Heart className="h-5 w-5 text-rose-500" />,
  review_reminder: <Star className="h-5 w-5 text-amber-500" />,
  review_revealed: <Star className="h-5 w-5 text-amber-500 fill-amber-500" />,
  seeding_sent: <Package className="h-5 w-5 text-orange-500" />,
  seeding_received: <Package className="h-5 w-5 text-green-500" />,
  community_join_request: <UserPlus className="h-5 w-5 text-violet-500" />,
  community_member_joined: <Users className="h-5 w-5 text-emerald-500" />,
  deliverable_approved: <ThumbsUp className="h-5 w-5 text-green-500" />,
  deliverable_rejected: <ThumbsDown className="h-5 w-5 text-orange-500" />,
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark as read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/read-all", {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark all as read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-primary/20 rounded-full" />
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="mt-6 text-lg font-medium text-muted-foreground">Carregando notificações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-heading tracking-tight flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            Notificações
          </h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `Você tem ${unreadCount} ${unreadCount === 1 ? "notificação não lida" : "notificações não lidas"}`
              : "Todas as notificações foram lidas"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="gap-2"
            data-testid="button-mark-all-read"
          >
            {markAllAsReadMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <BellOff className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhuma notificação</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Você não tem notificações no momento. Quando houver novidades, elas aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <AnimatePresence>
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                >
                  <div
                    className={`flex items-start gap-4 p-4 transition-colors hover:bg-muted/50 ${
                      !notification.isRead ? "bg-primary/5" : ""
                    }`}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className={`p-2 rounded-full ${!notification.isRead ? "bg-primary/10" : "bg-muted"}`}>
                        {notificationIcons[notification.type] || <Bell className="h-5 w-5 text-muted-foreground" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-sm ${!notification.isRead ? "font-semibold" : "font-medium"}`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsReadMutation.mutate(notification.id)}
                              disabled={markAsReadMutation.isPending}
                              className="h-8 px-2"
                              data-testid={`button-mark-read-${notification.id}`}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {notification.actionUrl && (
                            <Link href={notification.actionUrl}>
                              <Button variant="outline" size="sm" className="h-8 gap-1">
                                Ver
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                    {!notification.isRead && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </div>
                  {index < notifications.length - 1 && <Separator />}
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
