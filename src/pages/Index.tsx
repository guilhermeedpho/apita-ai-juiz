import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import SearchBar from "@/components/SearchBar";
import HowItWorks from "@/components/HowItWorks";
import RefereeList from "@/components/RefereeList";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <SearchBar />
      <RefereeList />
      <HowItWorks />
      <Footer />
    </div>
  );
};

export default Index;
