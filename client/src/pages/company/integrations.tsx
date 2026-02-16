import { useState, useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, Trash2, Copy, RefreshCw, Settings, Link2, ChevronDown,
  ShoppingBag, Store, BarChart3, Search, TrendingUp, Instagram,
  FileSpreadsheet, Package, Lock, CheckCircle2, AlertCircle,
  Activity, FileText, Clock, MessageSquare, Loader2, Megaphone,
  Eye, Heart, MessageCircle, ExternalLink, Zap, DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { EcommerceIntegration } from "@shared/schema";
import { useTikTokAccount, useDisconnectTikTok, useSyncTikTok } from "@/hooks/use-tiktok";

import blingIcon from "@/assets/integrations/bling.png";
import nuvemshopIcon from "@/assets/integrations/nuvemshop.png";
import olistIcon from "@/assets/integrations/olist.png";
import omieIcon from "@/assets/integrations/omie.png";
import shopifyIcon from "@/assets/integrations/shopify.png";
import yampiIcon from "@/assets/integrations/yampi.png";

type PlatformCategory = "social_ads" | "sales_billing";

interface PlatformDefinition {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  color: string;
  bgColor: string;
  category: PlatformCategory;
  status: "available" | "connected";
  webhookPath?: string;
  implemented: boolean;
}

const MetaIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
  </svg>
);

const ShopifyIcon = () => (
  <img src={shopifyIcon} alt="Shopify" className="w-5 h-5 object-contain" />
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.802c-2.67 0-2.986.01-4.04.059-.976.045-1.505.207-1.858.344-.466.182-.8.398-1.15.748-.35.35-.566.684-.748 1.15-.137.353-.3.882-.344 1.857-.048 1.055-.058 1.37-.058 4.041 0 2.67.01 2.986.058 4.04.045.976.207 1.505.344 1.858.182.466.399.8.748 1.15.35.35.684.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058 2.67 0 2.987-.01 4.04-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.684.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041 0-2.67-.01-2.986-.058-4.04-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 0 0-.748-1.15 3.098 3.098 0 0 0-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.055-.048-1.37-.058-4.041-.058zm0 3.063a5.135 5.135 0 1 1 0 10.27 5.135 5.135 0 0 1 0-10.27zm0 8.468a3.333 3.333 0 1 0 0-6.666 3.333 3.333 0 0 0 0 6.666zm6.538-8.671a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z"/>
  </svg>
);

const GoogleAnalyticsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M22.84 2.998c-.648-.636-1.63-.765-2.422-.323l-.23.13c-.79.45-1.282 1.29-1.282 2.195v14c0 .905.492 1.745 1.282 2.195l.23.13c.792.442 1.774.313 2.422-.323.478-.47.74-1.108.74-1.772V4.77c0-.664-.262-1.302-.74-1.772zM14 9.77c-.648-.636-1.63-.765-2.422-.323l-.23.13c-.79.45-1.282 1.29-1.282 2.195v7.228c0 .905.492 1.745 1.282 2.195l.23.13c.792.442 1.774.313 2.422-.323.478-.47.74-1.108.74-1.772V11.77c-.001-.664-.263-1.302-.74-1.772V9.77zM5.16 16.998c-.648-.636-1.63-.765-2.422-.323l-.23.13c-.79.45-1.282 1.29-1.282 2.195v0c0 .905.492 1.745 1.282 2.195l.23.13c.792.442 1.774.313 2.422-.323.478-.47.74-1.108.74-1.772v0c0-.664-.262-1.302-.74-1.772v-.46z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const GoogleAdsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12.006 17.17l-5.7 3.29c-.317.183-.717.074-.894-.243L2.06 14.57a.663.663 0 0 1 .243-.906l5.713-3.3 3.99 6.806zm7.59-4.37L16.26 7.01l-3.37 1.94 3.34 5.79 3.366-1.94zm2.36 4.05l-3.35-5.8-3.36 1.94 3.35 5.8c.36.62 1.16.83 1.78.47l1.11-.64c.62-.36.83-1.16.47-1.78v.01zM8.354 6.104L5.01 8.034l3.99 6.88 3.34-1.93-3.986-6.88z"/>
  </svg>
);

const BlingIcon = () => (
  <img src={blingIcon} alt="Bling" className="w-5 h-5 object-contain rounded" />
);

const TinyIcon = () => (
  <img src={olistIcon} alt="Olist/Tiny" className="w-5 h-5 object-contain rounded" />
);

const WooCommerceIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M2.227 4.857A2.228 2.228 0 0 0 0 7.094v7.457c0 1.236 1.001 2.237 2.237 2.237h3.09l-.705 3.36 4.403-3.36h12.748A2.227 2.227 0 0 0 24 14.551V7.094a2.228 2.228 0 0 0-2.227-2.237H2.227zm.451 1.063h18.644c.65 0 1.174.534 1.174 1.184v7.437c0 .65-.524 1.174-1.174 1.174H8.703l-2.784 2.128.446-2.128H2.678a1.177 1.177 0 0 1-1.174-1.174V7.104c0-.65.524-1.184 1.174-1.184zm2.07 1.846c-.41.02-.775.181-1.023.492-.249.31-.351.728-.351 1.174v2.64c0 .393.082.757.289 1.063.207.31.506.523.883.6.371.083.758.01 1.094-.186.33-.196.588-.495.712-.865l.587-1.743.588 1.743c.124.37.382.669.712.865.336.196.723.269 1.094.186.377-.077.676-.29.883-.6.207-.306.289-.67.289-1.063v-2.64c0-.446-.103-.864-.351-1.174-.248-.31-.613-.472-1.023-.492-.41-.021-.82.103-1.094.35-.279.248-.464.6-.537.99l-.37 1.939-.371-1.938c-.073-.392-.258-.743-.537-.991-.274-.248-.684-.371-1.094-.351l-.381.001zm11.455 0c-.206.01-.392.072-.557.186-.165.114-.289.269-.372.454l-1.063 2.526-1.063-2.526a1.033 1.033 0 0 0-.372-.454 1.016 1.016 0 0 0-.557-.186c-.186-.01-.371.042-.536.145-.165.103-.289.248-.372.413a1.53 1.53 0 0 0-.145.578v3.132c0 .165.031.32.093.464.062.145.155.27.269.372.113.103.247.175.392.217.145.041.3.041.454.01.145-.031.279-.093.392-.186a.95.95 0 0 0 .269-.32c.062-.124.093-.27.093-.423v-1.289l.557 1.33c.072.165.175.31.31.423.134.114.289.186.464.217.165.031.34.01.495-.062.155-.072.289-.186.382-.33l.557-1.33v1.042c0 .155.031.31.093.454.062.145.155.27.269.371.113.104.247.176.392.218.145.041.3.041.454.01.145-.031.279-.093.392-.186a.95.95 0 0 0 .269-.32c.062-.124.093-.269.093-.423V9.523c0-.206-.052-.402-.145-.578a1.033 1.033 0 0 0-.372-.413 1.016 1.016 0 0 0-.536-.145h-.019z" fill="#9B5C8F"/>
  </svg>
);

const YampiIcon = () => (
  <img src={yampiIcon} alt="Yampi" className="w-5 h-5 object-contain rounded" />
);

const NuvemshopIcon = () => (
  <img src={nuvemshopIcon} alt="Nuvemshop" className="w-5 h-5 object-contain rounded" />
);

const OmieIcon = () => (
  <img src={omieIcon} alt="Omie" className="w-5 h-5 object-contain rounded" />
);

const platformDefinitions: PlatformDefinition[] = [
  // Social e Anúncios
  {
    id: "instagram_business",
    name: "Instagram Business",
    description: "Conecte sua conta profissional",
    icon: <InstagramIcon />,
    color: "text-pink-600",
    bgColor: "bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10",
    category: "social_ads",
    status: "available",
    implemented: true,
  },
  {
    id: "meta_business",
    name: "Meta Business",
    description: "Facebook & Instagram Ads Manager",
    icon: <MetaIcon />,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    category: "social_ads",
    status: "available",
    implemented: true,
  },
  {
    id: "tiktok_ads",
    name: "TikTok",
    description: "Métricas e dados do TikTok",
    icon: <TikTokIcon />,
    color: "text-gray-900 dark:text-white",
    bgColor: "bg-gray-500/10",
    category: "social_ads",
    status: "available",
    implemented: true,
  },
  {
    id: "youtube",
    name: "YouTube",
    description: "Canal e métricas do YouTube",
    icon: <YouTubeIcon />,
    color: "text-red-600",
    bgColor: "bg-red-500/10",
    category: "social_ads",
    status: "available",
    implemented: false,
  },
  {
    id: "google_analytics",
    name: "Google Analytics (GA4)",
    description: "Métricas de tráfego e conversões",
    icon: <GoogleAnalyticsIcon />,
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
    category: "social_ads",
    status: "available",
    implemented: false,
  },
  // Vendas e Faturamento
  {
    id: "shopify",
    name: "Shopify",
    description: "Sincronize vendas e comissões automaticamente",
    icon: <ShopifyIcon />,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    category: "sales_billing",
    status: "available",
    webhookPath: "/api/webhooks/shopify/",
    implemented: false,
  },
  {
    id: "tiny",
    name: "Olist/Tiny ERP",
    description: "Sistema de gestão empresarial",
    icon: <TinyIcon />,
    color: "text-teal-600",
    bgColor: "bg-teal-500/10",
    category: "sales_billing",
    status: "available",
    implemented: false,
  },
  {
    id: "bling",
    name: "Bling",
    description: "ERP para e-commerce",
    icon: <BlingIcon />,
    color: "text-violet-600",
    bgColor: "bg-violet-500/10",
    category: "sales_billing",
    status: "available",
    implemented: false,
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    description: "Integração com lojas WordPress",
    icon: <WooCommerceIcon />,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
    category: "sales_billing",
    status: "available",
    webhookPath: "/api/webhooks/woocommerce/",
    implemented: false,
  },
  {
    id: "yampi",
    name: "Yampi",
    description: "Conecte Yampi para sincronizar métricas",
    icon: <YampiIcon />,
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
    category: "sales_billing",
    status: "available",
    implemented: false,
  },
  {
    id: "nuvemshop",
    name: "Nuvemshop",
    description: "Integração com Nuvemshop/Tiendanube",
    icon: <NuvemshopIcon />,
    color: "text-indigo-600",
    bgColor: "bg-indigo-500/10",
    category: "sales_billing",
    status: "available",
    implemented: false,
  },
  {
    id: "omie",
    name: "Omie",
    description: "Sistema de gestão Omie",
    icon: <OmieIcon />,
    color: "text-cyan-600",
    bgColor: "bg-cyan-500/10",
    category: "sales_billing",
    status: "available",
    implemented: false,
  },
];

const categoryLabels: Record<PlatformCategory, string> = {
  social_ads: "Social e Anúncios",
  sales_billing: "Vendas e Faturamento",
};

const categoryIcons: Record<PlatformCategory, ReactNode> = {
  social_ads: <Instagram className="w-4 h-4" />,
  sales_billing: <ShoppingBag className="w-4 h-4" />,
};

interface ConnectedPlatform {
  id: number;
  platformId: string;
  name: string;
  status: "connected" | "error" | "syncing";
  lastSync?: Date;
  shopUrl?: string;
  webhookSecret?: string;
}

export function IntegrationsFullContent({ embedded = false }: { embedded?: boolean } = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("connections");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformDefinition | null>(null);
  const [newShopUrl, setNewShopUrl] = useState("");
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showMetaAccountSelector, setShowMetaAccountSelector] = useState(false);
  const [selectedAdAccountId, setSelectedAdAccountId] = useState<string | null>(null);
  const [metaSearchQuery, setMetaSearchQuery] = useState("");

  // Check URL params for account selection trigger
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("show_account_selection") === "true" && params.get("meta_connected") === "true") {
      setShowMetaAccountSelector(true);
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [location]);

  const { data: integrations, isLoading } = useQuery<EcommerceIntegration[]>({
    queryKey: ["/api/ecommerce-integrations"],
    queryFn: async () => {
      const res = await fetch("/api/ecommerce-integrations", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch integrations");
      return res.json();
    },
  });

  const { data: instagramAccount } = useQuery<{ connected: boolean; account?: { username: string; profilePictureUrl?: string; followersCount?: number } }>({
    queryKey: ["/api/instagram/account"],
    queryFn: async () => {
      const res = await fetch("/api/instagram/account", { credentials: "include" });
      if (!res.ok) return { connected: false };
      return res.json();
    },
  });

  const { data: metaAccount } = useQuery<{ 
    connected: boolean; 
    account?: { 
      id: number;
      metaUserName: string; 
      metaUserEmail?: string;
      selectedAdAccountId?: string | null;
      selectedAdAccountName?: string | null;
    };
    businessManagers?: Array<{ id: number; businessId: string; businessName: string }>;
    adAccounts?: Array<{ id: number; adAccountId: string; adAccountName: string; currency?: string; isSelected?: boolean }>;
  }>({
    queryKey: ["/api/meta/account"],
    queryFn: async () => {
      const res = await fetch("/api/meta/account", { credentials: "include" });
      if (!res.ok) return { connected: false };
      return res.json();
    },
  });

  // Initialize selected ad account from existing selection
  useEffect(() => {
    if (metaAccount?.account?.selectedAdAccountId && !selectedAdAccountId) {
      setSelectedAdAccountId(metaAccount.account.selectedAdAccountId);
    }
  }, [metaAccount?.account?.selectedAdAccountId]);

  const { data: integrationLogs, refetch: refetchLogs } = useQuery<{ logs: Array<{
    id: number;
    platform: string;
    action: string;
    status: string;
    endpoint: string | null;
    details: any;
    errorMessage: string | null;
    createdAt: string;
  }> }>({
    queryKey: ["/api/integration-logs"],
    queryFn: async () => {
      const res = await fetch("/api/integration-logs", { credentials: "include" });
      if (!res.ok) return { logs: [] };
      return res.json();
    },
  });

  // Partnership Ads query
  const { data: partnershipAdsData, isLoading: isLoadingAds, refetch: refetchAds } = useQuery<{
    partnershipAds: any[];
    allAds: any[];
    campaigns: any[];
    adAccountId: string;
    adAccountName: string;
  }>({
    queryKey: ["/api/meta-marketing/partnership-ads"],
    queryFn: async () => {
      const res = await fetch("/api/meta-marketing/partnership-ads", { credentials: "include" });
      if (!res.ok) return { partnershipAds: [], allAds: [], campaigns: [], adAccountId: "", adAccountName: "" };
      return res.json();
    },
    enabled: !!metaAccount?.connected,
  });

  // Creator posts for boosting query
  const { data: creatorPostsData, isLoading: isLoadingPosts } = useQuery<{
    posts: Array<{
      id: number;
      postId: string;
      mediaType: string;
      caption: string | null;
      permalink: string;
      mediaUrl: string | null;
      creatorUsername: string;
      likes: number;
      comments: number;
      impressions: number | null;
      reach: number | null;
      engagement: number | null;
      emv: number | null;
      sentiment: string | null;
      sentimentScore: number | null;
      timestamp: string | null;
      canBoost: boolean;
    }>;
  }>({
    queryKey: ["/api/meta-marketing/creator-posts"],
    queryFn: async () => {
      const res = await fetch("/api/meta-marketing/creator-posts", { credentials: "include" });
      if (!res.ok) return { posts: [] };
      return res.json();
    },
    enabled: !!instagramAccount?.connected,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { platform: string; shopUrl: string }) => {
      const res = await fetch("/api/ecommerce-integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao criar integração");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecommerce-integrations"] });
      setIsAddingNew(false);
      setSelectedPlatform(null);
      setNewShopUrl("");
      toast({ title: "Integração criada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar integração", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/ecommerce-integrations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao excluir integração");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecommerce-integrations"] });
      toast({ title: "Integração removida" });
    },
  });

  // TikTok OAuth
  const { connected: tiktokConnected, account: tiktokAccount } = useTikTokAccount();
  const tiktokDisconnectMutation = useDisconnectTikTok();
  const tiktokSyncMutation = useSyncTikTok();

  const [isSyncingInstagram, setIsSyncingInstagram] = useState(false);
  const [isSyncingMeta, setIsSyncingMeta] = useState(false);

  const handleSyncInstagram = async (retryCount = 0): Promise<void> => {
    setIsSyncingInstagram(true);
    try {
      const res = await fetch("/api/instagram/company/sync", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      
      if (res.ok) {
        // Check if response is from cache due to API instability
        if (data.isFromCache) {
          toast({ 
            title: "Mostrando dados salvos", 
            description: data.warning || "A API do Instagram está instável. Os dados mostrados são da última sincronização bem sucedida.",
            duration: 8000
          });
        } else {
          const successCount = data.results?.filter((r: any) => r.status === "success").length || 0;
          const errorCount = data.results?.filter((r: any) => r.status === "error").length || 0;
          
          if (errorCount > 0 && successCount === 0) {
            toast({ 
              title: "Erro na sincronização", 
              description: "Todas as chamadas falharam. Verifique a aba de Logs para detalhes.",
              variant: "destructive"
            });
          } else {
            toast({ 
              title: "Instagram sincronizado!", 
              description: `${successCount} chamadas bem sucedidas${errorCount > 0 ? `, ${errorCount} com erro` : ""}` 
            });
          }
        }
        queryClient.invalidateQueries({ queryKey: ["/api/instagram/account"] });
        queryClient.invalidateQueries({ queryKey: ["/api/integration-logs"] });
      } else {
        // Check for token expired or refresh failed errors
        if (data.needsReconnect || data.code === "TOKEN_EXPIRED" || data.code === "TOKEN_REFRESH_FAILED") {
          toast({ 
            title: data.code === "TOKEN_REFRESH_FAILED" ? "Renovação falhou" : "Token expirado", 
            description: data.error || "Sua conexão com o Instagram expirou. Clique em 'Desconectar' e reconecte sua conta.",
            variant: "destructive",
            duration: 10000
          });
        } else if (data.code === "TRANSIENT_ERROR" && data.isRetryable && retryCount < 2) {
          toast({ 
            title: "API temporariamente instável", 
            description: `Tentando novamente em ${(retryCount + 1) * 3} segundos...`,
          });
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 3000));
          return handleSyncInstagram(retryCount + 1);
        } else if (data.code === "TRANSIENT_ERROR") {
          toast({ 
            title: "API do Instagram indisponível", 
            description: "A API do Instagram está temporariamente instável. Por favor, tente novamente em alguns minutos.",
            variant: "destructive",
            duration: 8000
          });
        } else if (data.code === "API_ERROR") {
          toast({ 
            title: "Erro na API do Instagram", 
            description: data.error,
            variant: "destructive"
          });
        } else {
          toast({ title: "Erro ao sincronizar", description: data.error, variant: "destructive" });
        }
        queryClient.invalidateQueries({ queryKey: ["/api/integration-logs"] });
      }
    } catch (error) {
      toast({ title: "Erro ao sincronizar Instagram", variant: "destructive" });
    } finally {
      setIsSyncingInstagram(false);
    }
  };

  const handleSelectMetaAdAccount = async (adAccountId: string) => {
    try {
      const res = await fetch("/api/meta/select-ad-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ adAccountId }),
      });
      const data = await res.json();
      
      if (res.ok) {
        toast({ 
          title: "Conta selecionada!", 
          description: "A conta de anúncios foi selecionada com sucesso." 
        });
        queryClient.invalidateQueries({ queryKey: ["/api/meta/account"] });
        setShowMetaAccountSelector(false);
      } else {
        toast({ title: "Erro ao selecionar conta", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro ao selecionar conta", variant: "destructive" });
    }
  };

  const handleSyncMeta = async () => {
    setIsSyncingMeta(true);
    try {
      const res = await fetch("/api/meta-marketing/sync", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      
      if (res.ok) {
        const successCount = data.results?.filter((r: any) => r.status === "success").length || 0;
        const errorCount = data.results?.filter((r: any) => r.status === "error").length || 0;
        
        toast({ 
          title: "Meta Business sincronizado!", 
          description: `${successCount} chamadas bem sucedidas${errorCount > 0 ? `, ${errorCount} com erro` : ""}` 
        });
        queryClient.invalidateQueries({ queryKey: ["/api/meta/account"] });
        queryClient.invalidateQueries({ queryKey: ["/api/integration-logs"] });
      } else {
        toast({ title: "Erro ao sincronizar", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro ao sincronizar Meta", variant: "destructive" });
    } finally {
      setIsSyncingMeta(false);
    }
  };

  const handleSyncAll = async () => {
    const promises = [];
    
    if (instagramAccount?.connected) {
      promises.push(handleSyncInstagram());
    }
    if (metaAccount?.connected) {
      promises.push(handleSyncMeta());
    }
    
    if (promises.length === 0) {
      toast({ title: "Nenhuma integração para sincronizar", description: "Conecte uma plataforma primeiro." });
      return;
    }
    
    toast({ title: "Sincronização iniciada", description: "Atualizando dados de todas as integrações..." });
    
    await Promise.all(promises);
    queryClient.invalidateQueries({ queryKey: ["/api/ecommerce-integrations"] });
    queryClient.invalidateQueries({ queryKey: ["/api/instagram/account"] });
    queryClient.invalidateQueries({ queryKey: ["/api/meta/account"] });
  };

  const handleConnectPlatform = async (platform: PlatformDefinition) => {
    if (!platform.implemented) {
      toast({ 
        title: "Integração em desenvolvimento", 
        description: `A integração com ${platform.name} estará disponível em breve.`,
        variant: "default" 
      });
      return;
    }
    if (platform.id === "instagram_business") {
      window.location.href = "/api/auth/instagram/start?type=business";
      return;
    }
    if (platform.id === "meta_business") {
      try {
        const res = await fetch("/api/meta/auth/url", { credentials: "include" });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          toast({ title: "Erro", description: data.error || "Não foi possível iniciar OAuth", variant: "destructive" });
        }
      } catch (err) {
        toast({ title: "Erro", description: "Falha ao conectar com Meta", variant: "destructive" });
      }
      return;
    }
    if (platform.id === "tiktok_ads") {
      window.location.href = "/api/tiktok/oauth/authorize?returnTo=/company/integrations";
      return;
    }
    setSelectedPlatform(platform);
    setIsAddingNew(true);
  };

  const handleDisconnectInstagram = async () => {
    setIsDisconnecting(true);
    try {
      const res = await fetch("/api/instagram/account", {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast({ title: "Instagram desconectado com sucesso" });
        queryClient.invalidateQueries({ queryKey: ["/api/instagram/account"] });
      } else {
        const data = await res.json();
        toast({ title: "Erro ao desconectar", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro ao desconectar Instagram", variant: "destructive" });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleDisconnectMeta = async () => {
    setIsDisconnecting(true);
    try {
      const res = await fetch("/api/meta/disconnect", {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast({ title: "Meta Ads desconectado com sucesso" });
        queryClient.invalidateQueries({ queryKey: ["/api/meta/account"] });
      } else {
        const data = await res.json();
        toast({ title: "Erro ao desconectar", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro ao desconectar Meta", variant: "destructive" });
    } finally {
      setIsDisconnecting(false);
    }
  };


  const handleSubmit = () => {
    if (!selectedPlatform) return;
    if (["shopify", "woocommerce", "yampi", "nuvemshop"].includes(selectedPlatform.id) && !newShopUrl.trim()) {
      toast({ title: "URL da loja é obrigatória", variant: "destructive" });
      return;
    }
    createMutation.mutate({ platform: selectedPlatform.id, shopUrl: newShopUrl.trim() || selectedPlatform.id });
  };

  const copyWebhookUrl = (integration: EcommerceIntegration) => {
    const platform = platformDefinitions.find(p => p.id === integration.platform);
    if (!platform?.webhookPath) return;
    const baseUrl = window.location.origin;
    const webhookUrl = `${baseUrl}${platform.webhookPath}${encodeURIComponent(integration.shopUrl || '')}`;
    navigator.clipboard.writeText(webhookUrl);
    toast({ title: "URL do webhook copiada!" });
  };

  const connectedPlatformIds: string[] = [
    ...(integrations?.map(i => i.platform) || []),
    ...(instagramAccount?.connected ? ["instagram_business"] : []),
    ...(metaAccount?.connected ? ["meta_business"] : []),
    ...(tiktokConnected ? ["tiktok_ads"] : []),
  ];

  const socialAdsPlatforms = platformDefinitions.filter(p => p.category === "social_ads");
  const salesBillingPlatforms = platformDefinitions.filter(p => p.category === "sales_billing");
  
  const connectedPlatforms = platformDefinitions.filter(p => connectedPlatformIds.includes(p.id));
  const availablePlatforms = platformDefinitions.filter(p => !connectedPlatformIds.includes(p.id));

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  const content = (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="connections" className="flex items-center gap-2" data-testid="tab-connections">
            <Link2 className="h-4 w-4" />
            Conexões
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2" data-testid="tab-health">
            <Activity className="h-4 w-4" />
            Saúde
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2" data-testid="tab-logs">
            <FileText className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-6">
          {/* Botão de sincronizar tudo */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              data-testid="button-sync-all"
              disabled={isSyncingInstagram || isSyncingMeta}
              onClick={handleSyncAll}
            >
              <RefreshCw className={`h-4 w-4 ${(isSyncingInstagram || isSyncingMeta) ? 'animate-spin' : ''}`} />
              Sincronizar Tudo
            </Button>
          </div>

          <Dialog open={isAddingNew} onOpenChange={(open) => { setIsAddingNew(open); if (!open) setSelectedPlatform(null); }}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedPlatform ? `Conectar ${selectedPlatform.name}` : "Adicionar Conexão"}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedPlatform 
                        ? `Configure sua integração com ${selectedPlatform.name}`
                        : "Selecione uma plataforma para conectar"
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  {!selectedPlatform ? (
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {availablePlatforms.filter(p => p.implemented).slice(0, 8).map((platform) => (
                        <button
                          key={platform.id}
                          onClick={() => setSelectedPlatform(platform)}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary hover:bg-accent transition-colors text-left"
                          data-testid={`button-select-${platform.id}`}
                        >
                          <div className={`p-2 rounded-lg ${platform.bgColor} ${platform.color}`}>
                            {platform.icon}
                          </div>
                          <span className="font-medium text-sm">{platform.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4 mt-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                        <div className={`p-2 rounded-lg ${selectedPlatform.bgColor} ${selectedPlatform.color}`}>
                          {selectedPlatform.icon}
                        </div>
                        <div>
                          <p className="font-medium">{selectedPlatform.name}</p>
                          <p className="text-xs text-muted-foreground">{selectedPlatform.description}</p>
                        </div>
                      </div>

                      {["shopify", "woocommerce", "yampi", "nuvemshop"].includes(selectedPlatform.id) && (
                        <div className="space-y-2">
                          <Label>URL da Loja</Label>
                          <Input
                            placeholder={selectedPlatform.id === "shopify" ? "minha-loja.myshopify.com" : "www.minhaloja.com.br"}
                            value={newShopUrl}
                            onChange={(e) => setNewShopUrl(e.target.value)}
                            data-testid="input-shop-url"
                          />
                          <p className="text-xs text-muted-foreground">
                            Use a URL completa ou identificador único da sua loja
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setSelectedPlatform(null)} className="flex-1">
                          Voltar
                        </Button>
                        <Button 
                          onClick={handleSubmit} 
                          className="flex-1"
                          disabled={createMutation.isPending}
                          data-testid="button-save-integration"
                        >
                          {createMutation.isPending ? "Conectando..." : "Conectar"}
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>


          {/* Seção de integrações de e-commerce conectadas */}
          {integrations && integrations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">E-commerce Conectado</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {integrations.map((integration) => {
                  const platform = platformDefinitions.find(p => p.id === integration.platform);
                  if (!platform) return null;

                  return (
                    <Card 
                      key={integration.id} 
                      className="border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20"
                      data-testid={`card-connected-${integration.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg ${platform.bgColor} ${platform.color}`}>
                              {platform.icon}
                            </div>
                            <div>
                              <p className="font-medium flex items-center gap-2">
                                {platform.name}
                                <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                                  Conectado
                                </Badge>
                              </p>
                              <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {integration.shopUrl}
                              </p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`dropdown-${integration.id}`}>
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => copyWebhookUrl(integration)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copiar Webhook URL
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Settings className="h-4 w-4 mr-2" />
                                Configurações
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => deleteMutation.mutate(integration.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Desconectar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          <span>Sincronizando automaticamente</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {categoryIcons.social_ads}
              <h3 className="text-sm font-semibold">{categoryLabels.social_ads}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {socialAdsPlatforms.map((platform) => {
                const isConnected = connectedPlatformIds.includes(platform.id);
                const isInstagramConnected = platform.id === "instagram_business" && isConnected;
                const isMetaConnected = platform.id === "meta_business" && isConnected;
                const isTikTokConnected = platform.id === "tiktok_ads" && isConnected;
                const isLocked = !platform.implemented && !isConnected;
                return (
                  <Card 
                    key={platform.id} 
                    className={`relative ${isConnected 
                      ? "border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20"
                      : isLocked 
                        ? "opacity-70 cursor-not-allowed"
                        : "hover:border-primary/50 transition-colors"
                    }`}
                    data-testid={`card-${platform.id}`}
                  >
                    {isLocked && (
                      <div className="absolute top-2 right-2 z-10" title="Em breve">
                        <div className="p-1.5 rounded-full bg-muted">
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-lg ${platform.bgColor} ${platform.color} ${isLocked ? 'grayscale' : ''}`}>
                          {platform.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium flex items-center gap-2">
                            {platform.name}
                            {isConnected && (
                              <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                                Conectado
                              </Badge>
                            )}
                            {isLocked && (
                              <Badge variant="secondary" className="text-xs">
                                Em breve
                              </Badge>
                            )}
                          </p>
                          {isInstagramConnected && instagramAccount?.account && (
                            <p className="text-xs text-muted-foreground mt-2">
                              @{instagramAccount.account.username}
                            </p>
                          )}
                          {isMetaConnected && metaAccount?.account && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {metaAccount.account.metaUserName}
                            </p>
                          )}
                          {isTikTokConnected && tiktokAccount && (
                            <p className="text-xs text-muted-foreground mt-2">
                              @{tiktokAccount.uniqueId}
                            </p>
                          )}
                        </div>
                      </div>
                      {!isConnected && !isLocked && (
                        <div className="mt-4 space-y-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleConnectPlatform(platform)}
                            data-testid={`button-connect-${platform.id}`}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Conectar {platform.name}
                          </Button>
                        </div>
                      )}
                      {isInstagramConnected && (
                        <div className="mt-4 space-y-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleSyncInstagram()}
                            disabled={isSyncingInstagram}
                            data-testid="button-sync-instagram"
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncingInstagram ? 'animate-spin' : ''}`} />
                            {isSyncingInstagram ? "Sincronizando..." : "Sincronizar"}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={handleDisconnectInstagram}
                            disabled={isDisconnecting}
                            data-testid="button-disconnect-instagram"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {isDisconnecting ? "Desconectando..." : "Desconectar"}
                          </Button>
                        </div>
                      )}
                      {isMetaConnected && (
                        <div className="mt-4 space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={handleSyncMeta}
                            disabled={isSyncingMeta}
                            data-testid="button-sync-meta"
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncingMeta ? 'animate-spin' : ''}`} />
                            {isSyncingMeta ? "Sincronizando..." : "Sincronizar"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={handleDisconnectMeta}
                            disabled={isDisconnecting}
                            data-testid="button-disconnect-meta"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {isDisconnecting ? "Desconectando..." : "Desconectar"}
                          </Button>
                        </div>
                      )}
                      {isTikTokConnected && (
                        <div className="mt-4 space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => tiktokSyncMutation.mutate()}
                            disabled={tiktokSyncMutation.isPending}
                            data-testid="button-sync-tiktok"
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${tiktokSyncMutation.isPending ? 'animate-spin' : ''}`} />
                            {tiktokSyncMutation.isPending ? "Sincronizando..." : "Sincronizar"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => tiktokDisconnectMutation.mutate()}
                            disabled={tiktokDisconnectMutation.isPending}
                            data-testid="button-disconnect-tiktok"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {tiktokDisconnectMutation.isPending ? "Desconectando..." : "Desconectar"}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {categoryIcons.sales_billing}
              <h3 className="text-sm font-semibold">{categoryLabels.sales_billing}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {salesBillingPlatforms.map((platform) => {
                const isConnected = connectedPlatformIds.includes(platform.id);
                const isLocked = !platform.implemented && !isConnected;
                return (
                  <Card 
                    key={platform.id} 
                    className={`relative ${isConnected 
                      ? "border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20"
                      : isLocked 
                        ? "opacity-70 cursor-not-allowed"
                        : "hover:border-primary/50 transition-colors"
                    }`}
                    data-testid={`card-${platform.id}`}
                  >
                    {isLocked && (
                      <div className="absolute top-2 right-2 z-10" title="Em breve">
                        <div className="p-1.5 rounded-full bg-muted">
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-lg ${platform.bgColor} ${platform.color} ${isLocked ? 'grayscale' : ''}`}>
                          {platform.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium flex items-center gap-2">
                            {platform.name}
                            {isConnected && (
                              <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                                Conectado
                              </Badge>
                            )}
                            {isLocked && (
                              <Badge variant="secondary" className="text-xs">
                                Em breve
                              </Badge>
                            )}
                          </p>
                        </div>
                      </div>
                      {!isConnected && !isLocked && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-4"
                          onClick={() => handleConnectPlatform(platform)}
                          data-testid={`button-connect-${platform.id}`}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Conectar {platform.name}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Saúde das Integrações
              </CardTitle>
              <CardDescription>
                Monitore o status e a qualidade dos dados sincronizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(instagramAccount?.connected || metaAccount?.connected || (integrations && integrations.length > 0)) ? (
                <div className="space-y-4">
                  {instagramAccount?.connected && (() => {
                    const instagramLogs = integrationLogs?.logs?.filter(l => l.platform === "instagram") || [];
                    const lastSync = instagramLogs[0];
                    const recentLogs = instagramLogs.slice(0, 5);
                    const successCount = recentLogs.filter(l => l.status === "success").length;
                    const errorCount = recentLogs.filter(l => l.status === "error").length;
                    
                    return (
                      <div className="p-4 rounded-lg border space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 text-pink-600">
                              <InstagramIcon />
                            </div>
                            <div>
                              <p className="font-medium">Instagram Business</p>
                              <p className="text-sm text-muted-foreground">@{instagramAccount.account?.username}</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSyncInstagram()}
                            disabled={isSyncingInstagram}
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncingInstagram ? 'animate-spin' : ''}`} />
                            {isSyncingInstagram ? "Sincronizando..." : "Sincronizar"}
                          </Button>
                        </div>
                        
                        {lastSync ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground">Última Sync</p>
                              <p className="font-medium text-sm">
                                {format(new Date(lastSync.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground">Seguidores</p>
                              <p className="font-medium text-sm">
                                {instagramAccount.account?.followersCount?.toLocaleString() || "—"}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-green-500/10">
                              <p className="text-xs text-muted-foreground">Endpoints OK</p>
                              <p className="font-medium text-sm text-green-600">{successCount}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-red-500/10">
                              <p className="text-xs text-muted-foreground">Endpoints com Erro</p>
                              <p className="font-medium text-sm text-red-600">{errorCount}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <p className="text-sm text-amber-700">Nenhuma sincronização realizada ainda. Clique em "Sincronizar" para buscar dados.</p>
                          </div>
                        )}
                        
                        {recentLogs.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase">Endpoints Sincronizados</p>
                            <div className="flex flex-wrap gap-2">
                              {recentLogs.map((log, i) => (
                                <Badge 
                                  key={i} 
                                  variant={log.status === "success" ? "default" : log.status === "error" ? "destructive" : "secondary"}
                                  className="text-xs"
                                >
                                  {log.endpoint || log.action}
                                  {log.status === "success" && <CheckCircle2 className="h-3 w-3 ml-1" />}
                                  {log.status === "error" && <AlertCircle className="h-3 w-3 ml-1" />}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {metaAccount?.connected && (() => {
                    const metaLogs = integrationLogs?.logs?.filter(l => l.platform === "meta") || [];
                    const lastSync = metaLogs[0];
                    const recentLogs = metaLogs.slice(0, 5);
                    const successCount = recentLogs.filter(l => l.status === "success").length;
                    const errorCount = recentLogs.filter(l => l.status === "error").length;
                    
                    return (
                      <div className="p-4 rounded-lg border space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                              <MetaIcon />
                            </div>
                            <div>
                              <p className="font-medium">Meta Business</p>
                              <p className="text-sm text-muted-foreground">{metaAccount.account?.metaUserName}</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleSyncMeta}
                            disabled={isSyncingMeta}
                            data-testid="button-sync-meta-health"
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncingMeta ? 'animate-spin' : ''}`} />
                            {isSyncingMeta ? "Sincronizando..." : "Sincronizar"}
                          </Button>
                        </div>
                        
                        {lastSync ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground">Última Sync</p>
                              <p className="font-medium text-sm">
                                {format(new Date(lastSync.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground">Conta Selecionada</p>
                              <p className="font-medium text-sm truncate">
                                {metaAccount.account?.selectedAdAccountName || "—"}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-green-500/10">
                              <p className="text-xs text-muted-foreground">Endpoints OK</p>
                              <p className="font-medium text-sm text-green-600">{successCount}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-red-500/10">
                              <p className="text-xs text-muted-foreground">Endpoints com Erro</p>
                              <p className="font-medium text-sm text-red-600">{errorCount}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <p className="text-sm text-amber-700">Nenhuma sincronização realizada ainda. Clique em "Sincronizar" para buscar dados.</p>
                          </div>
                        )}
                        
                        {recentLogs.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase">Endpoints Sincronizados</p>
                            <div className="flex flex-wrap gap-2">
                              {recentLogs.map((log, i) => (
                                <Badge 
                                  key={i} 
                                  variant={log.status === "success" ? "default" : log.status === "error" ? "destructive" : "secondary"}
                                  className="text-xs"
                                >
                                  {log.endpoint || log.action}
                                  {log.status === "success" && <CheckCircle2 className="h-3 w-3 ml-1" />}
                                  {log.status === "error" && <AlertCircle className="h-3 w-3 ml-1" />}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {metaAccount.account?.selectedAdAccountId ? (
                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4 text-green-600" />
                              <div>
                                <p className="text-sm font-medium">
                                  {metaAccount.account.selectedAdAccountName || metaAccount.account.selectedAdAccountId}
                                </p>
                                <p className="text-xs text-muted-foreground">Conta de anúncios selecionada</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowMetaAccountSelector(true)}
                              data-testid="button-change-ad-account"
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Alterar
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <p className="text-sm text-amber-700">Nenhuma conta de anúncios selecionada</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowMetaAccountSelector(true)}
                              data-testid="button-select-ad-account"
                            >
                              Selecionar Conta
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {integrations?.map((integration) => {
                    const platform = platformDefinitions.find(p => p.id === integration.platform);
                    if (!platform) return null;
                    
                    return (
                      <div key={integration.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${platform.bgColor} ${platform.color}`}>
                            {platform.icon}
                          </div>
                          <div>
                            <p className="font-medium">{platform.name}</p>
                            <p className="text-sm text-muted-foreground">{integration.shopUrl}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium text-green-600">Saudável</span>
                            </div>
                            {integration.lastSyncAt && (
                              <p className="text-xs text-muted-foreground">
                                Última sync: {format(new Date(integration.lastSyncAt), "dd/MM HH:mm", { locale: ptBR })}
                              </p>
                            )}
                          </div>
                          <Button variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Sincronizar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Nenhuma integração configurada</p>
                  <p className="text-sm">Conecte uma plataforma para monitorar a saúde dos dados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Logs de Sincronização
              </CardTitle>
              <CardDescription>
                Histórico de chamadas de API e eventos das integrações
              </CardDescription>
            </CardHeader>
            <CardContent>
              {integrationLogs?.logs && integrationLogs.logs.length > 0 ? (
                <div className="space-y-2">
                  {integrationLogs.logs.map((log) => {
                    const isInstagram = log.platform === "instagram";
                    const isMeta = log.platform === "meta";
                    
                    return (
                      <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-transparent hover:border-border transition-colors">
                        <div className={`p-1.5 rounded ${isInstagram ? 'bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 text-pink-600' : 'bg-blue-500/10 text-blue-600'}`}>
                          {isInstagram ? <InstagramIcon /> : <MetaIcon />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm capitalize">{log.platform}</span>
                            <Badge 
                              variant={log.status === "success" ? "default" : log.status === "error" ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {log.status === "success" ? "Sucesso" : log.status === "error" ? "Erro" : log.status}
                            </Badge>
                            {log.endpoint && (
                              <Badge variant="outline" className="text-xs">
                                {log.endpoint}
                              </Badge>
                            )}
                          </div>
                          {log.errorMessage && (
                            <p className="text-xs text-red-500 mt-1">
                              {log.errorMessage}
                            </p>
                          )}
                          {log.details && typeof log.details === 'object' && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                          <Clock className="h-3 w-3" />
                          {format(new Date(log.createdAt), "dd/MM HH:mm:ss", { locale: ptBR })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (instagramAccount?.connected || metaAccount?.connected) ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Nenhum log de sincronização ainda</p>
                  <p className="text-sm">Clique em "Sincronizar" para gerar logs</p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Nenhum log disponível</p>
                  <p className="text-sm">Os logs aparecerão quando você conectar uma plataforma</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
  );

  // Meta Account Selection Modal
  const metaAccountSelectorModal = (
    <Dialog open={showMetaAccountSelector} onOpenChange={(open) => {
      setShowMetaAccountSelector(open);
      if (!open) setMetaSearchQuery("");
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MetaIcon />
            Selecionar Conta de Anúncios
          </DialogTitle>
          <DialogDescription>
            Escolha qual conta de anúncios do Meta deseja usar para acompanhar suas campanhas
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou ID..."
              value={metaSearchQuery}
              onChange={(e) => setMetaSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-meta-search"
            />
          </div>

          {metaAccount?.adAccounts && metaAccount.adAccounts.length > 0 ? (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Contas de Anúncios ({metaAccount.adAccounts.filter(acc => 
                !metaSearchQuery || 
                acc.adAccountName?.toLowerCase().includes(metaSearchQuery.toLowerCase()) ||
                acc.adAccountId?.toLowerCase().includes(metaSearchQuery.toLowerCase())
              ).length})</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {metaAccount.adAccounts
                  .filter(acc => 
                    !metaSearchQuery || 
                    acc.adAccountName?.toLowerCase().includes(metaSearchQuery.toLowerCase()) ||
                    acc.adAccountId?.toLowerCase().includes(metaSearchQuery.toLowerCase())
                  )
                  .map((acc) => (
                  <div 
                    key={acc.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedAdAccountId === acc.adAccountId 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedAdAccountId(acc.adAccountId)}
                    data-testid={`ad-account-${acc.adAccountId}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-green-500/10 text-green-600">
                        <BarChart3 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{acc.adAccountName || acc.adAccountId}</p>
                        <p className="text-xs text-muted-foreground">
                          {acc.adAccountId} {acc.currency && `• ${acc.currency}`}
                        </p>
                      </div>
                    </div>
                    {selectedAdAccountId === acc.adAccountId && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>Nenhuma conta de anúncios encontrada</p>
              <p className="text-sm">Verifique as permissões no Meta Business Suite</p>
            </div>
          )}
          
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowMetaAccountSelector(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              disabled={!selectedAdAccountId}
              onClick={() => selectedAdAccountId && handleSelectMetaAdAccount(selectedAdAccountId)}
              data-testid="button-confirm-ad-account"
            >
              Confirmar Seleção
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (embedded) {
    return <>{content}{metaAccountSelectorModal}</>;
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="text-page-title">
            <Link2 className="h-6 w-6" />
            Integrações
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as conexões de plataforma com seus canais de marketing
          </p>
        </div>
      </div>
      {content}
      {metaAccountSelectorModal}
    </div>
  );
}

export default function IntegrationsPage() {
  return <IntegrationsFullContent />;
}
