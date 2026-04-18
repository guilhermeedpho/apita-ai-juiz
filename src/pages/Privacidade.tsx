import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Privacidade = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-display text-xl">APITAJÁ</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-display mb-2">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Última atualização: {new Date().toLocaleDateString("pt-BR")}
        </p>

        <section className="space-y-6 leading-relaxed">
          <p>
            O aplicativo <strong>ApitaJá</strong> não coleta, armazena ou compartilha dados pessoais dos usuários.
          </p>

          <p>
            As informações exibidas no aplicativo são provenientes de fontes externas e utilizadas apenas para navegação.
          </p>

          <p>
            Não utilizamos cookies, rastreamento ou coleta de dados sensíveis.
          </p>

          <h2 className="text-2xl font-display pt-4">Contato</h2>
          <p>
            Se tiver dúvidas, entre em contato pelo e-mail:{" "}
            <a
              href="mailto:apitaja2026@email.com"
              className="text-primary underline underline-offset-4"
            >
              apitaja2026@email.com
            </a>
          </p>
        </section>
      </main>

      <footer className="py-10 border-t border-border mt-10">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} ApitaJá. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default Privacidade;
