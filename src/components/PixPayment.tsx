import { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Check, Copy, QrCode, CreditCard, XCircle, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

const PIX_KEY = "58722776000103";
const PIX_NAME = "APITAJÁ LTDA";
const EXPIRATION_SECONDS = 10 * 60;

function generatePixPayload(amount: number): string {
  const formatField = (id: string, value: string) =>
    `${id}${String(value.length).padStart(2, "0")}${value}`;

  const merchantAccount =
    formatField("00", "br.gov.bcb.pix") + formatField("01", PIX_KEY);

  let payload = "";
  payload += formatField("00", "01");
  payload += formatField("26", merchantAccount);
  payload += formatField("52", "0000");
  payload += formatField("53", "986");
  payload += formatField("54", amount.toFixed(2));
  payload += formatField("58", "BR");
  payload += formatField("59", "APITAJA LTDA");
  payload += formatField("60", "SAO PAULO");
  payload += formatField("62", formatField("05", "***"));
  payload += "6304";

  const crc = crc16(payload);
  payload += crc.toUpperCase();
  return payload;
}

function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
    }
    crc &= 0xffff;
  }
  return crc.toString(16).padStart(4, "0");
}

interface PixPaymentProps {
  price: number;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void | Promise<void>;
}

const PixPayment = ({ price, onConfirm, onCancel }: PixPaymentProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [copied, setCopied] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(EXPIRATION_SECONDS);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  const pixPayload = generatePixPayload(price);

  // Timer countdown - stable effect, no dependency issues
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Schedule cancel on next tick to avoid state updates during render
          setTimeout(() => {
            onCancelRef.current();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timerColor =
    secondsLeft <= 60
      ? "text-destructive"
      : secondsLeft <= 180
      ? "text-accent"
      : "text-primary";

  const copyText = async (text: string, manualLabel: string) => {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // fallback below
      }
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    try {
      const successful = document.execCommand("copy");
      if (successful) return true;
    } catch {
      // manual fallback below
    } finally {
      document.body.removeChild(textarea);
    }

    window.prompt(`Copie manualmente ${manualLabel}:`, text);
    return false;
  };

  const handleCopyPayload = async () => {
    try {
      await copyText(pixPayload, "o código PIX");
      setCopied(true);
      toast({ title: "Código PIX copiado! ✅" });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  };

  const handleCopyKey = async () => {
    try {
      await copyText(PIX_KEY, "a chave PIX");
      setKeyCopied(true);
      toast({ title: "Chave PIX copiada! ✅" });
      setTimeout(() => setKeyCopied(false), 3000);
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  };

  const handleConfirmPayment = async () => {
    try {
      setConfirming(true);
      await onConfirm();
    } catch {
      toast({
        title: "Não foi possível confirmar o pagamento",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-primary/10 border border-primary/30 p-4 text-center space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            <p className="text-sm font-semibold text-primary">Pague via PIX</p>
          </div>
          <div className={`flex items-center gap-1.5 ${timerColor} font-mono font-bold text-sm`}>
            <Timer className="h-4 w-4" />
            <span>
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>
        </div>

        <div className="flex justify-center p-3 bg-background rounded-xl">
          <QRCode value={pixPayload} size={isMobile ? 156 : 180} />
        </div>

        <p className="text-xs text-muted-foreground">
          Escaneie o QR Code acima com o app do seu banco
        </p>

        <div className="bg-background rounded-lg p-3 space-y-1.5 text-sm text-left">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Titular:</span>
            <strong>{PIX_NAME}</strong>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-muted-foreground">Chave (CNPJ):</span>
            <button
              type="button"
              onClick={handleCopyKey}
              className="flex items-center gap-1 font-mono text-xs font-bold hover:text-primary transition-colors"
              title="Copiar chave"
            >
              {PIX_KEY}
              <Copy className="h-3 w-3" />
            </button>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Valor:</span>
            <strong className="text-primary text-base">R$ {price}</strong>
          </div>
        </div>

        <div className="space-y-3 text-left">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Chave PIX para copiar e colar
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={PIX_KEY}
                onFocus={(event) => event.currentTarget.select()}
                onClick={(event) => event.currentTarget.select()}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs text-foreground select-all"
              />
              <Button type="button" variant="outline" onClick={handleCopyKey} className="shrink-0 gap-2">
                {keyCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {keyCopied ? "Copiada" : "Copiar"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pix Copia e Cola
            </p>
            <textarea
              readOnly
              value={pixPayload}
              onFocus={(event) => event.currentTarget.select()}
              onClick={(event) => event.currentTarget.select()}
              className="min-h-24 w-full resize-none rounded-md border border-input bg-background px-3 py-2 font-mono text-xs leading-relaxed text-foreground select-all"
            />
            <Button type="button" variant="outline" onClick={handleCopyPayload} className="w-full gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4" /> Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Copiar código Pix Copia e Cola
                </>
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Se o navegador bloquear a cópia, toque no campo e copie manualmente.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="font-semibold gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          <XCircle className="h-4 w-4" />
          Cancelar
        </Button>
        <Button type="button" onClick={handleConfirmPayment} disabled={confirming} className="font-semibold gap-2">
          <CreditCard className="h-4 w-4" />
          {confirming ? "Confirmando..." : "Já paguei"}
        </Button>
      </div>
    </div>
  );
};

export default PixPayment;
