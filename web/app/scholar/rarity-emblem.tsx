import { Flame, Shield, Skull, Sun, Swords, WandSparkles } from 'lucide-react';
const symbols = {
  Angelic: Sun,
  Unholy: Skull,
  Heroic: Shield,
  Satanic: Flame,
  Runeword: WandSparkles,
  Normal: Swords,
};
export default function RarityEmblem({ rarity }: { rarity: string }) {
  const Icon = symbols[rarity as keyof typeof symbols] ?? Swords;
  return <Icon size={14} strokeWidth={1.5} aria-hidden="true" />;
}
