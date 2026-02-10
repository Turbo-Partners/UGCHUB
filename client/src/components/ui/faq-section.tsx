import { motion } from "framer-motion";
import { useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, ArrowRight, MessageCircle } from "lucide-react";
import { Link } from "wouter";
import { GlowButton } from "./glow-button";
import { Button } from "./button";

const faqs = [
  {
    question: "O que é CreatorConnect?",
    answer: "CreatorConnect é a principal plataforma brasileira de marketing de influência que conecta marcas com criadores de conteúdo. Mais de 250 empresas já usam a plataforma, com R$15 milhões pagos a criadores."
  },
  {
    question: "Como funciona o processo de parceria?",
    answer: "Após se cadastrar gratuitamente, você navega pelas campanhas disponíveis e se candidata às que combinam com seu perfil. As marcas analisam e, se aprovado, você recebe o briefing e começa a criar conteúdo."
  },
  {
    question: "Quanto tempo leva para receber os pagamentos?",
    answer: "Os pagamentos são processados em até 7 dias úteis após aprovação do conteúdo pela marca. Você acompanha todos os pagamentos e comissões pelo painel. 100% dos pagamentos são garantidos."
  },
  {
    question: "Preciso ter quantos seguidores para participar?",
    answer: "Não há número mínimo de seguidores! CreatorConnect valoriza engajamento e qualidade do conteúdo. Micro-influenciadores com comunidades engajadas são muito bem-vindos nas campanhas."
  },
  {
    question: "Quais tipos de campanhas estão disponíveis?",
    answer: "A CreatorConnect oferece diversos formatos: posts no feed, stories, reels, unboxings, reviews, UGC (User Generated Content), lives colaborativas e muito mais."
  },
  {
    question: "A plataforma cobra alguma taxa dos criadores?",
    answer: "Para criadores, a CreatorConnect é 100% gratuita. Você recebe o valor integral combinado com a marca. Para empresas, oferecemos planos flexíveis de acordo com suas necessidades."
  },
  {
    question: "Como garantem a segurança dos pagamentos?",
    answer: "Todos os pagamentos na CreatorConnect são intermediados pela plataforma. A marca deposita antes do início da campanha, garantindo que você receberá pelo seu trabalho."
  },
  {
    question: "Qual a diferença entre CreatorConnect e outras plataformas de influenciadores?",
    answer: "CreatorConnect foca no mercado brasileiro com suporte em português, pagamentos em reais, e ferramentas específicas para o mercado local. Já são R$15 milhões em parcerias pagas."
  },
];

export function FAQSection() {
  useEffect(() => {
    const existingScript = document.getElementById('faq-jsonld');
    if (existingScript) {
      existingScript.remove();
    }

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    const script = document.createElement('script');
    script.id = 'faq-jsonld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(faqSchema);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('faq-jsonld');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, []);

  return (
    <section id="faq" className="py-24 bg-background dark:bg-zinc-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-transparent to-muted/50 dark:from-zinc-900/50 dark:to-zinc-900/50" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-white/5 border border-primary/20 dark:border-white/10 mb-6">
            <HelpCircle className="w-4 h-4 text-primary dark:text-primary" />
            <span className="text-sm font-medium text-primary dark:text-primary">Dúvidas Frequentes</span>
          </div>
          
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground dark:text-white mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-2xl mx-auto">
            Tudo que você precisa saber para começar a monetizar seu conteúdo
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <AccordionItem 
                  value={`item-${index}`}
                  className="bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800/50 rounded-xl px-6 overflow-hidden data-[state=open]:bg-zinc-50 dark:data-[state=open]:bg-zinc-900 transition-all duration-300 shadow-sm hover:shadow-md"
                  data-testid={`faq-item-${index}`}
                >
                  <AccordionTrigger 
                    className="text-left font-semibold text-zinc-900 dark:text-zinc-100 hover:text-primary dark:hover:text-primary transition-colors py-5 [&[data-state=open]>svg]:rotate-180"
                    data-testid={`faq-trigger-${index}`}
                  >
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="faq-answer text-zinc-600 dark:text-zinc-400 pb-5 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-16"
        >
          <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 inline-block">
            <p className="text-zinc-900 dark:text-white font-medium mb-6">
              Ainda tem dúvidas? Estamos aqui para ajudar.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth">
                <GlowButton size="lg" className="h-12 px-8 bg-primary text-white hover:bg-primary/90 rounded-full font-semibold shadow-lg shadow-primary/20" data-testid="cta-faq-start">
                  Começar Agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </GlowButton>
              </Link>
              <a href="mailto:suporte@creatorconnect.com.br">
                <Button variant="outline" size="lg" className="h-12 px-8 rounded-full font-medium border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800" data-testid="cta-faq-support">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Falar com Suporte
                </Button>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
