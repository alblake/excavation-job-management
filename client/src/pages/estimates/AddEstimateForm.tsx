import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import VolumeCalculator from "@/components/estimate-calculator/VolumeCalculator";
import LaborCalculator from "@/components/estimate-calculator/LaborCalculator";
import { 
  estimateValidationSchema, 
  calculateCubicYards, 
  type Job, 
  type Estimate 
} from "@shared/schema";

// Create a form schema with validation
const formSchema = z.object({
  jobId: z.string().min(1, "Please select a job"),
  description: z.string().optional(),
  pipeLength: z.union([
    z.number().positive(),
    z.string().min(1, "Pipe length is required").transform(val => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    })
  ]),
  trenchWidth: z.union([
    z.number().positive(),
    z.string().min(1, "Trench width is required").transform(val => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    })
  ]),
  trenchDepth: z.union([
    z.number().positive(),
    z.string().min(1, "Trench depth is required").transform(val => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    })
  ]),
  materialWeight: z.union([
    z.number().positive(),
    z.string().min(1, "Material weight is required").transform(val => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 145 : parsed;
    })
  ]),
  importUnitCost: z.union([
    z.number().positive(),
    z.string().min(1, "Import unit cost is required").transform(val => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 24.50 : parsed;
    })
  ]),
  estimatedHours: z.union([
    z.number().min(0),
    z.string().transform(val => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    })
  ]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddEstimateFormProps {
  onComplete: () => void;
  preselectedJobId?: string;
  estimateToEdit?: Estimate | null;
}

export default function AddEstimateForm({ 
  onComplete, 
  preselectedJobId = "",
  estimateToEdit = null 
}: AddEstimateFormProps) {
  const { toast } = useToast();
  const isEditing = !!estimateToEdit;

  // Fetch jobs for dropdown
  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
  });

  // Set up form with default values
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobId: estimateToEdit ? estimateToEdit.jobId.toString() : preselectedJobId,
      description: estimateToEdit?.description || "",
      pipeLength: estimateToEdit ? estimateToEdit.pipeLength.toString() : "",
      trenchWidth: estimateToEdit ? estimateToEdit.trenchWidth.toString() : "",
      trenchDepth: estimateToEdit ? estimateToEdit.trenchDepth.toString() : "",
      materialWeight: estimateToEdit ? estimateToEdit.materialWeight?.toString() : "145", // Default to 145 if not set
      importUnitCost: estimateToEdit?.importUnitCost?.toString() || "24.50", // Default to $24.50 if not set
      estimatedHours: estimateToEdit?.estimatedHours?.toString() || "0", // Default to 0 if not set
      notes: estimateToEdit?.notes || "",
    },
  });

  // Watch form values for volume calculation
  const pipeLength = form.watch("pipeLength");
  const trenchWidth = form.watch("trenchWidth");
  const trenchDepth = form.watch("trenchDepth");
  const materialWeight = form.watch("materialWeight");
  const importUnitCost = form.watch("importUnitCost");
  const estimatedHours = form.watch("estimatedHours");

  // Calculate cubic feet and cubic yards
  const calculateVolume = () => {
    if (!pipeLength || !trenchWidth || !trenchDepth) {
      return { cubicFeet: 0, cubicYards: 0 };
    }

    const length = parseFloat(pipeLength.toString());
    const width = parseFloat(trenchWidth.toString());
    const depth = parseFloat(trenchDepth.toString());

    if (isNaN(length) || isNaN(width) || isNaN(depth)) {
      return { cubicFeet: 0, cubicYards: 0 };
    }

    const cubicFeet = length * width * depth;
    const cubicYards = calculateCubicYards(length, width, depth);

    return { cubicFeet, cubicYards };
  };

  const { cubicFeet, cubicYards } = calculateVolume();

  // Create or update estimate mutation
  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Transform data to match API expectations
      const apiData = {
        jobId: parseInt(data.jobId),
        description: data.description,
        pipeLength: data.pipeLength,
        trenchWidth: data.trenchWidth,
        trenchDepth: data.trenchDepth,
        materialWeight: data.materialWeight, // Include material weight
        importUnitCost: data.importUnitCost, // Include import unit cost
        estimatedHours: data.estimatedHours, // Include estimated hours for labor
        cubicYards: calculateCubicYards(data.pipeLength, data.trenchWidth, data.trenchDepth),
        notes: data.notes,
      };

      if (isEditing && estimateToEdit) {
        // Update existing estimate
        return await apiRequest("PUT", `/api/estimates/${estimateToEdit.id}`, apiData);
      } else {
        // Create new estimate
        return await apiRequest("POST", "/api/estimates", apiData);
      }
    },
    onSuccess: async () => {
      // Invalidate queries to refresh the lists
      queryClient.invalidateQueries({ queryKey: ['/api/estimates'] });
      
      toast({
        title: isEditing ? "Estimate updated" : "Estimate created",
        description: isEditing ? "The estimate has been updated successfully" : "New estimate has been added successfully",
      });
      
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} estimate: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
          name="jobId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a job" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id.toString()}>{job.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. North section estimate" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Excavation Dimensions</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="pipeLength"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pipe Length (ft)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      placeholder="0" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trenchWidth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trench Width (ft)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1" 
                      min="0"
                      placeholder="0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trenchDepth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trench Depth (ft)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1" 
                      min="0"
                      placeholder="0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Material Weight Field */}
          <FormField
            control={form.control}
            name="materialWeight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Material Weight (pounds per cubic foot)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="1" 
                    min="0"
                    placeholder="145"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Import Unit Cost Field */}
          <FormField
            control={form.control}
            name="importUnitCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Import: Unit Cost ($)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    placeholder="24.50"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <VolumeCalculator 
            cubicFeet={cubicFeet}
            cubicYards={cubicYards}
            materialWeight={materialWeight ? parseFloat(materialWeight.toString()) : 145}
            importUnitCost={importUnitCost ? parseFloat(importUnitCost.toString()) : 24.50}
          />
        </div>

        {/* Labor Section */}
        <div className="space-y-4 mt-6 p-6 border rounded-lg bg-gray-50">
          <h3 className="text-xl font-bold mb-4">Labor</h3>
          
          <FormField
            control={form.control}
            name="estimatedHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Hours</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.5" 
                    min="0"
                    placeholder="0"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <LaborCalculator 
            estimatedHours={estimatedHours ? parseFloat(estimatedHours.toString()) : 0}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional notes about the estimate..."
                  className="resize-none"
                  rows={2}
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
              <>{isEditing ? "Update Estimate" : "Save Estimate"}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
