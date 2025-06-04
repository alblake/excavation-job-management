import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Pencil, FileSpreadsheet, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import AddJobForm from "./AddJobForm";
import type { Job, Estimate } from "@shared/schema";

interface JobCardProps {
  job: Job;
  onDelete: () => void;
  setAddEstimateOpen: () => void;
}

export default function JobCard({ job, onDelete, setAddEstimateOpen }: JobCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  // Fetch estimates count for this job
  const { data: estimates = [] } = useQuery<Estimate[]>({
    queryKey: ['/api/estimates', job.id],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`/api/estimates?jobId=${queryKey[1]}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch estimates');
      }
      return response.json();
    }
  });

  // Format the job status for display
  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case 'pending': return 'pending';
      case 'in-progress': return 'inProgress';
      case 'completed': return 'completed';
      default: return 'default';
    }
  };

  // Format the date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Pending';
    
    try {
      // Try to parse the date and format it
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: '2-digit',
        day: '2-digit', 
        year: 'numeric'
      }).format(date);
    } catch (e) {
      // If parsing fails, return the original string
      return dateString;
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold text-gray-900">{job.name}</h3>
            <Badge variant={getStatusBadgeVariant(job.status)}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1).replace('-', ' ')}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">{job.location}</p>
        </div>
        <div className="p-4">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-gray-500">Client:</span>
            <span className="font-medium text-gray-900">{job.client}</span>
          </div>
          <div className="flex justify-between text-sm mb-3">
            <span className="text-gray-500">Start Date:</span>
            <span className="font-medium text-gray-900">{formatDate(job.startDate)}</span>
          </div>
          <div className="flex justify-between text-sm mb-3">
            <span className="text-gray-500">Estimates:</span>
            <span className="font-medium text-gray-900">{estimates.length}</span>
          </div>
          {job.notes && (
            <div className="text-sm mb-3">
              <span className="text-gray-500">Notes:</span>
              <p className="text-gray-700 mt-1 text-xs">{job.notes}</p>
            </div>
          )}
          <div className="mt-4 flex justify-end space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs" 
              onClick={() => setIsEditModalOpen(true)}
            >
              <Pencil className="h-3 w-3 mr-1" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </Button>
            <Button
              variant="default"
              size="sm"
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
              onClick={setAddEstimateOpen}
            >
              <FileSpreadsheet className="h-3 w-3 mr-1" /> Add Estimate
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Job Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogTitle>Edit Job</DialogTitle>
          <AddJobForm 
            jobToEdit={job} 
            onComplete={() => setIsEditModalOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
