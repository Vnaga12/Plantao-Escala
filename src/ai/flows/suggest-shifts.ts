
// src/ai/flows/suggest-shifts.ts
'use server';

/**
 * @fileOverview AI-powered shift assignment suggestions.
 *
 * This file defines a Genkit flow to suggest optimal shift assignments
 * based on employee unavailability and preferences.
 *
 * @module src/ai/flows/suggest-shifts
 *
 * @interface SuggestShiftAssignmentsInput - Input for the suggestShiftAssignments function.
 * @interface SuggestShiftAssignmentsOutput - Output of the suggestShiftAssignments function.
 * @function suggestShiftAssignments -  A function that handles the shift assignment process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { eachDayOfInterval, format, parseISO } from 'date-fns';

const SuggestShiftAssignmentsInputSchema = z.object({
  employees: z
    .array(
      z.object({
        id: z.string().describe('Unique identifier for the employee.'),
        name: z.string().describe('Name of the employee.'),
        unavailability: z
          .array(z.object({
            day: z.string().describe('Day of the week (e.g., Monday).'),
            startTime: z.string().describe('Start time of unavailability (e.g., 09:00).'),
            endTime: z.string().describe('End time of unavailability (e.g., 17:00).'),
          }))
          .describe('Employee unavailability for the week.'),
        preferences: z
          .string()
          .describe('Employee shift preferences or constraints.'),
      })
    )
    .describe('List of employees and their unavailability and preferences.'),
  rolesToFill: z
    .array(z.string())
    .describe('List of roles that need to be filled (e.g. Doctor, Nurse).'),
  scheduleConstraints: z
    .string()
    .describe('Constraints or requirements for the overall schedule.'),
  startDate: z.string().describe('The start date for the schedule period, in YYYY-MM-DD format.'),
  endDate: z.string().describe('The end date for the schedule period, in YYYY-MM-DD format.'),
});

export type SuggestShiftAssignmentsInput = z.infer<typeof SuggestShiftAssignmentsInputSchema>;

const SuggestShiftAssignmentsOutputSchema = z.object({
  assignments: z
    .array(
      z.object({
        employeeId: z.string().describe('The ID of the employee assigned to the shift.'),
        shiftDate: z.string().describe('The date of the assigned shift in YYYY-MM-DD format.'),
        shiftStartTime: z.string().describe('Start time of the assigned shift.'),
        shiftEndTime: z.string().describe('End time of the assigned shift.'),
        role: z.string().describe('The role that the employee will fulfill'),
      })
    )
    .describe('List of suggested shift assignments.'),
  summary: z.string().describe('A summary of the shift assignment process, in Portuguese.'),
});

export type SuggestShiftAssignmentsOutput = z.infer<typeof SuggestShiftAssignmentsOutputSchema>;

export async function suggestShiftAssignments(input: SuggestShiftAssignmentsInput): Promise<SuggestShiftAssignmentsOutput> {
  return suggestShiftAssignmentsFlow(input);
}

const suggestShiftAssignmentsPrompt = ai.definePrompt({
  name: 'suggestShiftAssignmentsPrompt',
  input: {schema: z.object({
      employees: z.string(),
      shifts: z.string(),
      scheduleConstraints: z.string(),
  })},
  output: {schema: SuggestShiftAssignmentsOutputSchema},
  prompt: `Você é um assistente de IA que ajuda a criar atribuições de turno ideais para uma equipe médica. A resposta deve ser em português.

  Com base na indisponibilidade dos funcionários, preferências, requisitos de turno e restrições de horário, sugira atribuições de turno. Os períodos de indisponibilidade são bloqueios e nenhum turno deve ser atribuído a um funcionário durante esses horários.

  Funcionários (incluindo indisponibilidades): {{{employees}}}
  Turnos a serem preenchidos: {{{shifts}}}
  Restrições de Horário: {{{scheduleConstraints}}}

  Considere as preferências dos funcionários e a justiça ao fazer as atribuições.
  Retorne as atribuições de turno como um objeto JSON. A data do turno (shiftDate) DEVE ser no formato YYYY-MM-DD.
  Certifique-se de que sua resposta corresponda exatamente ao esquema de saída, incluindo todos os campos.
  Pense passo a passo e explique seu raciocínio no resumo.
  IMPORTANTE: O resumo deve estar em português.
  `,
  config: {
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

    const allDates = eachDayOfInterval({
        start: parseISO(input.startDate),
        end: parseISO(input.endDate),
    });

    const shiftsToFill = allDates.flatMap(date =>
        input.rolesToFill.map(role => ({
            date: format(date, 'yyyy-MM-dd'),
            startTime: '09:00', // Default, can be adjusted or made configurable
            endTime: '17:00', // Default
            role: role
        }))
    );

    const {output} = await suggestShiftAssignmentsPrompt({
        employees: JSON.stringify(input.employees),
        shifts: JSON.stringify(shiftsToFill),
        scheduleConstraints: input.scheduleConstraints,
    });
    return output!;
  }
);
