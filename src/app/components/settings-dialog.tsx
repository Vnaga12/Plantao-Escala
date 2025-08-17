
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
import { Settings, Trash2, Plus, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { ShiftColor, Role, DayOfWeek } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
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

const weekdays: { value: DayOfWeek; label: string }[] = [
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
  const [internalRoles, setInternalRoles] = React.useState<Role[]>([]);
  const [internalColorMeanings, setInternalColorMeanings] = React.useState(colorMeanings);
  const [newMeaning, setNewMeaning] = React.useState("");
  const [newMeaningColor, setNewMeaningColor] = React.useState<ShiftColor>('blue');
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen) {
      setInternalRoles(JSON.parse(JSON.stringify(roles)));
      setInternalColorMeanings(JSON.parse(JSON.stringify(colorMeanings)));
      setNewMeaning("");
      setNewMeaningColor("blue");
    }
  }, [roles, colorMeanings, isOpen]);

  const handleRoleChange = (index: number, value: string) => {
    const newRoles = [...internalRoles];
    newRoles[index].name = value;
    setInternalRoles(newRoles);
  };
  
  const handleAddRole = () => {
    const newRole: Role = {
        id: `role-${Date.now()}`,
        name: `Nova Função ${internalRoles.length + 1}`,
        unavailabilityRules: []
    }
    setInternalRoles([...internalRoles, newRole]);
  };

  const handleRemoveRole = (index: number) => {
    const newRoles = internalRoles.filter((_, i) => i !== index);
    setInternalRoles(newRoles);
  };

  const handleAddUnavailability = (roleIndex: number) => {
    const newRoles = [...internalRoles];
    newRoles[roleIndex].unavailabilityRules.push({
        day: 'Monday',
        startTime: '00:00',
        endTime: '23:59'
    });
    setInternalRoles(newRoles);
  };

  const handleRemoveUnavailability = (roleIndex: number, ruleIndex: number) => {
    const newRoles = [...internalRoles];
    newRoles[roleIndex].unavailabilityRules.splice(ruleIndex, 1);
    setInternalRoles(newRoles);
  };
  
  const handleUnavailabilityChange = (roleIndex: number, ruleIndex: number, field: 'day' | 'startTime' | 'endTime', value: string) => {
    const newRoles = [...internalRoles];
    newRoles[roleIndex].unavailabilityRules[ruleIndex][field] = value;
    setInternalRoles(newRoles);
  };


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
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
          <DialogDescription>
            Gerencie as configurações da sua aplicação aqui.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div>
            <Label className="text-base font-semibold">Funções do Grupo</Label>
            <p className="text-sm text-muted-foreground mb-2">Adicione ou remova funções e defina regras de indisponibilidade.</p>
            <div className="space-y-4">
              {internalRoles.map((role, roleIndex) => (
                <div key={role.id} className="p-4 border rounded-lg space-y-3 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <Input
                        value={role.name}
                        onChange={(e) => handleRoleChange(roleIndex, e.target.value)}
                        placeholder="Nome da Função"
                        className="font-semibold"
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveRole(roleIndex)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                    
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <Label className="text-xs font-medium">Regras de Indisponibilidade</Label>
                             <Button size="xs" variant="outline" onClick={() => handleAddUnavailability(roleIndex)}>
                                <Plus className="mr-1 h-3 w-3" /> Adicionar
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {role.unavailabilityRules.map((rule, ruleIndex) => (
                                <div key={ruleIndex} className="grid grid-cols-[1fr,auto,auto,auto] gap-2 items-center">
                                    <Select value={rule.day} onValueChange={(val) => handleUnavailabilityChange(roleIndex, ruleIndex, 'day', val)}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            {weekdays.map(wd => <SelectItem key={wd.value} value={wd.value}>{wd.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Input type="time" value={rule.startTime} onChange={e => handleUnavailabilityChange(roleIndex, ruleIndex, 'startTime', e.target.value)} />
                                    <Input type="time" value={rule.endTime} onChange={e => handleUnavailabilityChange(roleIndex, ruleIndex, 'endTime', e.target.value)} />
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveUnavailability(roleIndex, ruleIndex)}>
                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                    </Button>
                                </div>
                            ))}
                            {role.unavailabilityRules.length === 0 && (
                                <p className="text-xs text-muted-foreground italic text-center py-1">Nenhuma regra definida.</p>
                            )}
                        </div>
                    </div>
                </div>
              ))}
            </div>
             <Button variant="outline" size="sm" className="mt-2" onClick={handleAddRole}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar Função
            </Button>
          </div>

          <Separator />
          
          <div>
            <Label className="text-base font-semibold">Legendas de Cores</Label>
            <p className="text-sm text-muted-foreground mb-2">Adicione, edite ou remova os significados das cores de plantão.</p>
            <div className="space-y-2">
              {internalColorMeanings.map(({ color, meaning }, index) => {
                const colorInfo = availableColors.find(c => c.name === color);
                return (
                  <div key={index} className="flex items-center gap-2">
                    <div className={cn("h-6 w-6 rounded-full flex-shrink-0", colorInfo?.class)} />
                    <Input
                      value={meaning}
                      onChange={(e) => handleColorMeaningChange(index, e.target.value)}
                      placeholder="Significado da cor"
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
                <h4 className="text-sm font-semibold">Nova Legenda</h4>
                 <div className="flex items-center gap-2">
                    <Input
                      value={newMeaning}
                      onChange={(e) => setNewMeaning(e.target.value)}
                      placeholder="Significado (ex: Feriado)"
                    />
                    <Button onClick={handleAddColorMeaning}>Adicionar Legenda</Button>
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
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveChanges}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
