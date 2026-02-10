import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Package, Calendar, CheckCircle2, AlertCircle, Crown, Sparkles, ArrowRight, Receipt } from "lucide-react";

export function BillingSettings() {
  const currentPlan = {
    name: "Plano Gratuito",
    price: "R$ 0",
    period: "/mês",
    features: [
      "Até 3 campanhas ativas",
      "100 criadores por mês",
      "Suporte por email",
    ],
    isCurrent: true,
  };

  const plans = [
    {
      name: "Starter",
      price: "R$ 197",
      period: "/mês",
      popular: false,
      features: [
        "Até 10 campanhas ativas",
        "500 criadores por mês",
        "Analytics básico",
        "Suporte prioritário",
      ],
    },
    {
      name: "Pro",
      price: "R$ 497",
      period: "/mês",
      popular: true,
      features: [
        "Campanhas ilimitadas",
        "Criadores ilimitados",
        "Analytics avançado",
        "Integrações e-commerce",
        "Suporte dedicado",
        "API access",
      ],
    },
    {
      name: "Enterprise",
      price: "Sob consulta",
      period: "",
      popular: false,
      features: [
        "Tudo do Pro",
        "White-label",
        "SLA garantido",
        "Gerente de conta dedicado",
        "Onboarding personalizado",
      ],
    },
  ];

  return (
    <div className="space-y-6" data-testid="billing-settings">
      <div>
        <h2 className="text-xl font-semibold">Faturamento e Assinatura</h2>
        <p className="text-muted-foreground text-sm">Gerencie seu plano e pagamentos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            Plano Atual
          </CardTitle>
          <CardDescription>Seu plano de assinatura atual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{currentPlan.name}</h3>
                  <Badge variant="secondary">Ativo</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="text-xl font-bold text-foreground">{currentPlan.price}</span>
                  {currentPlan.period}
                </p>
              </div>
            </div>
            <Button variant="outline" data-testid="button-manage-subscription">
              Gerenciar Assinatura
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            {currentPlan.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5" />
            Upgrade seu Plano
          </CardTitle>
          <CardDescription>Escolha o plano ideal para sua empresa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-4 rounded-lg border ${
                  plan.popular
                    ? "border-primary bg-gradient-to-b from-primary/5 to-transparent"
                    : "border-border"
                }`}
                data-testid={`plan-card-${plan.name.toLowerCase()}`}
              >
                {plan.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Mais Popular</Badge>
                  </div>
                )}
                <div className="text-center mb-4 mt-2">
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <p className="text-2xl font-bold mt-1">
                    {plan.price}
                    <span className="text-sm font-normal text-muted-foreground">{plan.period}</span>
                  </p>
                </div>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.popular ? "default" : "outline"}
                  className="w-full"
                  data-testid={`button-select-${plan.name.toLowerCase()}`}
                >
                  {plan.name === "Enterprise" ? "Falar com Vendas" : "Selecionar Plano"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" />
            Método de Pagamento
          </CardTitle>
          <CardDescription>Gerencie suas formas de pagamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-4">
              <div className="h-10 w-14 rounded bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-xs">
                VISA
              </div>
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-muted-foreground">Expira em 12/26</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Principal
              </Badge>
              <Button variant="ghost" size="sm" data-testid="button-edit-payment">
                Editar
              </Button>
            </div>
          </div>
          <Button variant="outline" className="mt-4" data-testid="button-add-payment">
            <CreditCard className="h-4 w-4 mr-2" />
            Adicionar Cartão
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5" />
            Histórico de Faturas
          </CardTitle>
          <CardDescription>Veja suas faturas anteriores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma fatura disponível</p>
            <p className="text-sm">Suas faturas aparecerão aqui após o primeiro pagamento</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-amber-800 dark:text-amber-200">Precisa de ajuda com faturamento?</p>
          <p className="text-amber-700 dark:text-amber-300">
            Entre em contato com nosso suporte em{" "}
            <a href="mailto:suporte@creatorconnect.com.br" className="underline">
              suporte@creatorconnect.com.br
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
