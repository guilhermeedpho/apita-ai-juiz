import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, User, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <Shield className="h-7 w-7 text-primary" />
          <span className="font-display text-2xl tracking-wide">APITAJÁ</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/perfil")} className="font-medium">
                <User className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Perfil</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut} className="font-medium">
                <LogOut className="h-4 w-4 mr-1" />
                Sair
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="font-medium" onClick={() => navigate("/auth")}>
                Entrar
              </Button>
              <Button size="sm" className="font-semibold" onClick={() => navigate("/auth")}>
                Cadastrar
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
