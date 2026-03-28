import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, AlertTriangle } from "lucide-react";

const DeleteAccountDialog = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!user || confirmation !== "EXCLUIR") return;

    setDeleting(true);

    const { data, error } = await supabase.functions.invoke("delete-account");

    if (error || !data?.success) {
      toast({ title: "Erro ao excluir conta", description: error?.message || "Tente novamente.", variant: "destructive" });
      setDeleting(false);
      return;
    }

    toast({ title: "Conta excluída com sucesso" });
    await signOut();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="w-full font-semibold">
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir minha conta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir conta permanentemente
          </DialogTitle>
          <DialogDescription>
            Esta ação é irreversível. Todos os seus dados, partidas, avaliações e mensagens serão excluídos.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Digite <strong className="text-destructive">EXCLUIR</strong> para confirmar:
          </p>
          <Input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="EXCLUIR"
          />
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting || confirmation !== "EXCLUIR"}
            className="w-full font-semibold"
          >
            {deleting ? "Excluindo..." : "Confirmar exclusão"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAccountDialog;
