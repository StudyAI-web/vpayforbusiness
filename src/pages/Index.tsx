import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ECardVisual from "@/components/ECardVisual";
import { Button } from "@/components/ui/button";
import { CreditCard, DollarSign, ArrowUpRight, Smartphone } from "lucide-react";

interface MerchantCard {
  card_number: string;
  card_cvv: string;
  card_expiry: string;
  amount: number;
  balance: number;
}

const Index = () => {
  const [card, setCard] = useState<MerchantCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCard = async () => {
      // Fetch the single merchant card (most recent active one)
      const { data, error } = await supabase
        .from("ecards")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setCard({
          card_number: data.card_number,
          card_cvv: data.card_cvv,
          card_expiry: data.card_expiry,
          amount: data.amount,
          balance: data.balance,
        });
      }
      setLoading(false);
    };

    fetchCard();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            <span className="font-display font-bold text-xl text-foreground tracking-wide">
              V<span className="text-primary">Pay</span>
            </span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-lg space-y-8">
        {/* Card display */}
        <section className="space-y-4">
          <h1 className="font-display text-2xl font-bold text-foreground text-center">
            Your Card
          </h1>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : card ? (
            <>
              <div className="flex justify-center animate-float">
                <ECardVisual
                  amount={card.balance / 100}
                  cardNumber={card.card_number}
                  cardExpiry="∞"
                  cardCvv={card.card_cvv}
                  showDetails
                  size="lg"
                />
              </div>

              {/* Balance */}
              <div className="text-center space-y-1">
                <p className="text-muted-foreground text-sm">Available Balance</p>
                <p className="font-display text-4xl font-bold text-foreground">
                  ${(card.balance / 100).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total earned: ${(card.amount / 100).toFixed(2)}
                </p>
              </div>
            </>
          ) : (
            <div className="text-center space-y-4 py-8">
              <div className="flex justify-center animate-float">
                <ECardVisual amount={0} cardExpiry="∞" size="lg" />
              </div>
              <p className="text-muted-foreground">
                No earnings yet. Charge your first customer to activate your card!
              </p>
            </div>
          )}
        </section>

        {/* Charge button */}
        <section>
          <Button
            asChild
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold h-14 text-lg"
            size="lg"
          >
            <Link to="/charge">
              <Smartphone className="mr-2 h-5 w-5" />
              Charge Customer
            </Link>
          </Button>
        </section>

        {/* Quick stats */}
        <section className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-1">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Balance</span>
            </div>
            <p className="font-display font-bold text-lg text-foreground">
              ${card ? (card.balance / 100).toFixed(2) : "0.00"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 space-y-1">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Earned</span>
            </div>
            <p className="font-display font-bold text-lg text-foreground">
              ${card ? (card.amount / 100).toFixed(2) : "0.00"}
            </p>
          </div>
        </section>

        {/* Card details */}
        {card && (
          <section className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="font-display font-semibold text-foreground text-sm uppercase tracking-wider">
              Card Details
            </h3>
            {[
              { label: "Card Number", value: card.card_number.replace(/(.{4})/g, "$1 ").trim() },
              { label: "Expiry", value: "Forever ∞" },
              { label: "CVV", value: card.card_cvv },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="font-mono text-sm text-foreground">{value}</span>
              </div>
            ))}
          </section>
        )}

        {/* NFC info */}
        <section className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center space-y-2">
          <Smartphone className="w-8 h-8 text-primary mx-auto" />
          <p className="text-sm text-foreground font-display font-semibold">
            NFC Tap-to-Pay Ready
          </p>
          <p className="text-xs text-muted-foreground">
            Deploy as a native app to accept contactless payments via NFC tap against your device.
          </p>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            © 2026 VPay. Payments powered by Stripe.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
