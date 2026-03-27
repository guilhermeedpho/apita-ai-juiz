import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary" />
          <span className="font-display text-2xl tracking-wide">APITAJÁ</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="font-medium">
            Entrar
          </Button>
          <Button size="sm" className="font-semibold">
            Cadastrar
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
