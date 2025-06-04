import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("jobs");
  
  // Update active tab based on URL query parameter
  useEffect(() => {
    // Check URL params to determine active tab
    const updateTabFromURL = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "estimates") {
        setActiveTab("estimates");
      } else {
        setActiveTab("jobs");
      }
    };
    
    // Initial check
    updateTabFromURL();
    
    // Listen for the popstate event (browser navigation)
    window.addEventListener('popstate', updateTabFromURL);
    
    // Listen for the custom openAddEstimate event
    const handleOpenAddEstimate = () => {
      setActiveTab("estimates");
    };
    
    window.addEventListener('openAddEstimate', handleOpenAddEstimate as EventListener);
    
    return () => {
      window.removeEventListener('popstate', updateTabFromURL);
      window.removeEventListener('openAddEstimate', handleOpenAddEstimate as EventListener);
    };
  }, []);
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    // First update our local state
    setActiveTab(tab);
    
    // Create and dispatch a custom event for other components
    const event = new CustomEvent('tabChange', { detail: { tab } });
    window.dispatchEvent(event);
    
    // Update the URL
    window.history.replaceState(null, "", `/?tab=${tab}`);
  };

  return (
    <header className="bg-blue-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="flex items-center">
            <Truck className="h-6 w-6 mr-3" />
            <h1 className="text-xl font-bold">Excavator Estimator</h1>
          </Link>
          <nav className="flex space-x-4">
            <Button
              variant={activeTab === "jobs" ? "secondary" : "ghost"}
              className={activeTab === "jobs" ? "bg-blue-700 hover:bg-blue-600 text-white font-semibold" : "bg-transparent hover:bg-blue-700 text-white"}
              onClick={() => handleTabChange("jobs")}
            >
              Jobs
            </Button>
            <Button
              variant={activeTab === "estimates" ? "secondary" : "ghost"}
              className={activeTab === "estimates" ? "bg-blue-700 hover:bg-blue-600 text-white font-semibold" : "bg-transparent hover:bg-blue-700 text-white"}
              onClick={() => handleTabChange("estimates")}
            >
              Estimates
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
