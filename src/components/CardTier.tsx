import { Button } from "@/components/ui/button";
import ECardVisual from "./ECardVisual";
import { Loader2 } from "lucide-react";

interface CardTierProps {
  amount: number;
  label: string;
  description: string;
  onBuy: (amount: number) => void;
  loading?: boolean;
  popular?: boolean;
}

const CardTier = ({ amount, label, description, onBuy, loading, popular }: CardTierProps) => {
  return (
    <div
      className={`relative flex flex-col items-center gap-6 rounded-2xl border p-6 transition-all duration-300 hover:scale-[1.02] ${
        popular
          ? "border-primary/40 bg-card shadow-lg animate-pulse-glow"
          : "border-border bg-card/50 hover:border-primary/20"
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground uppercase tracking-wider">
          Most Popular
        </div>
      )}

      <ECardVisual amount={amount} size="sm" />

      <div className="text-center space-y-2">
        <h3 className="font-display text-xl font-bold text-foreground">{label}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <Button
        onClick={() => onBuy(amount)}
        disabled={loading}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Buy $${amount} Card`
        )}
      </Button>
    </div>
  );
};

export default CardTier;
