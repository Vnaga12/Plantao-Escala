
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Trash2, Plus, GripVertical } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { ShiftColor, Role, DayOfWeek } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const availableColors: { name: ShiftColor, class: string }[] = [
  { name: 'blue', class: 'bg-blue-500' },
  { name: 'green', class: 'bg-green-500' },
  { name: 'purple', class: 'bg-purple-500' },
  { name: 'red', class: 'bg-red-500' },
  { name: 'yellow', class: 'bg-yellow-500' },
  { name: 'gray', class: 'bg-gray-500' },
  { name: 'pink', class: 'bg-pink-500' },
  { name: 'cyan', class: 'bg-cyan-500' },
  { name: 'orange', class: 'bg-orange-500' },
  { name: 'indigo', class: 'bg-indigo-500' },
  { name: 'teal', class: 'bg-teal-500' },
  { name: 'lime', class: 'bg-lime-500' },
];

const weekdays: { value: DayOfWeek, label: string }[] = [
    { value: "Monday", label: "Segunda-feira" },
    { value: "Tuesday", label: "Terça-feira" },
    { value: "Wednesday", label: "Quarta-feira" },
    { value: "Thursday", label: "Quinta-feira" },
    { value: "Friday", label: "Sexta-feira" },
    { value: "Saturday", label: "Sábado" },
    { value: "Sunday", label: "Domingo" },
];

type SettingsDialogProps = {
  roles: Role[];
  onRolesChange: (roles: Role[]) => void;
  colorMeanings: { color: ShiftColor; meaning: string }[];
  onColorMeaningsChange: (meanings: { color: ShiftColor; meaning: string }[]) => void;
};

export function SettingsDialog({
  roles,
  onRolesChange,
  colorMeanings,
  onColorMeaningsChange
}: SettingsDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [internalRoles, setInternalRoles] = React.useState(roles);
  const [internalColorMeanings, setInternalColorMeanings] = React.useState(colorMeanings);
  const [newMeaning, setNewMeaning] = React.useState("");
  const [newMeaningColor, setNewMeaningColor] = React.useState<ShiftColor>('blue');
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen) {
      setInternalRoles(roles);
      setInternalColorMeanings(colorMeanings);
      setNewMeaning("");
      setNewMeaningColor("blue");
    }
  }, [roles, colorMeanings, isOpen]);

  const handleColorMeaningChange = (index: number, value: string) => {
    const newMeanings = [...internalColorMeanings];
    newMeanings[index].meaning = value;
    setInternalColorMeanings(newMeanings);
  };

  const handleRemoveColorMeaning = (index: number) => {
    const newMeanings = internalColorMeanings.filter((_, i) => i !== index);
    setInternalColorMeanings(newMeanings);
  };

  const handleAddColorMeaning = () => {
    if (newMeaning.trim() === "") {
        toast({variant: "destructive", title: "Erro", description: "O significado não pode estar vazio."})
        return;
    }
    if (internalColorMeanings.some(cm => cm.meaning.toLowerCase() === newMeaning.toLowerCase().trim())) {
        toast({variant: "destructive", title: "Erro", description: "Este tipo de plantão já existe."})
        return;
    }
    setInternalColorMeanings([
        ...internalColorMeanings,
        { color: newMeaningColor, meaning: newMeaning }
    ]);
    setNewMeaning("");
  };

  const handleSaveChanges = () => {
    onRolesChange(internalRoles);
    onColorMeaningsChange(internalColorMeanings);
    toast({ title: "Configurações Salvas", description: "As configurações foram atualizadas." });
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
          <DialogDescription>
            Gerencie as configurações da sua aplicação aqui.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-6 -mr-6">
            <div className="space-y-6">
            <div>
                <Label className="text-base font-semibold">Tipos de Plantão</Label>
                <p className="text-sm text-muted-foreground mb-2">Adicione, edite ou remova os tipos de plantão e suas cores.</p>
                <div className="space-y-2">
                {internalColorMeanings.map(({ color, meaning }, index) => {
                    const colorInfo = availableColors.find(c => c.name === color);
                    return (
                    <div key={index} className="flex items-center gap-2">
                        <div className={cn("h-6 w-6 rounded-full flex-shrink-0", colorInfo?.class)} />
                        <Input
                        value={meaning}
                        onChange={(e) => handleColorMeaningChange(index, e.target.value)}
                        placeholder="Nome do tipo de plantão"
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveColorMeaning(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                    );
                })}
                </div>
                
                <Separator className="my-4"/>

                <div className="p-4 border-dashed border-2 rounded-lg space-y-3">
                    <h4 className="text-sm font-semibold">Novo Tipo de Plantão</h4>
                    <div className="flex items-center gap-2">
                        <Input
                        value={newMeaning}
                        onChange={(e) => setNewMeaning(e.target.value)}
                        placeholder="Nome (ex: Feriado, Plantão Ortopedia)"
                        />
                        <Button onClick={handleAddColorMeaning}>Adicionar</Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label className="text-xs">Cor:</Label>
                        <div className="flex flex-wrap gap-2">
                            {availableColors.map(c => (
                                <button
                                key={c.name}
                                type="button"
                                onClick={() => setNewMeaningColor(c.name)}
                                className={cn(
                                    "h-6 w-6 rounded-full border-2",
                                    c.class,
                                    newMeaningColor === c.name ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent'
                                )}
                                aria-label={`Select ${c.name} color`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </ScrollArea>
        <DialogFooter className="pt-6 border-t mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveChanges}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    