import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ECardVisual from "@/components/ECardVisual";
import CardTier from "@/components/CardTier";
import { CreditCard, Shield, Zap } from "lucide-react";

const TIERS = [
  { amount: 25, label: "Starter Card", description: "Perfect for small purchases and trying out your Lovable Card" },
  { amount: 50, label: "Standard Card", description: "The most popular choice — great balance of value and flexibility" },
  { amount: 100, label: "Premium Card", description: "Maximum value loaded onto your Lovable Card" },
];

const Index = () => {
  const [loadingAmount, setLoadingAmount] = useState<number | null>(null);

  const handleBuy = async (amount: number) => {
    setLoadingAmount(amount);
    try {
      const { data, error } = await supabase.functions.invoke("create-ecard-payment", {
        body: { amount },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start payment");
    } finally {
      setLoadingAmount(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            <span className="font-display font-bold text-xl text-foreground tracking-wide">
              Lovable<span className="text-primary">Card</span>
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-16 pb-12 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground leading-tight">
            Your Digital Card,{" "}
            <span className="text-primary">Instantly</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Pay with your card and receive a branded Lovable eCard with a real card number, loaded with your chosen amount.
          </p>
        </div>

        {/* Floating card preview */}
        <div className="flex justify-center mt-10 animate-float">
          <ECardVisual amount={50} size="lg" />
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { icon: Zap, title: "Instant Delivery", desc: "Get your card number seconds after payment" },
            { icon: Shield, title: "Secure Payments", desc: "Powered by Stripe — bank-level security" },
            { icon: CreditCard, title: "Real Card Number", desc: "A unique 16-digit card number just for you" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center gap-3 p-4 text-center">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground text-sm">{title}</h3>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Card tiers */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="font-display text-2xl font-bold text-center text-foreground mb-8">
          Choose Your Card
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {TIERS.map((tier) => (
            <CardTier
              key={tier.amount}
              {...tier}
              popular={tier.amount === 50}
              onBuy={handleBuy}
              loading={loadingAmount === tier.amount}
            />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            © 2026 LovableCard. Payments processed securely by Stripe.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
