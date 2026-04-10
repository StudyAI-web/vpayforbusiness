import { CreditCard } from "lucide-react";

interface ECardVisualProps {
  amount?: number;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  showDetails?: boolean;
  size?: "sm" | "lg";
}

const ECardVisual = ({
  amount,
  cardNumber = "•••• •••• •••• ••••",
  cardExpiry = "••/••",
  cardCvv,
  showDetails = false,
  size = "lg",
}: ECardVisualProps) => {
  const formatCardNumber = (num: string) => {
    if (num.includes("•")) return num;
    return num.replace(/(.{4})/g, "$1 ").trim();
  };

  const isLarge = size === "lg";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-primary/20 ${
        isLarge ? "w-full max-w-[420px] aspect-[1.586/1]" : "w-full max-w-[320px] aspect-[1.586/1]"
      }`}
      style={{
        background:
          "linear-gradient(135deg, hsl(220 20% 10%) 0%, hsl(220 18% 6%) 50%, hsl(220 20% 8%) 100%)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Shimmer overlay */}
      <div className="absolute inset-0 card-shimmer pointer-events-none" />

      {/* Gradient accent */}
      <div
        className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-30 blur-3xl"
        style={{ background: "hsl(var(--primary))" }}
      />
      <div
        className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full opacity-20 blur-3xl"
        style={{ background: "hsl(var(--card-accent))" }}
      />

      <div className={`relative z-10 flex flex-col justify-between h-full ${isLarge ? "p-6" : "p-4"}`}>
        {/* Top row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className={`text-primary ${isLarge ? "w-6 h-6" : "w-4 h-4"}`} />
            <span className={`font-display font-bold tracking-wider text-primary ${isLarge ? "text-lg" : "text-sm"}`}>
              VPAY
            </span>
          </div>
          {amount && (
            <span className={`font-mono font-semibold text-card-gold ${isLarge ? "text-xl" : "text-base"}`}>
              ${amount}
            </span>
          )}
        </div>

        {/* Chip */}
        <div className={`${isLarge ? "w-12 h-9" : "w-9 h-7"} rounded-md bg-gradient-to-br from-card-gold/80 to-card-gold/40 border border-card-gold/30`} />

        {/* Card number */}
        <div>
          <p className={`font-mono tracking-[0.2em] text-foreground/90 ${isLarge ? "text-xl" : "text-sm"}`}>
            {formatCardNumber(cardNumber)}
          </p>
        </div>

        {/* Bottom row */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-widest mb-0.5">
              Valid Thru
            </p>
            <p className={`font-mono text-foreground/80 ${isLarge ? "text-sm" : "text-xs"}`}>
              {cardExpiry}
            </p>
          </div>
          {showDetails && cardCvv && (
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-widest mb-0.5">
                CVV
              </p>
              <p className={`font-mono text-foreground/80 ${isLarge ? "text-sm" : "text-xs"}`}>
                {cardCvv}
              </p>
            </div>
          )}
          <div className="flex gap-1">
            <div className="w-6 h-6 rounded-full bg-destructive/70" />
            <div className="-ml-2 w-6 h-6 rounded-full bg-card-gold/70" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ECardVisual;
