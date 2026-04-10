import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ECardVisual from "@/components/ECardVisual";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, ArrowLeft, Plus } from "lucide-react";

interface CardData {
  card_number: string;
  card_cvv: string;
  card_expiry: string;
  amount: number;
  balance: number;
  added?: number;
}

const ChargeSuccess = () => {
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

    const processCharge = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("process-charge", {
          body: { session_id: sessionId, amount },
        });

        if (fnError) throw fnError;
        setCard(data);
      } catch (err: any) {
        setError(err.message || "Failed to process charge");
      } finally {
        setLoading(false);
      }
    };

    processCharge();
  }, [sessionId, amount]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-display">Loading funds onto your card...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
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

  const addedAmount = card.added || Math.round(parseFloat(amount || "0") * 100);

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <div className="container mx-auto px-4 py-16 max-w-lg">
        {/* Success header */}
        <div className="text-center space-y-3 mb-10">
          <CheckCircle2 className="w-14 h-14 text-primary mx-auto" />
          <h1 className="font-display text-3xl font-bold text-foreground">
            Funds Loaded!
          </h1>
          <div className="flex items-center justify-center gap-2 text-primary">
            <Plus className="w-5 h-5" />
            <span className="font-display text-2xl font-bold">
              ${(addedAmount / 100).toFixed(2)}
            </span>
          </div>
          <p className="text-muted-foreground">
            Added to your VPay card. New balance: ${(card.balance / 100).toFixed(2)}
          </p>
        </div>

        {/* Card visual */}
        <div className="flex justify-center mb-10">
          <ECardVisual
            amount={card.balance / 100}
            cardNumber={card.card_number}
            cardExpiry="∞"
            cardCvv={card.card_cvv}
            showDetails
            size="lg"
          />
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 font-display">
            <Link to="/charge">
              Charge Another Customer
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-border text-foreground hover:bg-secondary">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChargeSuccess;
