// src/ai/flows/suggest-shifts.ts
'use server';

/**
 * @fileOverview AI-powered shift assignment suggestions.
 *
 * This file defines a Genkit flow to suggest optimal shift assignments
 * based on employee availability and preferences.
 *
 * @module src/ai/flows/suggest-shifts
 *
 * @interface SuggestShiftAssignmentsInput - Input for the suggestShiftAssignments function.
 * @interface SuggestShiftAssignmentsOutput - Output of the suggestShiftAssignments function.
 * @function suggestShiftAssignments -  A function that handles the shift assignment process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestShiftAssignmentsInputSchema = z.object({
  employees: z
    .array(
      z.object({
        id: z.string().describe('Unique identifier for the employee.'),
        name: z.string().describe('Name of the employee.'),
        availability: z
          .array(z.object({
            day: z.string().describe('Day of the week (e.g., Monday).'),
            startTime: z.string().describe('Start time of availability (e.g., 09:00).'),
            endTime: z.string().describe('End time of availability (e.g., 17:00).'),
          }))
          .describe('Employee availability for the week.'),
        preferences: z
          .string()
          .describe('Employee shift preferences or constraints.'),
      })
    )
    .describe('List of employees and their availability and preferences.'),
  shifts: z
    .array(
      z.object({
        day: z.string().describe('Day of the week for the shift.'),
        startTime: z.string().describe('Start time of the shift (e.g., 09:00).'),
        endTime: z.string().describe('End time of the shift (e.g., 17:00).'),
        role: z.string().describe('The role that needs to be filled for the shift (e.g. Doctor, Nurse)'),
      })
    )
    .describe('List of shifts that need to be filled.'),
  scheduleConstraints: z
    .string()
    .describe('Constraints or requirements for the overall schedule.'),
});

export type SuggestShiftAssignmentsInput = z.infer<typeof SuggestShiftAssignmentsInputSchema>;

const SuggestShiftAssignmentsOutputSchema = z.object({
  assignments: z
    .array(
      z.object({
        employeeId: z.string().describe('The ID of the employee assigned to the shift.'),
        shiftDay: z.string().describe('Day of the week for the assigned shift.'),
        shiftStartTime: z.string().describe('Start time of the assigned shift.'),
        shiftEndTime: z.string().describe('End time of the assigned shift.'),
        role: z.string().describe('The role that the employee will fulfill'),
      })
    )
    .describe('List of suggested shift assignments.'),
  summary: z.string().describe('A summary of the shift assignment process.'),
});

export type SuggestShiftAssignmentsOutput = z.infer<typeof SuggestShiftAssignmentsOutputSchema>;

export async function suggestShiftAssignments(input: SuggestShiftAssignmentsInput): Promise<SuggestShiftAssignmentsOutput> {
  return suggestShiftAssignmentsFlow(input);
}

const suggestShiftAssignmentsPrompt = ai.definePrompt({
  name: 'suggestShiftAssignmentsPrompt',
  input: {schema: SuggestShiftAssignmentsInputSchema},
  output: {schema: SuggestShiftAssignmentsOutputSchema},
  prompt: `You are an AI assistant helping to create optimal shift assignments for a medical team.

  Based on the employee availability, preferences, shift requirements, and schedule constraints, suggest shift assignments.

  Employees: {{JSON.stringify(employees)}}
  Shifts: {{JSON.stringify(shifts)}}
  Schedule Constraints: {{{scheduleConstraints}}}

  Consider employee preferences and fairness when making assignments.
  Return the shift assignments as a JSON object.
  Ensure that your response matches the output schema exactly, including all fields.
  Think step by step, and explain your reasoning in the summary.
  `,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const suggestShiftAssignmentsFlow = ai.defineFlow(
  {
    name: 'suggestShiftAssignmentsFlow',
    inputSchema: SuggestShiftAssignmentsInputSchema,
    outputSchema: SuggestShiftAssignmentsOutputSchema,
  },
  async input => {
    const {output} = await suggestShiftAssignmentsPrompt(input);
    return output!;
  }
);

