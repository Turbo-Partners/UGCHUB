import { useEffect, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./creator-onboarding-tour.css";
import { useMarketplace } from "@/lib/provider";

let driverInstance: ReturnType<typeof driver> | null = null;

function createTourDriver() {
  const hasCampaigns =
    document.querySelector('[data-testid^="card-campaign-"]') !== null;
  const hasNavFeed =
    document.querySelector('[data-testid="nav-feed"]') !== null;
  const hasNavApplications =
    document.querySelector('[data-testid="nav-applications"]') !== null;
  const hasNavActiveCampaigns =
    document.querySelector('[data-testid="nav-active-campaigns"]') !== null;
  const hasNavHelp =
    document.querySelector('[data-testid="nav-help"]') !== null;

  if (!hasNavFeed || !hasNavApplications) {
    return null;
  }

  const steps: any[] = [
    {
      popover: {
        title: "Bem-vindo(a) à CreatorConnect! 🎉",
        description:
          "Vamos fazer um tour rápido pela plataforma para você começar a encontrar oportunidades incríveis. Este tutorial leva apenas 1 minuto!",
      },
    },
    {
      element: '[data-testid="nav-feed"]',
      popover: {
        title: "Feed de Campanhas",
        description:
          "Aqui você encontra todas as campanhas disponíveis. Use os filtros para encontrar oportunidades que combinam com seu perfil e nicho.",
        side: "right",
        align: "start",
      },
    },
  ];

  if (hasCampaigns) {
    steps.push({
      element: '[data-testid^="card-campaign-"]',
      popover: {
        title: "Candidatar-se a Campanhas",
        description:
          'Clique em qualquer campanha para ver os detalhes. Quando encontrar uma que goste, clique em "Candidatar-se Agora" e envie uma mensagem personalizada para a marca.',
        side: "bottom",
        align: "start",
      },
    });
  }

  steps.push({
    element: '[data-testid="nav-applications"]',
    popover: {
      title: "Minhas Candidaturas",
      description:
        "Acompanhe aqui o status de todas as suas candidaturas. Você receberá notificações quando marcas responderem!",
      side: "right",
      align: "start",
    },
  });

  if (hasNavActiveCampaigns) {
    steps.push({
      element: '[data-testid="nav-active-campaigns"]',
      popover: {
        title: "Campanhas Ativas",
        description:
          "Quando suas candidaturas forem aceitas, você encontrará as campanhas ativas aqui. Gerencie entregas, acompanhe progresso e comunique-se com as marcas.",
        side: "right",
        align: "start",
      },
    });
  }

  if (hasNavHelp) {
    steps.push({
      element: '[data-testid="nav-help"]',
      popover: {
        title: "Central de Ajuda",
        description:
          "Precisa de ajuda? Aqui você pode relatar problemas, entrar em contato com o suporte e até reiniciar este tutorial a qualquer momento.",
        side: "right",
        align: "start",
      },
    });
  }

  steps.push({
    popover: {
      title: "Tudo pronto! ✨",
      description:
        "Agora você já sabe o básico para começar. Boa sorte nas suas candidaturas!",
    },
  });

  return driver({
    showProgress: true,
    showButtons: ["next", "previous", "close"],
    nextBtnText: "Próximo",
    prevBtnText: "Anterior",
    doneBtnText: "Concluir",
    progressText: "{{current}} de {{total}}",
    steps,
    onDestroyed: () => {
      localStorage.setItem("creator-tour-completed", "true");
    },
  });
}

export function startCreatorTour() {
  localStorage.removeItem("creator-tour-completed");

  const newDriver = createTourDriver();
  if (newDriver) {
    driverInstance = newDriver;
    driverInstance.drive();
  } else {
    window.location.href = "/feed";
  }
}

export function CreatorOnboardingTour() {
  const { user } = useMarketplace();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "creator") return;
    if (hasInitialized) return;

    const tourCompleted = localStorage.getItem("creator-tour-completed");
    if (tourCompleted === "true") return;

    // MUDANÇA AQUI: Aguarda tudo carregar
    const initTour = () => {
      const timer = setTimeout(() => {
        driverInstance = createTourDriver();

        if (driverInstance) {
          try {
            driverInstance.drive();
            setHasInitialized(true);
          } catch (error) {
            console.error("Error starting tour:", error);
          }
        }
      }, 6000);

      return () => clearTimeout(timer);
    };

    // Aguarda CSS e imagens carregarem
    if (document.readyState === "complete") {
      return initTour();
    } else {
      window.addEventListener("load", () => initTour());
      return () => window.removeEventListener("load", initTour);
    }
  }, [user, hasInitialized]);

  return null;
}
