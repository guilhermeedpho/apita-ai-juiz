import { useState } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Check, Copy, QrCode, CreditCard, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PIX_KEY = "58722776000103";
const PIX_NAME = "APITAJÁ LTDA";

function generatePixPayload(amount: number): string {
  const formatField = (id: string, value: string) => {
    return `${id}${String(value.length).padStart(2, "0")}${value}`;
  };

  const merchantAccount =
    formatField("00", "br.gov.bcb.pix") + formatField("01", PIX_KEY);

  let payload = "";
  payload += formatField("00", "01"); // Payload format
  payload += formatField("26", merchantAccount); // Merchant account
  payload += formatField("52", "0000"); // MCC
  payload += formatField("53", "986"); // Currency BRL
  payload += formatField("54", amount.toFixed(2)); // Amount
  payload += formatField("58", "BR"); // Country
  payload += formatField("59", "APITAJA LTDA"); // Merchant name
  payload += formatField("60", "SAO PAULO"); // City
  payload += formatField("62", formatField("05", "***")); // Additional data
  payload += "6304"; // CRC placeholder

  // CRC16 calculation
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
  onConfirm: () => void;
  onCancel: () => void;
}

const PixPayment = ({ price, onConfirm, onCancel }: PixPaymentProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const pixPayload = generatePixPayload(price);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixPayload);
      setCopied(true);
      toast({ title: "Código PIX copiado!" });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-primary/10 border border-primary/30 p-4 text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          <p className="text-sm font-semibold text-primary">Pague via PIX</p>
        </div>

        <div className="flex justify-center p-3 bg-background rounded-xl">
          <QRCode value={pixPayload} size={180} />
        </div>

        <p className="text-xs text-muted-foreground">
          Escaneie o QR Code acima com o app do seu banco
        </p>

        <div className="bg-background rounded-lg p-3 space-y-1.5 text-sm text-left">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Titular:</span>
            <strong>{PIX_NAME}</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Chave (CNPJ):</span>
            <strong className="font-mono text-xs">{PIX_KEY}</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Valor:</span>
            <strong className="text-primary text-base">R$ {price}</strong>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleCopy}
          className="w-full gap-2"
        >
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
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={onCancel} className="font-semibold gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
          <XCircle className="h-4 w-4" />
          Cancelar
        </Button>
        <Button onClick={onConfirm} className="font-semibold gap-2">
          <CreditCard className="h-4 w-4" />
          Já paguei
        </Button>
      </div>
    </div>
  );
};

export default PixPayment;
