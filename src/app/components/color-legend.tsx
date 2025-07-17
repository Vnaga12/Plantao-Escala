
"use client";

import { cn } from "@/lib/utils";
import type { ShiftColor } from "@/lib/types";

type ColorLegendProps = {
  meanings: { color: ShiftColor; meaning: string }[];
};

const colorClasses: Record<ShiftColor, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  gray: 'bg-gray-500',
};

export default function ColorLegend({ meanings }: ColorLegendProps) {
  return (
    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
      <h3 className="font-semibold mb-2 text-sm text-gray-700">Legenda de Cores</h3>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {meanings.map(({ color, meaning }) => (
          <div key={color} className="flex items-center gap-2">
            <div className={cn("h-4 w-4 rounded-full", colorClasses[color])} />
            <span className="text-xs text-gray-600">{meaning}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
