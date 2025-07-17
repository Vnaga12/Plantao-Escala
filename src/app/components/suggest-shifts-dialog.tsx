
"use client";

import * as React from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import type { Employee, EmployeeAvailability } from "@/lib/types";
import { getShiftSuggestions } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Trash2, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { SuggestShiftAssignmentsInput, SuggestShiftAssignmentsOutput } from "@/ai/flows/suggest-shifts";
import { ScrollArea } from "@/components/ui/scroll-area";

type SuggestShiftsDialogProps = {
  employees: Employee[];
  onApplySuggestions: (suggestions: SuggestShiftAssignmentsOutput['assignments']) => void;
};

type FormValues = SuggestShiftAssignmentsInput;

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function SuggestShiftsDialog({ employees: initialEmployees, onApplySuggestions }: SuggestShiftsDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<SuggestShiftAssignmentsOutput | null>(null);
  const { toast } = useToast();

  const { register, control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      employees: initialEmployees,
      shifts: [{ day: "Monday", startTime: "09:00", endTime: "17:00", role: "Doctor" }],
      scheduleConstraints: "Ensure at least one doctor is on call at all times. No employee should work more than 40 hours a week.",
    },
  });

  const {
    fields: employeeFields,
    append: appendEmployee,
    remove: removeEmployee,
  } = useFieldArray({ control, name: "employees" });
  
  const {
    fields: shiftFields,
    append: appendShift,
    remove: removeShift,
  } = useFieldArray({ control, name: "shifts" });

  const handleFormSubmit = async (data: FormValues) => {
    setIsPending(true);
    setSuggestions(null);
    const result = await getShiftSuggestions(data);
    setIsPending(false);

    if (result.success && result.data) {
      setSuggestions(result.data);
      toast({
        title: "Suggestions Ready",
        description: "AI has generated shift suggestions.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    }
  };
  
  const handleApply = () => {
    if (suggestions) {
      onApplySuggestions(suggestions.assignments);
      setIsOpen(false);
      setSuggestions(null);
    }
  };

  const EmployeeFormFields = ({ index, control, register }: { index: number; control: any; register: any }) => {
    const { fields, append, remove } = useFieldArray({
      control,
      name: `employees.${index}.availability`,
    });
  
    return (
      <div className="mt-4 space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-medium">Availability</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => append({ day: 'Monday', startTime: '09:00', endTime: '17:00' })}
          >
            <Plus className="mr-2 h-3 w-3" /> Add
          </Button>
        </div>
        <div className="space-y-2 pl-2">
          {fields.map((item, k) => (
            <div key={item.id} className="grid grid-cols-4 items-center gap-2">
                <Controller
                  control={control}
                  name={`employees.${index}.availability.${k}.day`}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="col-span-2"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {weekdays.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              <Input type="time" {...register(`employees.${index}.availability.${k}.startTime`)} />
              <div className="flex items-center gap-1">
                <Input type="time" {...register(`employees.${index}.availability.${k}.endTime`)} />
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(k)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {fields.length === 0 && <p className="text-xs text-muted-foreground pt-2">No availability specified.</p>}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Sparkles />
          Suggest Shifts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>AI-Powered Shift Suggestions</DialogTitle>
          <DialogDescription>
            Define your team and required shifts, and let AI build the optimal schedule.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 overflow-y-auto">
          <Tabs defaultValue="employees" className="h-full flex flex-col">
            <TabsList className="flex-shrink-0">
              <TabsTrigger value="employees">Employees</TabsTrigger>
              <TabsTrigger value="shifts">Shifts to Fill</TabsTrigger>
              <TabsTrigger value="constraints">Constraints</TabsTrigger>
              {suggestions && <TabsTrigger value="suggestions">Suggestions</TabsTrigger>}
            </TabsList>
            <ScrollArea className="flex-1 p-1">
              <TabsContent value="employees" className="mt-2">
                  {employeeFields.map((field, index) => (
                      <div key={field.id} className="p-4 border rounded-lg mb-4 bg-background">
                          <div className="flex justify-between items-center mb-2">
                             <Label className="font-semibold">Employee #{index + 1}</Label>
                             <Button type="button" variant="ghost" size="icon" onClick={() => removeEmployee(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                          </div>
                          <Input {...register(`employees.${index}.name`)} placeholder="Name" className="mb-2" />
                          <Textarea {...register(`employees.${index}.preferences`)} placeholder="Preferences (e.g., prefers morning shifts)" />
                          <EmployeeFormFields index={index} control={control} register={register} />
                      </div>
                  ))}
                  <Button type="button" variant="outline" onClick={() => appendEmployee({ id: Date.now().toString(), name: '', availability: [], preferences: '' })}>
                      <Plus className="mr-2 h-4 w-4" /> Add Employee
                  </Button>
              </TabsContent>
              <TabsContent value="shifts" className="mt-2">
                  {shiftFields.map((field, index) => (
                      <div key={field.id} className="p-4 border rounded-lg mb-4 grid grid-cols-1 md:grid-cols-4 gap-2 bg-background">
                           <Controller
                              control={control}
                              name={`shifts.${index}.day`}
                              render={({ field }) => (
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                                  <SelectContent>
                                    {weekdays.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                                  </SelectContent>
                                  </Select>
                              )}
                          />
                          <Input {...register(`shifts.${index}.startTime`)} type="time" />
                          <Input {...register(`shifts.${index}.endTime`)} type="time" />
                          <div className="flex items-center gap-2">
                            <Controller
                                control={control}
                                name={`shifts.${index}.role`}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Doctor">Doctor</SelectItem>
                                        <SelectItem value="Nurse">Nurse</SelectItem>
                                        <SelectItem value="Technician">Technician</SelectItem>
                                    </SelectContent>
                                    </Select>
                                )}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeShift(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                          </div>
                      </div>
                  ))}
                  <Button type="button" variant="outline" onClick={() => appendShift({ day: 'Tuesday', startTime: '09:00', endTime: '17:00', role: 'Nurse' })}>
                      <Plus className="mr-2 h-4 w-4" /> Add Shift
                  </Button>
              </TabsContent>
              <TabsContent value="constraints" className="mt-2">
                 <Textarea {...register('scheduleConstraints')} rows={10} placeholder="e.g. Ensure fairness in weekend shifts." />
              </TabsContent>
              <TabsContent value="suggestions" className="mt-2">
                  {isPending && <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin mr-2"/> Generating...</div>}
                  {suggestions && (
                      <div className="bg-background rounded-lg p-4">
                          <h3 className="font-bold mb-2 text-lg">AI Summary & Rationale</h3>
                          <p className="text-sm bg-muted p-3 rounded-md mb-4">{suggestions.summary}</p>
                          <h3 className="font-bold mb-2 text-lg">Suggested Assignments</h3>
                          <div className="space-y-2">
                          {suggestions.assignments.map((a, i) => (
                              <div key={i} className="text-sm p-3 border rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white">
                                  <span className="font-semibold">{initialEmployees.find(e => e.id === a.employeeId)?.name}</span>
                                  <span>{a.role} on {a.shiftDay}</span>
                                  <span className="font-mono">{a.shiftStartTime} - {a.shiftEndTime}</span>
                              </div>
                          ))}
                          </div>
                      </div>
                  )}
              </TabsContent>
            </ScrollArea>
            <div className="mt-auto pt-4 border-t flex justify-end gap-2 flex-shrink-0">
              {suggestions ? (
                 <Button type="button" onClick={handleApply}>Apply to Calendar</Button>
              ) : (
                <Button type="submit" disabled={isPending}>
                  {isPending ? <><Loader2 className="animate-spin mr-2"/> Thinking...</> : "Generate Suggestions"}
                </Button>
              )}
            </div>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
}
