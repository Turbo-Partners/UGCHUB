import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Instagram, ShoppingBag, CheckCircle2, Lock } from "lucide-react";

import blingIcon from "@/assets/integrations/bling.png";
import nuvemshopIcon from "@/assets/integrations/nuvemshop.png";
import omieIcon from "@/assets/integrations/omie.png";
import shopifyIcon from "@/assets/integrations/shopify.png";
import yampiIcon from "@/assets/integrations/yampi.png";

type PlatformCategory = "social" | "ecommerce";

interface PlatformDefinition {
  id: string;
  name: string;
  icon: ReactNode;
  color: string;
  bgColor: string;
  category: PlatformCategory;
  locked?: boolean;
}

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.802c-2.67 0-2.986.01-4.04.059-.976.045-1.505.207-1.858.344-.466.182-.8.398-1.15.748-.35.35-.566.684-.748 1.15-.137.353-.3.882-.344 1.857-.048 1.055-.058 1.37-.058 4.041 0 2.67.01 2.986.058 4.04.045.976.207 1.505.344 1.858.182.466.399.8.748 1.15.35.35.684.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058 2.67 0 2.987-.01 4.04-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.684.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041 0-2.67-.01-2.986-.058-4.04-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 0 0-.748-1.15 3.098 3.098 0 0 0-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.055-.048-1.37-.058-4.041-.058zm0 3.063a5.135 5.135 0 1 1 0 10.27 5.135 5.135 0 0 1 0-10.27zm0 8.468a3.333 3.333 0 1 0 0-6.666 3.333 3.333 0 0 0 0 6.666zm6.538-8.671a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z"/>
  </svg>
);

const MetaBusinessIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
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

const GoogleAnalyticsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M22.84 2.998c-.648-.636-1.63-.765-2.422-.323l-.23.13c-.79.45-1.282 1.29-1.282 2.195v14c0 .905.492 1.745 1.282 2.195l.23.13c.792.442 1.774.313 2.422-.323.478-.47.74-1.108.74-1.772V4.77c0-.664-.262-1.302-.74-1.772zM14 9.77c-.648-.636-1.63-.765-2.422-.323l-.23.13c-.79.45-1.282 1.29-1.282 2.195v7.228c0 .905.492 1.745 1.282 2.195l.23.13c.792.442 1.774.313 2.422-.323.478-.47.74-1.108.74-1.772V11.77c-.001-.664-.263-1.302-.74-1.772V9.77zM5.16 16.998c-.648-.636-1.63-.765-2.422-.323l-.23.13c-.79.45-1.282 1.29-1.282 2.195v0c0 .905.492 1.745 1.282 2.195l.23.13c.792.442 1.774.313 2.422-.323.478-.47.74-1.108.74-1.772v0c0-.664-.262-1.302-.74-1.772v-.46z"/>
  </svg>
);

const ShopifyIcon = () => (
  <img src={shopifyIcon} alt="Shopify" className="w-5 h-5 object-contain" />
);

const BlingIcon = () => (
  <img src={blingIcon} alt="Bling" className="w-5 h-5 object-contain rounded" />
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

const WooCommerceIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M2.227 4.857A2.228 2.228 0 0 0 0 7.094v7.457c0 1.236 1.001 2.237 2.237 2.237h3.09l-.705 3.36 4.403-3.36h12.748A2.227 2.227 0 0 0 24 14.551V7.094a2.228 2.228 0 0 0-2.227-2.237H2.227z" fill="#9B5C8F"/>
  </svg>
);

const platformDefinitions: PlatformDefinition[] = [
  {
    id: "instagram_business",
    name: "Instagram Business",
    icon: <InstagramIcon />,
    color: "text-pink-600",
    bgColor: "bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10",
    category: "social",
  },
  {
    id: "meta_business",
    name: "Meta Business",
    icon: <MetaBusinessIcon />,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    category: "social",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: <TikTokIcon />,
    color: "text-gray-900 dark:text-white",
    bgColor: "bg-gray-500/10",
    category: "social",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: <YouTubeIcon />,
    color: "text-red-600",
    bgColor: "bg-red-500/10",
    category: "social",
  },
  {
    id: "google_analytics",
    name: "Google Analytics (GA4)",
    icon: <GoogleAnalyticsIcon />,
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
    category: "social",
  },
  {
    id: "shopify",
    name: "Shopify",
    icon: <ShopifyIcon />,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    category: "ecommerce",
    locked: true,
  },
  {
    id: "yampi",
    name: "Yampi",
    icon: <YampiIcon />,
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
    category: "ecommerce",
    locked: true,
  },
  {
    id: "nuvemshop",
    name: "Nuvemshop",
    icon: <NuvemshopIcon />,
    color: "text-indigo-600",
    bgColor: "bg-indigo-500/10",
    category: "ecommerce",
    locked: true,
  },
  {
    id: "bling",
    name: "Bling",
    icon: <BlingIcon />,
    color: "text-violet-600",
    bgColor: "bg-violet-500/10",
    category: "ecommerce",
    locked: true,
  },
  {
    id: "omie",
    name: "Omie",
    icon: <OmieIcon />,
    color: "text-cyan-600",
    bgColor: "bg-cyan-500/10",
    category: "ecommerce",
    locked: true,
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    icon: <WooCommerceIcon />,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
    category: "ecommerce",
    locked: true,
  },
];

export function OnboardingIntegrations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const { data: instagramAccount } = useQuery<{ connected: boolean; account?: { username: string } }>({
    queryKey: ["/api/instagram/account"],
    queryFn: async () => {
      const res = await fetch("/api/instagram/account", { credentials: "include" });
      if (!res.ok) return { connected: false };
      return res.json();
    },
  });

  const handleConnectPlatform = (platform: PlatformDefinition) => {
    if (platform.locked) {
      toast({ title: "Em breve", description: `Integração com ${platform.name} estará disponível em breve.` });
      return;
    }
    if (platform.id === "instagram_business") {
      window.location.href = "/api/auth/instagram/start?type=business&returnTo=" + encodeURIComponent(window.location.pathname);
      return;
    }
    toast({ title: "Em breve", description: `Integração com ${platform.name} estará disponível em breve.` });
  };

  const handleDisconnectInstagram = async () => {
    setIsDisconnecting(true);
    try {
      const res = await fetch("/api/instagram/account", {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast({ title: "Instagram desconectado" });
        queryClient.invalidateQueries({ queryKey: ["/api/instagram/account"] });
      }
    } catch (error) {
      toast({ title: "Erro ao desconectar", variant: "destructive" });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const connectedPlatformIds: string[] = [
    ...(instagramAccount?.connected ? ["instagram_business"] : []),
  ];

  const socialPlatforms = platformDefinitions.filter(p => p.category === "social");
  const ecommercePlatforms = platformDefinitions.filter(p => p.category === "ecommerce");

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Instagram className="h-4 w-4 text-pink-500" />
          <h3 className="text-sm font-semibold">Redes Sociais</h3>
          <Badge variant="secondary" className="text-xs">Recomendado</Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {socialPlatforms.map((platform) => {
            const isConnected = connectedPlatformIds.includes(platform.id);
            const isInstagramConnected = platform.id === "instagram_business" && isConnected;
            
            return (
              <Card 
                key={platform.id}
                className={isConnected 
                  ? "border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20"
                  : "hover:border-primary/50 transition-colors cursor-pointer"
                }
                onClick={() => !isConnected && handleConnectPlatform(platform)}
                data-testid={`card-${platform.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${platform.bgColor} ${platform.color}`}>
                      {platform.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm flex items-center gap-2">
                        {platform.name}
                        {isConnected && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </p>
                      {isInstagramConnected && instagramAccount?.account && (
                        <p className="text-xs text-green-600">@{instagramAccount.account.username}</p>
                      )}
                    </div>
                    {!isConnected && (
                      <Button size="sm" variant="outline" className="shrink-0" data-testid={`button-connect-${platform.id}`}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                    {isInstagramConnected && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="shrink-0 text-red-500 hover:text-red-600"
                        onClick={(e) => { e.stopPropagation(); handleDisconnectInstagram(); }}
                        disabled={isDisconnecting}
                        data-testid="button-disconnect-instagram"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-green-600" />
          <h3 className="text-sm font-semibold">E-commerce e ERPs</h3>
          <Badge variant="outline" className="text-xs text-muted-foreground">Em breve</Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ecommercePlatforms.map((platform) => (
            <Card 
              key={platform.id}
              className="opacity-60 cursor-not-allowed border-dashed"
              data-testid={`card-${platform.id}`}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${platform.bgColor} ${platform.color}`}>
                    {platform.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm flex items-center gap-1">
                      {platform.name}
                    </p>
                  </div>
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
