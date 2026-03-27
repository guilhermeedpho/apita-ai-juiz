import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle, Share, MoreVertical, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <button onClick={() => navigate("/")} className="absolute top-4 left-4 text-muted-foreground">
        <ArrowLeft className="h-6 w-6" />
      </button>

      {isInstalled ? (
        <div className="space-y-4">
          <CheckCircle className="h-16 w-16 text-primary mx-auto" />
          <h1 className="text-4xl font-display">APP INSTALADO!</h1>
          <p className="text-muted-foreground">O ApitaJá já está na sua tela inicial.</p>
          <Button onClick={() => navigate("/")} className="mt-4">Ir para o app</Button>
        </div>
      ) : isIOS ? (
        <div className="space-y-6 max-w-sm">
          <Download className="h-16 w-16 text-primary mx-auto" />
          <h1 className="text-4xl font-display">INSTALAR APITAJÁ</h1>
          <p className="text-muted-foreground">Para instalar no iPhone/iPad:</p>
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
              <Share className="h-6 w-6 text-primary flex-shrink-0" />
              <span>1. Toque no botão <strong>Compartilhar</strong> do Safari</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
              <Download className="h-6 w-6 text-primary flex-shrink-0" />
              <span>2. Selecione <strong>"Adicionar à Tela de Início"</strong></span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
              <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
              <span>3. Toque em <strong>"Adicionar"</strong></span>
            </div>
          </div>
        </div>
      ) : deferredPrompt ? (
        <div className="space-y-6 max-w-sm">
          <Download className="h-16 w-16 text-primary mx-auto" />
          <h1 className="text-4xl font-display">INSTALAR APITAJÁ</h1>
          <p className="text-muted-foreground">Instale o app direto no seu celular, sem precisar de loja!</p>
          <Button onClick={handleInstall} size="lg" className="w-full text-lg h-14">
            <Download className="mr-2 h-5 w-5" /> Instalar Agora
          </Button>
        </div>
      ) : (
        <div className="space-y-6 max-w-sm">
          <Download className="h-16 w-16 text-primary mx-auto" />
          <h1 className="text-4xl font-display">INSTALAR APITAJÁ</h1>
          <p className="text-muted-foreground">Para instalar no Android:</p>
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
              <MoreVertical className="h-6 w-6 text-primary flex-shrink-0" />
              <span>1. Toque no menu <strong>(⋮)</strong> do navegador</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
              <Download className="h-6 w-6 text-primary flex-shrink-0" />
              <span>2. Selecione <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Install;
