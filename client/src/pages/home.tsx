import { useState, useEffect } from "react";
import JobsList from "@/pages/jobs/JobsList";
import EstimatesList from "@/pages/estimates/EstimatesList";

export default function Home() {
  // State to track which tab is active
  const [activeTab, setActiveTab] = useState("jobs");

  // Check URL params on initial load to determine active tab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "estimates") {
      setActiveTab("estimates");
    }
  }, []);

  // State to track whether to automatically open the add estimate modal
  const [openAddEstimateModal, setOpenAddEstimateModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Listen for tab changes and custom events
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      setActiveTab(tab === "estimates" ? "estimates" : "jobs");
    };

    // Listen for the custom event that's triggered when clicking "Add Estimate" on a job card
    const handleOpenAddEstimate = (event: CustomEvent) => {
      const { jobId } = event.detail;
      console.log("Home component received openAddEstimate event with jobId:", jobId);
      
      // Set the job ID for the estimate form
      setSelectedJobId(jobId.toString());
      
      // Set state to open the modal after tab change
      setOpenAddEstimateModal(true);
      
      // Change to estimates tab
      setActiveTab("estimates");
    };
    
    // Listen for tab changes from header component
    const handleTabChange = (event: CustomEvent) => {
      const { tab } = event.detail;
      setActiveTab(tab);
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("openAddEstimate", handleOpenAddEstimate as EventListener);
    window.addEventListener("tabChange", handleTabChange as EventListener);
    
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("openAddEstimate", handleOpenAddEstimate as EventListener);
      window.removeEventListener("tabChange", handleTabChange as EventListener);
    };
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div id="tab-container">
        {/* Jobs Tab */}
        {activeTab === "jobs" && (
          <div key="jobs-tab">
            <JobsList />
          </div>
        )}
        
        {/* Estimates Tab */}
        {activeTab === "estimates" && (
          <div key="estimates-tab">
            <EstimatesList 
              initialOpenModal={openAddEstimateModal}
              initialSelectedJobId={selectedJobId} 
              resetModalState={() => {
                setOpenAddEstimateModal(false);
                setSelectedJobId(null);
              }}
            />
          </div>
        )}
      </div>
    </main>
  );
}
