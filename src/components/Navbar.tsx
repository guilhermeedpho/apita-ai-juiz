import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, User, ShieldCheck, CalendarDays, Sun, Moon } from "lucide-react";
import logoApitaJa from "@/assets/logo_apita_ja.png";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isReferee, setIsReferee] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (!user) { setIsAdmin(false); setIsReferee(false); return; }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" as const })
      .then(({ data }) => setIsAdmin(!!data));
    supabase.rpc("has_role", { _user_id: user.id, _role: "referee" as const })
      .then(({ data }) => setIsReferee(!!data));
  }, [user]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.remove("light-theme");
    } else {
      document.documentElement.classList.add("light-theme");
    }
  }, [darkMode]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <img src={logoApitaJa} alt="ApitaJá" className="h-8" />
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <>
              <NotificationBell />
              {!isReferee && (
                <Button variant="ghost" size="sm" onClick={() => navigate("/minhas-partidas")} className="font-medium">
                  <CalendarDays className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Partidas</span>
                </Button>
              )}
              {isAdmin && (
                <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="font-medium">
                  <ShieldCheck className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              )}
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
