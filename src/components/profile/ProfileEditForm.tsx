import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { OFFICIAL_CHURCH_UNITS } from "@/constants/churchUnits";
import { isValidPhoneNumber, formatPhoneNumber, getPhoneValidationMessage } from "@/utils/phoneValidation";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Loader2, CalendarIcon } from "lucide-react";

// Define the form schema with validation
const profileFormSchema = z.object({
  full_name: z.string().min(2, { message: "Full name must be at least 2 characters" }),
  phone: z.string().optional().refine(isValidPhoneNumber, { 
    message: getPhoneValidationMessage() 
  }),
  genotype: z.string().optional(),
  address: z.string().optional(),
  church_unit: z.string().optional(),
  assigned_pastor: z.string().optional(),
  date_of_birth: z.date().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const genotypeOptions = [
  { value: "AA", label: "AA" },
  { value: "AS", label: "AS" },
  { value: "SS", label: "SS" },
  { value: "AC", label: "AC" },
  { value: "SC", label: "SC" },
  { value: "CC", label: "CC" },
  { value: "unknown", label: "Unknown" },
];

const churchUnits = OFFICIAL_CHURCH_UNITS.map(unit => ({
  value: unit.id,
  label: unit.name
}));

export function ProfileEditForm() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pastors, setPastors] = useState<{ value: string; label: string }[]>([]);

  // Fetch pastors when the component loads
  useEffect(() => {
    const fetchPastors = async () => {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('id, fullname')
          .eq('category', 'Pastors');

        if (error) {
          console.error('Error fetching pastors:', error);
          return;
        }

        if (data) {
          setPastors(data.map(pastor => ({
            value: pastor.id,
            label: pastor.fullname
          })));
        }
      } catch (error) {
        console.error('Error fetching pastors:', error);
      }
    };

    fetchPastors();
  }, []);

  // Initialize the form with current profile values
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
      genotype: profile?.genotype || undefined,
      address: profile?.address || "",
      church_unit: profile?.church_unit || undefined,
      assigned_pastor: profile?.assigned_pastor || undefined,
      date_of_birth: profile?.date_of_birth ? new Date(profile.date_of_birth) : undefined,
    },
  });

  // Update form values when profile changes
  useEffect(() => {
    if (profile) {
      console.log("Profile data changed, updating form values:", profile);
      form.reset({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        genotype: profile.genotype || undefined,
        address: profile.address || "",
        church_unit: profile.church_unit || undefined,
        assigned_pastor: profile.assigned_pastor || undefined,
        date_of_birth: profile.date_of_birth ? new Date(profile.date_of_birth) : undefined,
      });
    }
  }, [profile, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Process form values
      const processedValues = {
        full_name: values.full_name,
        phone: formatPhoneNumber(values.phone), // Clean up phone number
        genotype: values.genotype === "none" ? null : values.genotype || null,
        address: values.address || null,
        church_unit: values.church_unit === "none" ? null : values.church_unit || null,
        assigned_pastor: values.assigned_pastor === "none" ? null : values.assigned_pastor || null,
        date_of_birth: values.date_of_birth ? values.date_of_birth.toISOString().split('T')[0] : null,
        updated_at: new Date().toISOString(),
      };

      console.log("Submitting profile update with values:", processedValues);

      // Update the profile in Supabase
      const { error } = await supabase
        .from("profiles")
        .update(processedValues)
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });

      // Force a page reload to refresh the profile data
      window.location.reload();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error.message || "An error occurred while updating your profile.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>
          Update your personal information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date_of_birth"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Birth</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="genotype"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Genotype</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your genotype" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {genotypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your address"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="church_unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Church Unit</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your church unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {churchUnits.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("church_unit") === "auxano" && (
              <FormField
                control={form.control}
                name="assigned_pastor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Pastor</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your pastor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {pastors.map((pastor) => (
                          <SelectItem key={pastor.value} value={pastor.value}>
                            {pastor.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
