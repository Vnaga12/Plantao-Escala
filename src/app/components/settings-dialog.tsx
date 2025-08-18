
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
import { Settings, Trash2, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { ShiftColor, Role, EmployeeAvailability } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";


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

const weekdays = [
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
  const [newRoleName, setNewRoleName] = React.useState("");
  const [internalColorMeanings, setInternalColorMeanings] = React.useState(colorMeanings);
  const [newMeaning, setNewMeaning] = React.useState("");
  const [newMeaningColor, setNewMeaningColor] = React.useState<ShiftColor>('blue');
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen) {
      setInternalRoles(JSON.parse(JSON.stringify(roles)));
      setNewRoleName("");
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
    if (newRoleName.trim() === "") return;
    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: newRoleName,
      unavailabilityRules: [],
    };
    setInternalRoles([...internalRoles, newRole]);
    setNewRoleName("");
  };

  const handleRemoveRole = (index: number) => {
    // Prevent deleting the 'Unassigned' role
    if (internalRoles[index].id === 'role-unassigned') {
        toast({ variant: 'destructive', title: "Ação não permitida", description: "Não é possível excluir a função padrão 'Sem Função'." });
        return;
    }
    const newRoles = internalRoles.filter((_, i) => i !== index);
    setInternalRoles(newRoles);
  };
  
  const handleRuleChange = (roleIndex: number, ruleIndex: number, field: keyof EmployeeAvailability, value: string) => {
    const newRoles = [...internalRoles];
    (newRoles[roleIndex].unavailabilityRules[ruleIndex] as any)[field] = value;
    setInternalRoles(newRoles);
  };

  const handleAddRule = (roleIndex: number) => {
    const newRoles = [...internalRoles];
    const roleToUpdate = { ...newRoles[roleIndex] }; // Clone the role object
    
    if (!roleToUpdate.unavailabilityRules) {
        roleToUpdate.unavailabilityRules = [];
    }
    
    roleToUpdate.unavailabilityRules.push({ day: 'Monday', startTime: '00:00', endTime: '23:59' });
    newRoles[roleIndex] = roleToUpdate;
    setInternalRoles(newRoles);
  };

  const handleRemoveRule = (roleIndex: number, ruleIndex: number) => {
    const newRoles = [...internalRoles];
    newRoles[roleIndex].unavailabilityRules.splice(ruleIndex, 1);
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
      <DialogContent className="max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
          <DialogDescription>
            Gerencie as configurações da sua aplicação aqui.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] -mx-6 px-6">
        <div className="py-4 space-y-6">
          <div>
            <Label className="text-base font-semibold">Funções do Grupo</Label>
            <p className="text-sm text-muted-foreground mb-2">Adicione ou remova as funções que seus funcionários podem ter.</p>
            <div className="space-y-4">
              {internalRoles.map((role, roleIndex) => (
                <div key={role.id} className="p-4 border rounded-lg space-y-4 bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <Input
                      value={role.name}
                      onChange={(e) => handleRoleChange(roleIndex, e.target.value)}
                      placeholder="Nome da Função"
                      disabled={role.id === 'role-unassigned'}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveRole(roleIndex)} disabled={role.id === 'role-unassigned'}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-medium">Regras de Indisponibilidade</Label>
                        <Button variant="outline" size="sm" onClick={() => handleAddRule(roleIndex)}>
                            <Plus className="mr-2 h-4 w-4" /> Adicionar Regra
                        </Button>
                      </div>
                      {role.unavailabilityRules?.map((rule, ruleIndex) => (
                          <div key={ruleIndex} className="grid grid-cols-[1fr,1fr,1fr,auto] gap-2 items-end">
                              <div className="space-y-1">
                                  <Label className="text-xs">Dia</Label>
                                  <Select value={rule.day} onValueChange={(value) => handleRuleChange(roleIndex, ruleIndex, 'day', value)}>
                                      <SelectTrigger><SelectValue/></SelectTrigger>
                                      <SelectContent>
                                          {weekdays.map(day => <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>)}
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="space-y-1">
                                  <Label className="text-xs">Início</Label>
                                  <Input type="time" value={rule.startTime} onChange={(e) => handleRuleChange(roleIndex, ruleIndex, 'startTime', e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                  <Label className="text-xs">Fim</Label>
                                  <Input type="time" value={rule.endTime} onChange={(e) => handleRuleChange(roleIndex, ruleIndex, 'endTime', e.target.value)} />
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveRule(roleIndex, ruleIndex)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                          </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="Nova Função"
              />
              <Button onClick={handleAddRole}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar
              </Button>
            </div>
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
        </ScrollArea>
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveChanges}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
