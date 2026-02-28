import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AvatarDisplay } from "./avatar-display";
import type { AvatarConfig } from "@shared/schema";
import {
  defaultAvatarConfig,
  avatarHairStyles,
  avatarEyeStyles,
  avatarAccessories,
  characterClasses,
  classLabels,
} from "@shared/schema";

const hairStyleLabels: Record<string, string> = {
  short: "ショート",
  long: "ロング",
  ponytail: "ポニーテール",
  spiky: "スパイキー",
  bald: "スキンヘッド",
  bob: "ボブ",
};

const eyeStyleLabels: Record<string, string> = {
  normal: "ノーマル",
  happy: "ハッピー",
  cool: "クール",
  determined: "気合い",
};

const accessoryLabels: Record<string, string> = {
  none: "なし",
  glasses: "メガネ",
  earring: "イヤリング",
  headband: "ハチマキ",
  crown: "王冠",
  scarf: "マフラー",
};

const skinColors = [
  { value: "#FDEBD0", label: "ライト" },
  { value: "#F5D6C3", label: "ナチュラル" },
  { value: "#D4A574", label: "タン" },
  { value: "#C68642", label: "ブラウン" },
  { value: "#8D5524", label: "ダーク" },
  { value: "#6B3A2A", label: "ディープ" },
];

const hairColors = [
  { value: "#4A3728", label: "ダークブラウン" },
  { value: "#8B4513", label: "ブラウン" },
  { value: "#FFD700", label: "ゴールド" },
  { value: "#FF6B35", label: "オレンジ" },
  { value: "#DC143C", label: "レッド" },
  { value: "#1a1a1a", label: "ブラック" },
  { value: "#C0C0C0", label: "シルバー" },
  { value: "#4169E1", label: "ブルー" },
  { value: "#9B59B6", label: "パープル" },
  { value: "#2ECC71", label: "グリーン" },
];

const outfitColors = [
  { value: "#DC2626", label: "レッド" },
  { value: "#2563EB", label: "ブルー" },
  { value: "#16A34A", label: "グリーン" },
  { value: "#9333EA", label: "パープル" },
  { value: "#CA8A04", label: "ゴールド" },
  { value: "#1a1a1a", label: "ブラック" },
  { value: "#E5E7EB", label: "ホワイト" },
  { value: "#EA580C", label: "オレンジ" },
];

interface AvatarCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentConfig?: AvatarConfig | null;
}

export function AvatarCustomizer({ open, onOpenChange, currentConfig }: AvatarCustomizerProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<AvatarConfig>(
    currentConfig || defaultAvatarConfig
  );

  const saveMutation = useMutation({
    mutationFn: async (data: AvatarConfig) => {
      const res = await apiRequest("PATCH", "/api/my/avatar", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my/employee"] });
      toast({ title: "アバターを更新しました" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "アバターの更新に失敗しました", variant: "destructive" });
    },
  });

  const update = (key: keyof AvatarConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">アバターカスタマイズ</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="border-2 border-primary p-3 bg-background">
            <AvatarDisplay config={config} size={128} />
          </div>
        </div>

        <div className="grid gap-3">
          {/* Skin Color */}
          <div className="grid gap-1.5">
            <Label className="text-xs font-mono">肌の色</Label>
            <div className="flex gap-2 flex-wrap">
              {skinColors.map(c => (
                <button
                  key={c.value}
                  className={`w-7 h-7 border-2 ${config.skinColor === c.value ? "border-primary shadow-[2px_2px_0_0_hsl(var(--primary))]" : "border-muted"}`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => update("skinColor", c.value)}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Hair Style */}
          <div className="grid gap-1.5">
            <Label className="text-xs font-mono">髪型</Label>
            <Select value={config.hairStyle} onValueChange={v => update("hairStyle", v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {avatarHairStyles.map(s => (
                  <SelectItem key={s} value={s} className="text-xs">{hairStyleLabels[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hair Color */}
          <div className="grid gap-1.5">
            <Label className="text-xs font-mono">髪の色</Label>
            <div className="flex gap-2 flex-wrap">
              {hairColors.map(c => (
                <button
                  key={c.value}
                  className={`w-7 h-7 border-2 ${config.hairColor === c.value ? "border-primary shadow-[2px_2px_0_0_hsl(var(--primary))]" : "border-muted"}`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => update("hairColor", c.value)}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Eye Style */}
          <div className="grid gap-1.5">
            <Label className="text-xs font-mono">目の形</Label>
            <Select value={config.eyeStyle} onValueChange={v => update("eyeStyle", v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {avatarEyeStyles.map(s => (
                  <SelectItem key={s} value={s} className="text-xs">{eyeStyleLabels[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Outfit */}
          <div className="grid gap-1.5">
            <Label className="text-xs font-mono">服装タイプ</Label>
            <Select value={config.outfit} onValueChange={v => update("outfit", v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {characterClasses.map(c => (
                  <SelectItem key={c} value={c} className="text-xs">{classLabels[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Outfit Color */}
          <div className="grid gap-1.5">
            <Label className="text-xs font-mono">服の色</Label>
            <div className="flex gap-2 flex-wrap">
              {outfitColors.map(c => (
                <button
                  key={c.value}
                  className={`w-7 h-7 border-2 ${config.outfitColor === c.value ? "border-primary shadow-[2px_2px_0_0_hsl(var(--primary))]" : "border-muted"}`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => update("outfitColor", c.value)}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Accessory */}
          <div className="grid gap-1.5">
            <Label className="text-xs font-mono">アクセサリー</Label>
            <Select value={config.accessory} onValueChange={v => update("accessory", v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {avatarAccessories.map(a => (
                  <SelectItem key={a} value={a} className="text-xs">{accessoryLabels[a]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs">
            キャンセル
          </Button>
          <Button
            onClick={() => saveMutation.mutate(config)}
            disabled={saveMutation.isPending}
            className="text-xs"
          >
            {saveMutation.isPending ? "保存中..." : "保存する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
