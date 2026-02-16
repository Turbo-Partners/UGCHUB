import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Briefcase, DollarSign, Calendar, Users, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'wouter';
import type { OpenCampaign } from './types';

interface CampaignsCardProps {
  openCampaigns: OpenCampaign[];
  completedCampaigns: number;
}

export function CampaignsCard({ openCampaigns, completedCampaigns }: CampaignsCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Campanhas
          </h2>
          <div className="flex items-center gap-2">
            {openCampaigns.length > 0 && (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                {openCampaigns.length} abertas
              </Badge>
            )}
            {completedCampaigns > 0 && (
              <Badge variant="secondary">
                {completedCampaigns} concluídas
              </Badge>
            )}
          </div>
        </div>
      </div>
      <CardContent className="p-6">
        {openCampaigns.length > 0 ? (
          <div className="space-y-3">
            {openCampaigns.slice(0, 3).map((campaign) => (
              <Link key={campaign.id} href={`/campaign/${campaign.id}`}>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="p-4 rounded-xl border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">{campaign.title}</h3>
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          Aberta
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{campaign.description}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
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
                    <Button variant="default" size="sm" className="shrink-0 gap-1">
                      Candidatar-se
                      <Sparkles className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              </Link>
            ))}
            {openCampaigns.length > 3 && (
              <Button variant="outline" className="w-full">
                Ver todas as {openCampaigns.length} campanhas
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">Sem campanhas abertas</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Esta marca não está recrutando criadores no momento
            </p>
            {completedCampaigns > 0 && (
              <p className="text-xs text-muted-foreground">
                Histórico: {completedCampaigns} campanhas realizadas
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
