'use server';

import { suggestShiftAssignments as suggestShiftAssignmentsFlow } from "@/ai/flows/suggest-shifts";
import type { SuggestShiftAssignmentsInput, SuggestShiftAssignmentsOutput } from "@/ai/flows/suggest-shifts";


export async function suggestShiftAssignments(input: SuggestShiftAssignmentsInput): Promise<SuggestShiftAssignmentsOutput> {
    return await suggestShiftAssignmentsFlow(input);
}
