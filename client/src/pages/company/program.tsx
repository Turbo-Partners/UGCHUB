import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Crown, 
  Gift, 
  Trophy, 
  BookOpen, 
  Settings,
  Users,
  TrendingUp,
  ArrowRight,
  Loader2,
  Sparkles
} from "lucide-react";
import type { BrandProgram, BrandTierConfig, BrandReward, BrandScoringDefaults } from "@shared/schema";

export default function ProgramPage() {
  const { data: program, isLoading: programLoading } = useQuery<BrandProgram | null>({
    queryKey: ["/api/brand/program"],
  });

  const { data: tiers = [], isLoading: tiersLoading } = useQuery<BrandTierConfig[]>({
    queryKey: ["/api/brand/tiers"],
  });

  const { data: rewards = [], isLoading: rewardsLoading } = useQuery<BrandReward[]>({
    queryKey: ["/api/brand/rewards"],
  });

  const { data: scoringDefaults } = useQuery<BrandScoringDefaults | null>({
    queryKey: ["/api/brand/scoring-defaults"],
  });

  const isLoading = programLoading || tiersLoading || rewardsLoading;

  const menuItems = [
    {
      title: "Tiers de Creators",
      description: "Configure níveis como Bronze, Prata, Ouro e Diamante com benefícios exclusivos",
      icon: Crown,
      href: "/company/program/tiers",
      color: "from-amber-500 to-yellow-500",
      stats: `${tiers.length} tiers configurados`,
      testId: "link-program-tiers",
    },
    {
      title: "Regras de Pontuação",
      description: "Defina como creators ganham pontos: entregáveis, views, engajamento, vendas",
      icon: Trophy,
      href: "/company/program/gamification-rules",
      color: "from-purple-500 to-indigo-500",
      stats: scoringDefaults ? "Regras definidas" : "Não configurado",
      testId: "link-program-gamification",
    },
    {
      title: "Catálogo de Prêmios",
      description: "Gerencie prêmios disponíveis: produtos, dinheiro, benefícios e experiências",
      icon: Gift,
      href: "/company/program/rewards",
      color: "from-pink-500 to-rose-500",
      stats: `${rewards.filter(r => r.isActive).length} prêmios ativos`,
      testId: "link-program-rewards",
    },
    {
      title: "Cursos e Conteúdo",
      description: "Crie materiais educativos e treinamentos para seus creators",
      icon: BookOpen,
      href: "/company/program/courses",
      color: "from-emerald-500 to-teal-500",
      stats: "Em breve",
      testId: "link-program-courses",
    },
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-program-title">
              {program?.name || "Programa de Creators"}
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure seu programa de fidelidade e gamificação para creators
            </p>
          </div>
          <Link href="/company/program/settings">
            <Button variant="outline" data-testid="button-program-settings">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
          </Link>
        </div>

        {!program && (
          <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
            <CardContent className="py-8 text-center">
              <Sparkles className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Configure seu programa</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Crie um programa de creators para engajar e recompensar seus influenciadores. 
                Defina tiers, regras de pontuação e prêmios exclusivos.
              </p>
              <Link href="/company/program/settings">
                <Button data-testid="button-setup-program">
                  Configurar Programa
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card 
                className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50"
                data-testid={item.testId}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${item.color} text-white shadow-lg`}>
                      <item.icon className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <CardTitle className="text-xl mt-4">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>{item.stats}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {program && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Resumo do Programa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{tiers.length}</div>
                  <div className="text-sm text-muted-foreground">Tiers</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{rewards.length}</div>
                  <div className="text-sm text-muted-foreground">Prêmios</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{program.gamificationEnabled ? "Ativo" : "Inativo"}</div>
                  <div className="text-sm text-muted-foreground">Gamificação</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{program.autoJoinCommunity ? "Sim" : "Não"}</div>
                  <div className="text-sm text-muted-foreground">Auto-join</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
