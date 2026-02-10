import { useEffect } from "react";
import { useLocation } from "wouter";
import { useMarketplace } from "@/lib/provider";
import { Loader2 } from "lucide-react";
import CreatorSettings from "@/pages/creator/settings";

export default function SettingsRedirect() {
  const { user } = useMarketplace();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user?.role === "company") {
      setLocation("/company/settings");
    }
  }, [user, setLocation]);

  if (!user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user.role === "company") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <CreatorSettings />;
}
