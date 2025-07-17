
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
import type { ShiftColor } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const availableColors: { name: ShiftColor, class: string }[] = [
  { name: 'blue', class: 'bg-blue-500' },
  { name: 'green', class: 'bg-green-500' },
  { name: 'purple', class: 'bg-purple-500' },
  { name: 'red', class: 'bg-red-500' },
  { name: 'yellow', class: 'bg-yellow-500' },
  { name: 'gray', class: 'bg-gray-500' },
];

type SettingsDialogProps = {
  roles: string[];
  onRolesChange: (roles: string[]) => void;
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
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen) {
      setInternalRoles(roles);
      setInternalColorMeanings(colorMeanings);
    }
  }, [roles, colorMeanings, isOpen]);

  const handleRoleChange = (index: number, value: string) => {
    const newRoles = [...internalRoles];
    newRoles[index] = value;
    setInternalRoles(newRoles);
  };

  const handleAddRole = () => {
    setInternalRoles([...internalRoles, `Nova Função ${internalRoles.length + 1}`]);
  };

  const handleRemoveRole = (index: number) => {
    const newRoles = internalRoles.filter((_, i) => i !== index);
    setInternalRoles(newRoles);
  };

  const handleColorMeaningChange = (colorName: ShiftColor, meaning: string) => {
    const newMeanings = internalColorMeanings.map(m => 
      m.color === colorName ? { ...m, meaning } : m
    );
    setInternalColorMeanings(newMeanings);
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
            <Label className="text-base font-semibold">Funções da Equipe</Label>
            <p className="text-sm text-muted-foreground mb-2">Adicione, edite ou remova as funções disponíveis.</p>
            <div className="space-y-2">
              {internalRoles.map((role, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={role}
                    onChange={(e) => handleRoleChange(index, e.target.value)}
                    placeholder="Nome da Função"
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveRole(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
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
            <p className="text-sm text-muted-foreground mb-2">Edite o significado de cada cor de plantão.</p>
            <div className="space-y-3">
              {internalColorMeanings.map(({ color, meaning }) => {
                const colorInfo = availableColors.find(c => c.name === color);
                return (
                  <div key={color} className="flex items-center gap-3">
                    <div className={cn("h-6 w-6 rounded-full flex-shrink-0", colorInfo?.class)} />
                    <Input
                      value={meaning}
                      onChange={(e) => handleColorMeaningChange(color, e.target.value)}
                      placeholder="Significado da cor"
                    />
                  </div>
                );
              })}
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
