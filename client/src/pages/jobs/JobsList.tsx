import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { DialogContent, DialogFooter, Dialog, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Search } from "lucide-react";
import JobCard from "@/pages/jobs/JobCard";
import AddJobForm from "@/pages/jobs/AddJobForm";
import { queryClient } from "@/lib/queryClient";
import type { Job } from "@shared/schema";

export default function JobsList() {
  const { toast } = useToast();
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");

  // Fetch jobs from the API
  const { data: jobs = [], isLoading, isError } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete job');
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({
        title: "Job deleted",
        description: "The job has been successfully deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete job: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Filter and sort jobs
  const filteredJobs = jobs
    .filter(job => {
      // Apply search filter
      const matchesSearch = searchTerm === "" || 
        job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.client.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Apply status filter
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort based on user selection
      switch (sortBy) {
        case "date-desc":
          // Using string comparison for dates since they're stored as strings
          return (b.startDate || "").localeCompare(a.startDate || "");
        case "date-asc":
          return (a.startDate || "").localeCompare(b.startDate || "");
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

  const handleDeleteJob = (jobId: number) => {
    if (window.confirm("Are you sure you want to delete this job? This will also delete all associated estimates.")) {
      deleteJobMutation.mutate(jobId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Jobs Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Excavation Jobs</h2>
        <Dialog open={isAddJobOpen} onOpenChange={setIsAddJobOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              Add New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogTitle>Add New Job</DialogTitle>
            <AddJobForm onComplete={() => setIsAddJobOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Job Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <label htmlFor="search-jobs" className="block text-sm font-medium text-gray-700 mb-1">
              Search Jobs
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                id="search-jobs"
                placeholder="Search by job name or location..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="w-full md:w-1/4">
            <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="filter-status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-1/4">
            <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger id="sort-by">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin h-10 w-10 rounded-full border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      ) : isError ? (
        <div className="text-center py-10 text-red-600">
          <p>Failed to load jobs. Please try again later.</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-600">No jobs found. Create your first job to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onDelete={() => handleDeleteJob(job.id)}
              setAddEstimateOpen={() => {
                // Dispatch a custom event with the job ID
                const event = new CustomEvent('openAddEstimate', { 
                  detail: { jobId: job.id } 
                });
                window.dispatchEvent(event);
                
                // Switch to estimates tab
                const tabEvent = new CustomEvent('tabChange', { 
                  detail: { tab: 'estimates' } 
                });
                window.dispatchEvent(tabEvent);
                
                // Update URL
                window.history.replaceState(null, "", "/?tab=estimates");
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
