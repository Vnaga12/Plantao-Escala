
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

const EmployeeSchema = z.object({
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
});

const CalendarSchema = z.object({
    id: z.string(),
    name: z.string(),
});

const SuggestShiftAssignmentsInputSchema = z.object({
  employees: z.array(EmployeeSchema).describe('List of all employees to be scheduled.'),
  rolesToFill: z
    .array(z.string())
    .describe('List of roles that need to be filled (e.g. Doctor, Nurse).'),
  scheduleConstraints: z
    .string()
    .describe('Constraints or requirements for the overall schedule.'),
  startDate: z.string().describe('The start date for the schedule period, in YYYY-MM-DD format.'),
  endDate: z.string().describe('The end date for the schedule period, in YYYY-MM-DD format.'),
  calendars: z.array(CalendarSchema).describe("The calendars/teams for which to generate shifts."),
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
  input: {schema: SuggestShiftAssignmentsInputSchema},
  output: {schema: SuggestShiftAssignmentsOutputSchema},
  prompt: `Você é um assistente de IA especialista em criar escalas de trabalho para equipes médicas. Sua resposta deve ser em português.

Sua tarefa é gerar uma lista de atribuições de plantão com base nas regras e dados fornecidos. Pense passo a passo para garantir que todas as regras sejam cumpridas.

**Passo 1: Entenda a Meta Principal**
A meta é criar uma escala onde CADA funcionário listado receba exatamente UM plantão para CADA uma das funções especificadas.

**Passo 2: Calcule o Total de Plantões**
- Número de Funcionários: {{employees.length}}
- Número de Funções a Preencher: {{rolesToFill.length}}
- Total de Plantões a Criar: (Funcionários * Funções) = {{employees.length}} * {{rolesToFill.length}}

Sua saída DEVE conter exatamente esse número total de plantões.

**Passo 3: Use as Informações e Siga as Regras**

**REGRA OBRIGATÓRIA 1: ATRIBUIÇÃO COMPLETA**
- Você DEVE garantir que CADA funcionário da lista receba exatamente UM plantão para CADA função listada em 'Funções a Preencher'. Sem exceções. Todos os funcionários devem ser incluídos.

**REGRA OBRIGATÓRIA 2: DIAS DE TRABALHO**
- Os plantões SÓ PODEM ser agendados nos seguintes dias da semana: {{#if allowedDays}}{{#each allowedDays}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}Qualquer dia{{/if}}.
- NENHUM plantão pode ser criado fora desses dias. Verifique o dia da semana para cada data que você escolher.

**REGRA OBRIGATÓRIA 3: DISTRIBUIÇÃO DIÁRIA**
- Para garantir que a escala seja bem distribuída e utilize todo o período disponível, cada dia no calendário pode ter no máximo 2 plantões de CADA função (Ex: no máximo 2 de 'Anestesia' e no máximo 2 de 'Enfermaria' no mesmo dia). Tente espaçar os plantões ao máximo ao longo do período entre {{{startDate}}} e {{{endDate}}}.

**Dados de Entrada:**
- **Período da Escala:** Os plantões devem ser distribuídos entre as datas {{{startDate}}} e {{{endDate}}}.
- **Turmas:**
  {{#each calendars}}
  - ID: {{{id}}}, Nome: {{{name}}}
  {{/each}}
- **Funcionários (Indisponibilidades e Preferências):**
  {{#each employees}}
  - ID: {{{id}}}, Nome: {{{name}}}, Preferências: {{{preferences}}}, Indisponibilidade: {{#if unavailability}}{{#each unavailability}}{{{day}}} de {{{startTime}}} a {{{endTime}}}; {{/each}}{{else}}Nenhuma{{/if}}
  {{/each}}
- **Funções a Preencher:** {{#each rolesToFill}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- **Restrições Adicionais:** {{{scheduleConstraints}}}

**Passo 4: Gere a Saída**
Ao fazer as atribuições, considere:
1. A indisponibilidade dos funcionários é um bloqueio total.
2. As preferências dos funcionários e a distribuição justa e espaçada dos plantões ao longo de todo o período.
3. Para cada atribuição, especifique o 'calendarId' correspondente. O funcionário deve pertencer à turma do plantão.
4. O 'employeeId' DEVE ser um dos IDs fornecidos.
5. A 'shiftDate' DEVE estar no formato YYYY-MM-DD e dentro do período especificado.

Depois de gerar as atribuições, revise sua lista para garantir que o número total de plantões está correto e que todas as regras obrigatórias foram cumpridas. Explique seu raciocínio no resumo.
IMPORTANTE: O resumo deve estar em português.
  `,
  config: {
    model: googleAI('gemini-1.5-pro-latest'),
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
