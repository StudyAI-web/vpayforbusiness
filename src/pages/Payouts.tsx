import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, CreditCard, ExternalLink, Zap } from "lucide-react";

const Payouts = () => {
  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <Helmet>
        <title>Payout Setup — Connect Your Bank | VPay</title>
        <meta name="description" content="Connect your Chase bank account or debit card to receive Stripe payouts from your VPay earnings." />
        <link rel="canonical" href="https://vpayforbusiness.lovable.app/payouts" />
      </Helmet>

      <header className="border-b border-border/50">
        <div className="container mx-auto flex items-center gap-3 py-4 px-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/" aria-label="Back to dashboard">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <h1 className="font-display font-bold text-lg text-foreground">Payout Setup</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg space-y-6">
        <section className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-2">
          <p className="text-sm text-foreground font-display font-semibold">
            Connect Your Payout Destination
          </p>
          <p className="text-xs text-muted-foreground">
            All NFC tap-to-pay earnings land in your Stripe balance. Add a bank
            account or debit card below to receive automatic payouts.
          </p>
        </section>

        {/* Option 1: Bank */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-primary mt-1" />
            <div className="flex-1">
              <h2 className="font-display font-semibold text-foreground">
                Bank Account
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Standard payouts arrive in 1–2 business days. No fees.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                You'll need your <span className="font-mono">routing number</span> and{" "}
                <span className="font-mono">account number</span> (find them on a check or in your banking app).
              </p>
            </div>
          </div>
          <Button
            asChild
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <a
              href="https://dashboard.stripe.com/settings/payouts"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4" />
              Add Bank Account in Stripe
            </a>
          </Button>
        </section>

        {/* Option 2: Debit card */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-primary mt-1" />
            <div className="flex-1">
              <h2 className="font-display font-semibold text-foreground">
                Debit Card
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Instant Payouts arrive in ~30 minutes, 24/7. Stripe charges a 1.5% fee.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Only Visa or Mastercard <span className="font-semibold">debit</span> cards
                are eligible. Credit cards are not supported.
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            className="w-full"
          >
            <a
              href="https://dashboard.stripe.com/settings/payouts"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4" />
              Add Debit Card in Stripe
            </a>
          </Button>
        </section>

        {/* Instant payouts info */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold text-foreground text-sm">
              How it works
            </h2>
          </div>
          <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
            <li>Tap "Add Bank Account" or "Add Debit Card" above.</li>
            <li>Sign in to your Stripe account.</li>
            <li>Go to <span className="font-mono">Settings → Payouts → External accounts</span>.</li>
            <li>Enter your Chase details and verify.</li>
            <li>Set your payout schedule (daily, weekly, or manual).</li>
          </ol>
        </section>

        <p className="text-[11px] text-muted-foreground text-center">
          External account setup is handled securely by Stripe. VPay never sees your bank details.
        </p>
      </main>
    </div>
  );
};

export default Payouts;
