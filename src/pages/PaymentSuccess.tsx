import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ECardVisual from "@/components/ECardVisual";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Copy, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface CardData {
  card_number: string;
  card_cvv: string;
  card_expiry: string;
  amount: number;
  balance: number;
}

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [card, setCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get("session_id");
  const amount = searchParams.get("amount");

  useEffect(() => {
    if (!sessionId || !amount) {
      setError("Missing payment information");
      setLoading(false);
      return;
    }

    const activateCard = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("activate-ecard", {
          body: { session_id: sessionId, amount },
        });

        if (fnError) throw fnError;
        setCard(data);
      } catch (err: any) {
        setError(err.message || "Failed to activate your card");
      } finally {
        setLoading(false);
      }
    };

    activateCard();
  }, [sessionId, amount]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-display">Activating your Lovable Card...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md px-4">
          <p className="text-destructive font-display text-lg">{error}</p>
          <Button asChild variant="outline">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!card) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-lg">
        {/* Success header */}
        <div className="text-center space-y-3 mb-10">
          <CheckCircle2 className="w-14 h-14 text-primary mx-auto" />
          <h1 className="font-display text-3xl font-bold text-foreground">
            Your Card is Ready!
          </h1>
          <p className="text-muted-foreground">
            Your Lovable Card has been activated with ${card.amount / 100} loaded.
          </p>
        </div>

        {/* Card visual */}
        <div className="flex justify-center mb-10">
          <ECardVisual
            amount={card.amount / 100}
            cardNumber={card.card_number}
            cardExpiry={card.card_expiry}
            cardCvv={card.card_cvv}
            showDetails
            size="lg"
          />
        </div>

        {/* Card details */}
        <div className="space-y-3 bg-card rounded-xl border border-border p-5">
          <h3 className="font-display font-semibold text-foreground text-sm uppercase tracking-wider mb-4">
            Card Details
          </h3>

          {[
            { label: "Card Number", value: card.card_number.replace(/(.{4})/g, "$1 ").trim() },
            { label: "Expiry", value: card.card_expiry },
            { label: "CVV", value: card.card_cvv },
            { label: "Balance", value: `$${(card.balance / 100).toFixed(2)}` },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <span className="text-sm text-muted-foreground">{label}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-foreground">{value}</span>
                <button
                  onClick={() => copyToClipboard(value.replace(/\s/g, ""), label)}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button asChild variant="outline" className="border-border text-foreground hover:bg-secondary">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Get Another Card
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
