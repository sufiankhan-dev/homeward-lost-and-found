import {
  Backpack,
  BookOpen,
  CupSoda,
  Glasses,
  IdCard,
  KeyRound,
  Laptop,
  Package,
  Shirt,
  Smartphone,
  Wallet,
  Watch,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  smartphone: Smartphone,
  laptop: Laptop,
  wallet: Wallet,
  "key-round": KeyRound,
  "id-card": IdCard,
  backpack: Backpack,
  shirt: Shirt,
  watch: Watch,
  "book-open": BookOpen,
  "cup-soda": CupSoda,
  glasses: Glasses,
  package: Package,
};

export function CategoryIcon({ icon, ...props }: { icon: string } & LucideProps) {
  const Icon = ICONS[icon] ?? Package;
  return <Icon aria-hidden {...props} />;
}
