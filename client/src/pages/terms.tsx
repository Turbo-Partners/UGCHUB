import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, CreditCard, Scale, AlertTriangle, Shield, Ban, RefreshCw } from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { Footer } from "@/components/footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-8 border-b">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">Termos de Uso</CardTitle>
            <p className="text-muted-foreground mt-2">CreatorConnect - Plataforma de Marketing de Influência</p>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none pt-8 space-y-8">
            
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Scale className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold m-0">1. Aceitação dos Termos</h2>
              </div>
              <p>
                Ao acessar e utilizar a plataforma CreatorConnect ("Plataforma"), você ("Usuário") concorda integralmente 
                com estes Termos de Uso. Caso não concorde com qualquer disposição, não utilize nossos serviços.
              </p>
              <p>
                Estes termos constituem um contrato vinculante entre você e a CreatorConnect. A utilização da Plataforma 
                implica na aceitação automática de todas as condições aqui estabelecidas.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold m-0">2. Descrição do Serviço</h2>
              </div>
              <p>
                A CreatorConnect é uma plataforma marketplace que conecta:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Marcas/Empresas:</strong> Empresas que buscam criadores de conteúdo para campanhas de marketing</li>
                <li><strong>Criadores de Conteúdo:</strong> Influenciadores e produtores de conteúdo que desejam parcerias pagas</li>
              </ul>
              <p>
                Nossos serviços incluem: publicação de campanhas, gerenciamento de candidaturas, acompanhamento de entregas, 
                sistema de pagamentos, avaliações e comunicação entre as partes.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold m-0">3. Cadastro e Contas</h2>
              </div>
              <h4 className="font-medium mt-4">3.1 Requisitos</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Ter no mínimo 18 anos ou maioridade legal em sua jurisdição</li>
                <li>Fornecer informações verdadeiras, precisas e atualizadas</li>
                <li>Manter a confidencialidade de suas credenciais de acesso</li>
              </ul>
              
              <h4 className="font-medium mt-4">3.2 Verificação</h4>
              <p>
                Podemos solicitar documentos para verificar sua identidade, redes sociais ou informações empresariais. 
                Contas não verificadas podem ter funcionalidades limitadas.
              </p>
              
              <h4 className="font-medium mt-4">3.3 Responsabilidade</h4>
              <p>
                Você é exclusivamente responsável por todas as atividades realizadas em sua conta. Notifique-nos 
                imediatamente sobre qualquer uso não autorizado.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold m-0">4. Pagamentos e Taxas</h2>
              </div>
              <h4 className="font-medium mt-4">4.1 Taxas da Plataforma</h4>
              <p>
                A CreatorConnect cobra uma taxa de serviço sobre transações realizadas na plataforma. As taxas vigentes 
                são informadas antes da confirmação de cada transação.
              </p>
              
              <h4 className="font-medium mt-4">4.2 Pagamentos para Criadores</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Pagamentos são processados após aprovação das entregas pela empresa</li>
                <li>O prazo de transferência é de até 14 dias úteis após aprovação</li>
                <li>É necessário cadastrar dados bancários válidos para recebimento</li>
              </ul>
              
              <h4 className="font-medium mt-4">4.3 Impostos</h4>
              <p>
                Cada usuário é responsável pelo pagamento de tributos incidentes sobre seus rendimentos, 
                conforme legislação aplicável.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold m-0">5. Obrigações do Usuário</h2>
              </div>
              <h4 className="font-medium mt-4">5.1 Criadores de Conteúdo</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Produzir conteúdo original e conforme briefing acordado</li>
                <li>Cumprir prazos estabelecidos nas campanhas</li>
                <li>Sinalizar corretamente conteúdos patrocinados conforme legislação</li>
                <li>Não usar bots, comprar seguidores ou manipular métricas</li>
              </ul>
              
              <h4 className="font-medium mt-4">5.2 Empresas/Marcas</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Fornecer briefings claros e completos</li>
                <li>Realizar pagamentos conforme acordado</li>
                <li>Aprovar ou solicitar revisões em tempo hábil</li>
                <li>Respeitar os direitos autorais dos criadores</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Ban className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold m-0">6. Condutas Proibidas</h2>
              </div>
              <p>É expressamente proibido:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fazer acordos fora da plataforma para evitar taxas de serviço</li>
                <li>Criar múltiplas contas ou contas falsas</li>
                <li>Publicar conteúdo ilegal, difamatório, violento ou discriminatório</li>
                <li>Violar direitos de propriedade intelectual de terceiros</li>
                <li>Utilizar a plataforma para spam ou fraude</li>
                <li>Manipular avaliações ou feedbacks</li>
                <li>Assediar, ameaçar ou intimidar outros usuários</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold m-0">7. Propriedade Intelectual</h2>
              </div>
              <h4 className="font-medium mt-4">7.1 Conteúdo do Usuário</h4>
              <p>
                O criador mantém os direitos autorais sobre seu conteúdo. Ao participar de uma campanha, concede à empresa 
                licença de uso conforme termos específicos acordados.
              </p>
              
              <h4 className="font-medium mt-4">7.2 Propriedade da Plataforma</h4>
              <p>
                A marca CreatorConnect, logotipos, design e funcionalidades da plataforma são de propriedade exclusiva 
                da empresa e não podem ser reproduzidos sem autorização.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <RefreshCw className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold m-0">8. Resolução de Disputas</h2>
              </div>
              <p>
                Em caso de conflitos entre usuários, a CreatorConnect oferece um sistema de mediação. Decisões 
                da plataforma são finais e vinculantes para as partes envolvidas.
              </p>
              <p>
                Questões não resolvidas internamente serão submetidas à arbitragem ou ao foro da comarca de São Paulo/SP.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">9. Limitação de Responsabilidade</h2>
              <p>
                A CreatorConnect atua como intermediária e não se responsabiliza por:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Qualidade ou veracidade do conteúdo produzido pelos criadores</li>
                <li>Cumprimento de acordos entre usuários além do facilitado pela plataforma</li>
                <li>Resultados de campanhas de marketing</li>
                <li>Danos indiretos, incidentais ou consequenciais</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold">10. Suspensão e Encerramento</h2>
              <p>
                Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos, sem aviso prévio e 
                sem direito a reembolso de valores pendentes em casos de fraude.
              </p>
              <p>
                Você pode encerrar sua conta a qualquer momento através das configurações da plataforma, respeitando 
                obrigações pendentes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">11. Alterações nos Termos</h2>
              <p>
                Podemos modificar estes termos a qualquer momento. Alterações significativas serão comunicadas com 
                antecedência de 30 dias. O uso contínuo da plataforma após alterações constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">12. Disposições Gerais</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Lei Aplicável:</strong> Estes termos são regidos pelas leis da República Federativa do Brasil</li>
                <li><strong>Foro:</strong> Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer controvérsias</li>
                <li><strong>Integralidade:</strong> Estes termos constituem o acordo integral entre as partes</li>
                <li><strong>Independência:</strong> A nulidade de qualquer cláusula não afeta as demais</li>
              </ul>
            </section>

            <div className="text-sm text-muted-foreground mt-8 pt-4 border-t flex items-center justify-between">
              <span>Última atualização: Dezembro de 2024</span>
              <span>Versão 1.0</span>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
      <Footer />
    </div>
  );
}
