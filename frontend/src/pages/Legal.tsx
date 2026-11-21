import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import SiteFooter from "@/components/SiteFooter";
import { api } from "@/lib/api";

type LegalDocType = "terms" | "privacy" | "contract" | "cookies";
const LEGAL_LABELS: Record<LegalDocType, string> = { terms: "Termos de Uso", privacy: "Privacidade", contract: "Contrato", cookies: "Cookies" };
const ALLOWED: LegalDocType[] = ["terms", "privacy", "contract", "cookies"];
type LegalDocVersion = { id: string; type: LegalDocType; version: string; title: string; content: string; updatedAt: string };

const Legal = () => {
  const { type } = useParams<{ type: string }>();
  const [doc, setDoc] = useState<LegalDocVersion | undefined>();

  const validType = ALLOWED.includes(type as LegalDocType) ? (type as LegalDocType) : "terms";

  useEffect(() => {
    setDoc(undefined);
    api.platform
      .legal(validType)
      .then((remoteDoc) => {
        if (!remoteDoc?.content) return;
        setDoc({
          id: remoteDoc.id || validType,
          type: validType,
          version: remoteDoc.version || "1.0",
          title: remoteDoc.title || LEGAL_LABELS[validType],
          content: remoteDoc.content,
          updatedAt: remoteDoc.updatedAt || new Date().toISOString(),
        });
      })
      .catch(() => undefined);
    document.title = `${LEGAL_LABELS[validType]} • GenOmni Salon`;
  }, [validType]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col">
      <header className="border-b bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <span className="font-serif font-semibold text-sm" translate="no">GenOmni Salon</span>
          <Button asChild size="sm" variant="outline"><Link to="/register">Cadastrar</Link></Button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold">{LEGAL_LABELS[validType]}</h1>
          {doc && (
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Badge variant="outline">v{doc.version}</Badge>
              <span>Atualizado em {new Date(doc.updatedAt).toLocaleDateString("pt-PT")}</span>
            </div>
          )}
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8">
            {doc ? (
              <article
                className="prose prose-sm sm:prose-base max-w-none prose-headings:font-serif"
                dangerouslySetInnerHTML={{ __html: doc.content }}
              />
            ) : (
              <p className="text-muted-foreground text-center py-12">
                Documento ainda não publicado.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {ALLOWED.filter(t => t !== validType).map(t => (
            <Link key={t} to={`/legal/${t}`} className="hover:text-primary underline-offset-4 hover:underline">
              {LEGAL_LABELS[t]}
            </Link>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Legal;
