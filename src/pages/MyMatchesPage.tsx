import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MyMatches from "@/components/MyMatches";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const MyMatchesPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 max-w-2xl">
        <MyMatches />
      </div>
      <Footer />
    </div>
  );
};

export default MyMatchesPage;
