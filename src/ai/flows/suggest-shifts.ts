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
import { googleAI } from '@genkit-ai/googleai';

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
  calendars: z.array(z.object({
      id: z.string(),
      name: z.string(),
  })).describe("The calendars/teams for which to generate shifts."),
  allowedDays: z.array(z.string()).optional().describe("Array of weekday strings (e.g., ['Monday', 'Tuesday']) on which shifts can be scheduled."),
});

export type SuggestShiftAssignmentsInput = z.infer<typeof SuggestShiftAssignmentsInputSchema>;

const SuggestShiftAssignmentsOutputSchema = z.object({
  assignments: z
    .array(
      z.object({
        employeeId: z.string().describe('The ID of the employee assigned to the shift. This ID must be one of the employee IDs provided in the input.'),
        shiftDate: z.string().describe('The date of the assigned shift in YYYY-MM-DD format.'),
        shiftStartTime: z.string().describe('Start time of the assigned shift.'),
        shiftEndTime: z.string().describe('End time of the assigned shift.'),
        role: z.string().describe('The role that the employee will fulfill'),
        calendarId: z.string().describe("The ID of the calendar/team this shift belongs to. Must be one of the IDs from the input."),
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
      rolesToFill: z.string(),
      scheduleConstraints: z.string(),
      calendars: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      allowedDays: z.string(),
  })},
  output: {schema: SuggestShiftAssignmentsOutputSchema},
  prompt: `Você é um assistente de IA especialista em criar escalas de trabalho para equipes médicas. Sua resposta deve ser em português.

  Sua tarefa principal é atribuir plantões aos funcionários, seguindo uma regra obrigatória e as restrições fornecidas.

  **REGRA OBRIGATÓRIA:** Para cada função na lista 'Funções a Preencher', você DEVE atribuir exatamente UM plantão dessa função a CADA funcionário da lista. Não crie mais ou menos plantões do que o necessário para cumprir esta regra.

  **Período da Escala:** Os plantões devem ser distribuídos entre as seguintes datas: {{{startDate}}} e {{{endDate}}}.
  **DIAS OBRIGATÓRIOS:** Os plantões SÓ PODEM ser agendados nos seguintes dias da semana: {{{allowedDays}}}. NENHUM plantão pode ser criado fora desses dias.
  **Turmas:** {{{calendars}}}
  **Funcionários (incluindo indisponibilidades e preferências):** {{{employees}}}
  **Funções a Preencher:** {{{rolesToFill}}}
  **Restrições Adicionais:** {{{scheduleConstraints}}}

  Ao fazer as atribuições, considere:
  1.  A indisponibilidade dos funcionários é um bloqueio total. Nenhum plantão deve ser atribuído a um funcionário durante esses horários.
  2.  As preferências dos funcionários e a distribuição justa dos plantões ao longo do período.
  3.  Para cada atribuição, você DEVE especificar o 'calendarId' correspondente à turma em que o plantão foi alocado.
  4.  O campo 'employeeId' DEVE ser um dos IDs fornecidos na lista de funcionários de entrada. Não invente novos IDs.
  5.  A data do plantão (shiftDate) DEVE estar no formato YYYY-MM-DD e dentro do período especificado.

  Pense passo a passo, explique seu raciocínio no resumo e certifique-se de que sua resposta corresponda exatamente ao esquema de saída.
  IMPORTANTE: O resumo deve estar em português.
  `,
  config: {
    model: googleAI('gemini-1.5-flash-latest'),
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
    const constraints = [input.scheduleConstraints];

    const {output} = await suggestShiftAssignmentsPrompt({
        employees: JSON.stringify(input.employees),
        rolesToFill: JSON.stringify(input.rolesToFill),
        scheduleConstraints: constraints.join(' '),
        calendars: JSON.stringify(input.calendars),
        startDate: input.startDate,
        endDate: input.endDate,
        allowedDays: (input.allowedDays || ['Qualquer dia']).join(', '),
    });
    return output!;
  }
);
