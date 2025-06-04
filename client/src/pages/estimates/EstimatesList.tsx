import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Edit, Trash2 } from "lucide-react";
import AddEstimateForm from "@/pages/estimates/AddEstimateForm";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import type { Estimate, Job } from "@shared/schema";

interface EstimatesListProps {
  initialOpenModal?: boolean;
  initialSelectedJobId?: string | null;
  resetModalState?: () => void;
}

export default function EstimatesList({ 
  initialOpenModal = false, 
  initialSelectedJobId = null,
  resetModalState
}: EstimatesListProps) {
  const { toast } = useToast();
  const [isAddEstimateOpen, setIsAddEstimateOpen] = useState(initialOpenModal);
  const [selectedJobId, setSelectedJobId] = useState<string>(initialSelectedJobId || "all");
  const [dateFilter, setDateFilter] = useState("all-time");
  const [sortBy, setSortBy] = useState("date-desc");
  const [estimateToEdit, setEstimateToEdit] = useState<Estimate | null>(null);

  // Fetch all jobs for the job filter dropdown
  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
  });

  // Fetch all estimates
  const { data: estimates = [], isLoading, isError } = useQuery<Estimate[]>({
    queryKey: ['/api/estimates'],
  });

  // Delete estimate mutation
  const deleteEstimateMutation = useMutation({
    mutationFn: async (estimateId: number) => {
      await apiRequest("DELETE", `/api/estimates/${estimateId}`);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/estimates'] });
      toast({
        title: "Estimate deleted",
        description: "The estimate has been successfully deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete estimate: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  // Handle initialOpenModal prop changes
  useEffect(() => {
    if (initialOpenModal) {
      setIsAddEstimateOpen(true);
      
      // Reset the state in parent component after we've opened the modal
      if (resetModalState) {
        setTimeout(() => {
          resetModalState();
        }, 100);
      }
    }
  }, [initialOpenModal, resetModalState]);
  
  // Handle initialSelectedJobId prop changes
  useEffect(() => {
    if (initialSelectedJobId) {
      setSelectedJobId(initialSelectedJobId);
    }
  }, [initialSelectedJobId]);

  // Listen for "openAddEstimate" event from JobCard (for backward compatibility)
  useEffect(() => {
    const handleOpenAddEstimate = (event: CustomEvent) => {
      const { jobId } = event.detail;
      console.log("openAddEstimate event received with jobId:", jobId);
      
      // First set the selected job ID
      setSelectedJobId(jobId.toString());
      
      // Clear any existing estimate to edit
      setEstimateToEdit(null);
      
      // Finally open the dialog
      setIsAddEstimateOpen(true);
    };

    window.addEventListener('openAddEstimate', handleOpenAddEstimate as EventListener);
    
    return () => {
      window.removeEventListener('openAddEstimate', handleOpenAddEstimate as EventListener);
    };
  }, []);

  // Filter estimates based on job and date
  const filteredEstimates = estimates
    .filter(estimate => {
      // Apply job filter
      const jobFilter = selectedJobId === "all" || (selectedJobId && estimate.jobId === parseInt(selectedJobId));
      
      // Apply date filter
      let dateFilterPass = true;
      if (dateFilter !== "all-time" && estimate.createdAt) {
        const createdDate = new Date(estimate.createdAt);
        const now = new Date();
        
        switch (dateFilter) {
          case "last-week":
            const lastWeek = new Date(now);
            lastWeek.setDate(now.getDate() - 7);
            dateFilterPass = createdDate >= lastWeek;
            break;
          case "last-month":
            const lastMonth = new Date(now);
            lastMonth.setMonth(now.getMonth() - 1);
            dateFilterPass = createdDate >= lastMonth;
            break;
          case "last-quarter":
            const lastQuarter = new Date(now);
            lastQuarter.setMonth(now.getMonth() - 3);
            dateFilterPass = createdDate >= lastQuarter;
            break;
        }
      }
      
      return jobFilter && dateFilterPass;
    })
    .sort((a, b) => {
      // Sort based on selected sort option
      switch (sortBy) {
        case "date-desc":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "date-asc":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "volume-desc":
          return b.cubicYards - a.cubicYards;
        case "volume-asc":
          return a.cubicYards - b.cubicYards;
        default:
          return 0;
      }
    });

  // Get job name by ID
  const getJobName = (jobId: number) => {
    const job = jobs.find(job => job.id === jobId);
    return job ? job.name : "Unknown Job";
  };

  // Format date
  const formatDate = (dateString: Date | string | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const handleEditEstimate = (estimate: Estimate) => {
    setEstimateToEdit(estimate);
    setIsAddEstimateOpen(true);
  };

  const handleDeleteEstimate = (estimateId: number) => {
    if (window.confirm("Are you sure you want to delete this estimate?")) {
      deleteEstimateMutation.mutate(estimateId);
    }
  };

  const handleCloseModal = () => {
    setIsAddEstimateOpen(false);
    setEstimateToEdit(null);
  };

  return (
    <div className="space-y-6">
      {/* Estimates Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Excavation Estimates</h2>
        <Dialog open={isAddEstimateOpen} onOpenChange={setIsAddEstimateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              Add New Estimate
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
            <DialogTitle>{estimateToEdit ? "Edit Estimate" : "Add New Estimate"}</DialogTitle>
            <AddEstimateForm 
              onComplete={handleCloseModal} 
              preselectedJobId={selectedJobId}
              estimateToEdit={estimateToEdit}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Estimate Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <label htmlFor="job-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Job
            </label>
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger id="job-filter">
                <SelectValue placeholder="All Jobs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id.toString()}>{job.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-1/4">
            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger id="date-filter">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-time">All Time</SelectItem>
                <SelectItem value="last-week">Last Week</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="last-quarter">Last Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-1/4">
            <label htmlFor="sort-estimates" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger id="sort-estimates">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                <SelectItem value="volume-desc">Volume (Highest First)</SelectItem>
                <SelectItem value="volume-asc">Volume (Lowest First)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Estimates List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-10">
            <div className="animate-spin h-10 w-10 rounded-full border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading estimates...</p>
          </div>
        ) : isError ? (
          <div className="text-center py-10 text-red-600">
            <p>Failed to load estimates. Please try again later.</p>
          </div>
        ) : filteredEstimates.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-600">No estimates found. Add your first estimate to get started!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DESC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pipe Length (ft)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trench Width (ft)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trench Depth (ft)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume (cu. yds)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEstimates.map((estimate) => (
                  <tr key={estimate.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getJobName(estimate.jobId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {estimate.description || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {estimate.createdAt ? formatDate(estimate.createdAt) : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {estimate.pipeLength}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {estimate.trenchWidth}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {estimate.trenchDepth}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {estimate.cubicYards}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-primary-600 hover:text-primary-900 hover:bg-primary-50 p-1"
                          onClick={() => handleEditEstimate(estimate)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1"
                          onClick={() => handleDeleteEstimate(estimate.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
