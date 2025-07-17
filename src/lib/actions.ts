"use server";

import { suggestShiftAssignments, type SuggestShiftAssignmentsInput, type SuggestShiftAssignmentsOutput } from '@/ai/flows/suggest-shifts';

export async function getShiftSuggestions(input: SuggestShiftAssignmentsInput): Promise<{ success: boolean, data?: SuggestShiftAssignmentsOutput, error?: string }> {
  try {
    const result = await suggestShiftAssignments(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in getShiftSuggestions:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `Failed to get suggestions from AI: ${errorMessage}` };
  }
}
