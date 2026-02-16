import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  Calendar,
  Users,
  ExternalLink,
  Send,
  Loader2,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAvatarUrl } from '@/lib/utils';
import type { OpenCampaign } from './types';

interface ApplyPartnershipSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyLogo: string | null;
  displayName: string;
  applyStep: 'select' | 'message' | 'success';
  setApplyStep: (step: 'select' | 'message' | 'success') => void;
  openCampaigns: OpenCampaign[];
  selectedCampaign: OpenCampaign | undefined;
  applicationMessage: string;
  setApplicationMessage: (msg: string) => void;
  applyIsPending: boolean;
  onSelectCampaign: (id: number) => void;
  onSubmitApplication: () => void;
  onClose: () => void;
}

export function ApplyPartnershipSheet({
  open,
  onOpenChange,
  companyLogo,
  displayName,
  applyStep,
  setApplyStep,
  openCampaigns,
  selectedCampaign,
  applicationMessage,
  setApplicationMessage,
  applyIsPending,
  onSelectCampaign,
  onSubmitApplication,
  onClose,
}: ApplyPartnershipSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-primary/10">
              <AvatarImage src={getAvatarUrl(companyLogo)} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white font-bold">
                {displayName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-left">Solicitar Parceria</SheetTitle>
              <SheetDescription className="text-left">
                {displayName}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6">
          <AnimatePresence mode="wait">
            {applyStep === 'select' && (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <h3 className="font-semibold">Escolha uma campanha</h3>
                  <p className="text-sm text-muted-foreground">
                    Selecione a campanha para a qual você deseja se candidatar
                  </p>
                </div>

                {openCampaigns.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <div className="rounded-full bg-muted p-3 mb-3">
                        <Briefcase className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        Esta marca não tem campanhas abertas no momento
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {openCampaigns.map((campaign) => (
                      <motion.div
                        key={campaign.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card
                          className="cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                          onClick={() => onSelectCampaign(campaign.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-1">
                                <h4 className="font-medium">{campaign.title}</h4>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {campaign.description}
                                </p>
                                <div className="flex items-center gap-3 pt-2">
                                  {campaign.budget && (
                                    <Badge variant="secondary" className="text-xs">
                                      <DollarSign className="h-3 w-3 mr-0.5" />
                                      R$ {campaign.budget.toLocaleString('pt-BR')}
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    <Calendar className="h-3 w-3 mr-0.5" />
                                    {format(new Date(campaign.deadline), "dd MMM", { locale: ptBR })}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    <Users className="h-3 w-3 mr-0.5" />
                                    {campaign.applicationsCount} candidatos
                                  </Badge>
                                </div>
                              </div>
                              <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {applyStep === 'message' && selectedCampaign && (
              <motion.div
                key="message"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-auto text-muted-foreground"
                    onClick={() => setApplyStep('select')}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Voltar
                  </Button>
                  <h3 className="font-semibold">{selectedCampaign.title}</h3>
                </div>

                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {selectedCampaign.budget && (
                        <Badge variant="secondary" className="text-xs">
                          <DollarSign className="h-3 w-3 mr-0.5" />
                          R$ {selectedCampaign.budget.toLocaleString('pt-BR')}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 mr-0.5" />
                        Prazo: {format(new Date(selectedCampaign.deadline), "dd/MM/yyyy", { locale: ptBR })}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label htmlFor="message">Sua mensagem</Label>
                  <Textarea
                    id="message"
                    placeholder="Olá! Estou muito interessado(a) nesta campanha porque..."
                    className="min-h-[150px] resize-none"
                    value={applicationMessage}
                    onChange={(e) => setApplicationMessage(e.target.value)}
                    data-testid="input-application-message"
                  />
                  <p className="text-xs text-muted-foreground">
                    Apresente-se e explique por que você é ideal para esta campanha
                  </p>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={onSubmitApplication}
                  disabled={applyIsPending}
                  data-testid="button-submit-application"
                >
                  {applyIsPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Candidatura
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {applyStep === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center"
                >
                  <Check className="h-10 w-10 text-green-600" />
                </motion.div>
                <h3 className="text-xl font-semibold text-center">Candidatura Enviada!</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  Sua candidatura foi enviada com sucesso. A marca irá avaliar seu perfil e entrará em contato em breve.
                </p>
                <Button onClick={onClose} variant="outline" className="mt-4">
                  Fechar
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
