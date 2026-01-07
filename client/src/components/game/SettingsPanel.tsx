import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import type { GameSettings, ControlScheme } from "@shared/schema";

interface SettingsPanelProps {
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  onBack: () => void;
}

export function SettingsPanel({ settings, onSettingsChange, onBack }: SettingsPanelProps) {
  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="min-h-screen flex flex-col p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />
      
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)`,
        }}
      />
      
      <div className="relative z-10 flex flex-col gap-8 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-4">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={onBack}
            data-testid="button-settings-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 
            className="font-pixel text-xl md:text-2xl tracking-wider"
            style={{ textShadow: "0 0 20px hsl(var(--primary) / 0.5)" }}
          >
            SETTINGS
          </h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="font-pixel text-sm tracking-wider">AUDIO</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
              <Label className="font-pixel text-xs tracking-wide">SOUND EFFECTS</Label>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => updateSetting("soundEnabled", checked)}
                data-testid="switch-sound"
              />
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <Label className="font-pixel text-xs tracking-wide">MUSIC</Label>
              <Switch
                checked={settings.musicEnabled}
                onCheckedChange={(checked) => updateSetting("musicEnabled", checked)}
                data-testid="switch-music"
              />
            </div>
            
            <div className="flex flex-col gap-3">
              <Label className="font-pixel text-xs tracking-wide">VOLUME</Label>
              <Slider
                value={[settings.volume * 100]}
                onValueChange={([val]) => updateSetting("volume", val / 100)}
                max={100}
                step={1}
                className="w-full"
                data-testid="slider-volume"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="font-pixel text-sm tracking-wider">CONTROLS</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <Label className="font-pixel text-xs tracking-wide">TOUCH CONTROL SCHEME</Label>
              <RadioGroup
                value={settings.controlScheme}
                onValueChange={(val) => updateSetting("controlScheme", val as ControlScheme)}
                className="flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="drag" id="drag" data-testid="radio-drag" />
                  <Label htmlFor="drag" className="font-pixel text-[10px] tracking-wide cursor-pointer">
                    DRAG - Slide finger to move paddle
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="tap" id="tap" data-testid="radio-tap" />
                  <Label htmlFor="tap" className="font-pixel text-[10px] tracking-wide cursor-pointer">
                    TAP - Tap zones to move up/down
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="font-pixel text-sm tracking-wider">GAMEPLAY</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <Label className="font-pixel text-xs tracking-wide">AI DIFFICULTY</Label>
              <Select
                value={settings.difficulty}
                onValueChange={(val: "easy" | "medium" | "hard") => updateSetting("difficulty", val)}
              >
                <SelectTrigger className="font-pixel text-xs" data-testid="select-difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy" className="font-pixel text-xs">EASY</SelectItem>
                  <SelectItem value="medium" className="font-pixel text-xs">MEDIUM</SelectItem>
                  <SelectItem value="hard" className="font-pixel text-xs">HARD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <Label className="font-pixel text-xs tracking-wide">VISUAL EFFECTS</Label>
              <Switch
                checked={settings.showEffects}
                onCheckedChange={(checked) => updateSetting("showEffects", checked)}
                data-testid="switch-effects"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="font-pixel text-sm tracking-wider">KEYBOARD CONTROLS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 font-pixel text-[10px] tracking-wide text-muted-foreground">
              <div>
                <p className="text-foreground mb-2">PLAYER 1</p>
                <p>W - Move Up</p>
                <p>S - Move Down</p>
              </div>
              <div>
                <p className="text-foreground mb-2">PLAYER 2</p>
                <p>Arrow Up - Move Up</p>
                <p>Arrow Down - Move Down</p>
              </div>
              <div className="col-span-2 mt-2">
                <p className="text-foreground mb-2">GENERAL</p>
                <p>Space / Escape - Pause</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
