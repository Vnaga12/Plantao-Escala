
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
                    <div className="flex gap-2">
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
