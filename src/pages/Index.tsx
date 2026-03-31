import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import SearchBar from "@/components/SearchBar";
import HowItWorks from "@/components/HowItWorks";
import RefereeList from "@/components/RefereeList";
import type { RefereeFilters } from "@/components/RefereeList";
import RefereeDashboard from "@/components/RefereeDashboard";
import RefereeMap from "@/components/RefereeMap";
import Footer from "@/components/Footer";

const Index = () => {
  const { user } = useAuth();
  const [isReferee, setIsReferee] = useState(false);
  const [checked, setChecked] = useState(false);
  const [filters, setFilters] = useState<RefereeFilters>({});

  useEffect(() => {
    if (!user) {
      setIsReferee(false);
      setChecked(true);
      return;
    }

    supabase.rpc("has_role", { _user_id: user.id, _role: "referee" as const })
      .then(({ data }) => {
        setIsReferee(!!data);
        setChecked(true);
      });
  }, [user]);

  if (!checked) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
      </div>
    );
  }

  if (isReferee) {
    return (
      <div className="min-h-screen referee-theme bg-background">
        <Navbar />
        <div className="pt-16">
          <RefereeDashboard />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <SearchBar onFilter={setFilters} />
      <RefereeList filters={filters} />
      <HowItWorks />
      <Footer />
    </div>
  );
};

export default Index;
