import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, CheckCircle2, Smartphone } from "lucide-react";
import { toast } from "sonner";

const PRESET_AMOUNTS = [5, 10, 25, 50];

const ChargeCustomer = () => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleCharge = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("charge-customer", {
        body: { amount: numAmount },
      });

      if (error) throw error;
      if (data?.url) {
        // Open Stripe checkout for the customer
        window.open(data.url, "_blank");
      }
      setSuccess(true);
      toast.success(`Payment link created for $${numAmount.toFixed(2)}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create charge");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
        <div className="text-center space-y-4 px-4">
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
          <h1 className="font-display text-2xl font-bold text-foreground">
            Payment Link Sent!
          </h1>
          <p className="text-muted-foreground">
            The customer's payment will auto-load onto your card once completed.
          </p>
          <div className="flex flex-col gap-3 mt-6">
            <Button
              onClick={() => { setSuccess(false); setAmount(""); }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-display"
            >
              Charge Another Customer
            </Button>
            <Button asChild variant="outline" className="border-border text-foreground">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-display text-sm">Back</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10 max-w-md space-y-8">
        {/* Title */}
        <div className="text-center space-y-2">
          <Smartphone className="w-12 h-12 text-primary mx-auto" />
          <h1 className="font-display text-2xl font-bold text-foreground">
            Charge Customer
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter the amount and the customer pays via Stripe. Funds auto-load onto your card.
          </p>
        </div>

        {/* Amount input */}
        <div className="space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-display font-bold text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="h-16 pl-10 text-3xl font-display font-bold text-foreground bg-card border-border text-center"
              min="0.50"
              step="0.01"
            />
          </div>

          {/* Preset amounts */}
          <div className="grid grid-cols-4 gap-2">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(String(preset))}
                className={`rounded-lg border py-3 font-display font-semibold transition-all ${
                  amount === String(preset)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                ${preset}
              </button>
            ))}
          </div>
        </div>

        {/* Charge button */}
        <Button
          onClick={handleCharge}
          disabled={loading || !amount || parseFloat(amount) <= 0}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold h-14 text-lg"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating charge...
            </>
          ) : (
            `Charge $${parseFloat(amount || "0").toFixed(2)}`
          )}
        </Button>

        {/* NFC hint */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            <span className="text-primary font-semibold">NFC Tap-to-Pay</span> — Deploy as a native app for contactless charging via tap.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChargeCustomer;
