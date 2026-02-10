import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, BookOpen, GraduationCap, Video, FileText, Users } from "lucide-react";

export default function ProgramCoursesPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/company/program">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-courses-title">
              Cursos e Conteúdo
            </h1>
            <p className="text-muted-foreground">
              Crie materiais educativos para seus creators
            </p>
          </div>
        </div>

        <Card className="border-dashed border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <GraduationCap className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Em Breve</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Estamos desenvolvendo uma plataforma completa de cursos para você treinar seus creators. 
              Em breve você poderá criar vídeos, artigos e materiais educativos.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 px-4 py-2 rounded-full">
                <Video className="h-4 w-4" />
                Vídeo-aulas
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 px-4 py-2 rounded-full">
                <FileText className="h-4 w-4" />
                Artigos
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 px-4 py-2 rounded-full">
                <BookOpen className="h-4 w-4" />
                Guias
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 px-4 py-2 rounded-full">
                <Users className="h-4 w-4" />
                Certificados
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Vídeo-aulas
              </CardTitle>
              <CardDescription>
                Crie aulas em vídeo sobre como criar conteúdo para sua marca
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Documentos
              </CardTitle>
              <CardDescription>
                Compartilhe guias, brand books e materiais de apoio
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Certificação
              </CardTitle>
              <CardDescription>
                Certifique creators que completarem treinamentos
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
