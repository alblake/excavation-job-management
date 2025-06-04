import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { insertJobSchema, type Job, JobStatus } from "@shared/schema";

// Extend the job schema with frontend-specific validation
const formSchema = insertJobSchema.extend({
  name: z.string().min(1, "Job name is required"),
  location: z.string().min(1, "Location is required"),
  client: z.string().min(1, "Client name is required"),
  startDate: z.string().optional(),
  status: z.enum(["pending", "in-progress", "completed"]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddJobFormProps {
  jobToEdit?: Job;
  onComplete: () => void;
}

export default function AddJobForm({ jobToEdit, onComplete }: AddJobFormProps) {
  const { toast } = useToast();
  const isEditing = !!jobToEdit;

  // Set up form with default values
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: jobToEdit?.name || "",
      location: jobToEdit?.location || "",
      client: jobToEdit?.client || "",
      startDate: jobToEdit?.startDate || "",
      status: (jobToEdit?.status as "pending" | "in-progress" | "completed") || "pending",
      notes: jobToEdit?.notes || "",
    },
  });

  // Create or update job mutation
  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEditing && jobToEdit) {
        // Update existing job
        return await apiRequest("PUT", `/api/jobs/${jobToEdit.id}`, data);
      } else {
        // Create new job
        return await apiRequest("POST", "/api/jobs", data);
      }
    },
    onSuccess: async () => {
      // Invalidate the jobs query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      
      toast({
        title: isEditing ? "Job updated" : "Job created",
        description: isEditing ? "The job has been updated successfully" : "New job has been added successfully",
      });
      
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} job: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  function onSubmit(data: FormData) {
    mutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Main Street Pipeline" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 123 Main St, Springfield, IL" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="client"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client</FormLabel>
              <FormControl>
                <Input placeholder="e.g. City of Springfield" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional notes about the job..." 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onComplete}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={mutation.isPending}
            className="bg-primary-600 hover:bg-primary-700"
          >
            {mutation.isPending ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditing ? "Updating..." : "Saving..."}
              </>
            ) : (
              <>{isEditing ? "Update Job" : "Save Job"}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
