import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, CheckCircle2, Nfc } from "lucide-react";
import { toast } from "sonner";
import ECardVisual from "@/components/ECardVisual";

// Module-level guards so we only initialize the Stripe Terminal SDK and
// register its connection-token listener ONCE per page session. Re-calling
// initialize() throws "Stripe is already initialized".
let terminalInitialized = false;
let tokenListenerRegistered = false;


const PRESET_AMOUNTS = [5, 10, 25, 50];

interface CardData {
  card_number: string;
  card_cvv: string;
  card_expiry: string;
  amount: number;
  balance: number;
  added?: number;
}

const ChargeCustomer = () => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [tapPhase, setTapPhase] = useState<"idle" | "waiting" | "processing" | "success">("idle");
  const [card, setCard] = useState<CardData | null>(null);

  const handleCharge = async () => {
    const numAmount = parseFloat(amount);
    if (!Number.isFinite(numAmount) || numAmount < 0.5) {
      toast.error("Enter a valid amount (min $0.50)");
      return;
    }
    if (numAmount > 999999) {
      toast.error("Amount too large");
      return;
    }

    setLoading(true);
    setTapPhase("waiting");

    try {
      // Tap to Pay requires a real native iOS/Android build. In the web
      // preview the Stripe Terminal SDK will fail with errors like
      // "supports internet connection" because there's no NFC hardware.
      if (!Capacitor.isNativePlatform()) {
        throw new Error(
          "Tap to Pay only works in the native mobile app. Open VPay on your iPhone (built via Capacitor) to accept a real tap."
        );
      }

      // Step 1: Create a terminal payment intent
      const { data: piData, error: piError } = await supabase.functions.invoke("create-terminal-payment", {
        body: { amount: numAmount },
      });
      if (piError) throw piError;

      // Step 2: Use Stripe Terminal NFC tap-to-pay. Never simulate or auto-complete payments.
      const { StripeTerminal } = await import("@capacitor-community/stripe-terminal");
      const { TerminalConnectTypes, TerminalEventsEnum } = await import("@capacitor-community/stripe-terminal");

      // Register the connection-token listener ONCE — adding it on every tap
      // leaks listeners and re-init throws "Stripe is already initialized".
      if (!tokenListenerRegistered) {
        StripeTerminal.addListener(TerminalEventsEnum.RequestedConnectionToken, async () => {
          const { data: tokenData } = await supabase.functions.invoke("create-connection-token");
          if (tokenData?.secret) {
            await StripeTerminal.setConnectionToken({ token: tokenData.secret });
          }
        });
        tokenListenerRegistered = true;
      }

      if (!terminalInitialized) {
        await StripeTerminal.initialize({
          tokenProviderEndpoint: "",
          isTest: true,
        });
        terminalInitialized = true;
      }

      const { readers } = await StripeTerminal.discoverReaders({
        type: TerminalConnectTypes.TapToPay,
        locationId: undefined,
      });

      if (!readers?.length) {
        throw new Error("No Tap to Pay reader found. Open this in the native mobile app and use a supported device.");
      }

      await StripeTerminal.connectReader({
        reader: readers[0],
      });

      setTapPhase("processing");
      toast.info("Tap the customer's card or phone now!");

      await StripeTerminal.collectPaymentMethod({
        paymentIntent: piData.client_secret,
      });

      await StripeTerminal.confirmPaymentIntent();


      // Step 3: Capture and load funds onto card
      const { data: captureData, error: captureError } = await supabase.functions.invoke("capture-terminal-payment", {
        body: { payment_intent_id: piData.payment_intent_id },
      });
      if (captureError) throw captureError;

      setCard(captureData);
      setTapPhase("success");
      toast.success(`$${numAmount.toFixed(2)} loaded onto your card!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to process tap payment");
      setTapPhase("idle");
    } finally {
      setLoading(false);
    }
  };

  if (tapPhase === "success" && card) {
    const addedAmount = card.added || Math.round(parseFloat(amount || "0") * 100);
    return (
      <main className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
        <Helmet>
          <title>Charge Customer | VPay For Business</title>
          <meta name="description" content="Enter an amount and accept a contactless NFC tap-to-pay charge from a customer's card or phone with VPay." />
          <link rel="canonical" href="https://vpayforbusiness.lovable.app/charge" />
        </Helmet>
        <div className="container mx-auto px-4 py-16 max-w-lg">
          <div className="text-center space-y-3 mb-10">
            <CheckCircle2 className="w-14 h-14 text-primary mx-auto" />
            <h1 className="font-display text-3xl font-bold text-foreground">Funds Loaded!</h1>
            <p className="text-primary font-display text-2xl font-bold">
              +${(addedAmount / 100).toFixed(2)}
            </p>
            <p className="text-muted-foreground">
              New balance: ${(card.balance / 100).toFixed(2)}
            </p>
          </div>

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
            <Button
              onClick={() => { setTapPhase("idle"); setAmount(""); setCard(null); }}
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
      </main>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <header className="border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-display text-sm">Back</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-md space-y-8">
        {tapPhase === "idle" && (
          <>
            <div className="text-center space-y-2">
              <Nfc className="w-12 h-12 text-primary mx-auto" />
              <h1 className="font-display text-2xl font-bold text-foreground">
                Tap to Charge
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter amount, then have the customer tap their card or phone.
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-display font-bold text-muted-foreground">
                  $
                </span>
                <Input
                  type="text"
                  inputMode="decimal"
                  aria-label="Charge amount in dollars"
                  value={amount}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9.]/g, "");
                    // prevent multiple dots
                    const parts = v.split(".");
                    const clean = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : v;
                    setAmount(clean.slice(0, 9));
                  }}
                  placeholder="0.00"
                  className="h-16 pl-10 text-3xl font-display font-bold text-foreground bg-card border-border text-center"
                />
              </div>

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

            <Button
              onClick={handleCharge}
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold h-14 text-lg"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <Nfc className="mr-2 h-5 w-5" />
                  {`Charge $${parseFloat(amount || "0").toFixed(2)}`}
                </>
              )}
            </Button>
          </>
        )}

        {(tapPhase === "waiting" || tapPhase === "processing") && (
          <div className="text-center space-y-6 py-10">
            <div className="relative mx-auto w-32 h-32">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
              <div className="absolute inset-4 rounded-full border-4 border-primary/40 animate-ping" style={{ animationDelay: "0.3s" }} />
              <div className="absolute inset-8 rounded-full border-4 border-primary/60 animate-ping" style={{ animationDelay: "0.6s" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Nfc className="w-12 h-12 text-primary" />
              </div>
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                {tapPhase === "waiting" ? "Ready to Tap" : "Processing Payment..."}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {tapPhase === "waiting"
                  ? "Have the customer tap their card or phone"
                  : "Verifying and loading funds..."
                }
              </p>
              <p className="text-primary font-display text-3xl font-bold mt-4">
                ${parseFloat(amount).toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ChargeCustomer;
