import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateCardNumber(): string {
  // Generate a 16-digit card number starting with 4242 (test prefix)
  const prefix = "4242";
  let rest = "";
  for (let i = 0; i < 12; i++) {
    rest += Math.floor(Math.random() * 10).toString();
  }
  return prefix + rest;
}

function generateCVV(): string {
  return Math.floor(100 + Math.random() * 900).toString();
}

function generateExpiry(): string {
  const now = new Date();
  const expMonth = String(now.getMonth() + 1).padStart(2, "0");
  const expYear = String(now.getFullYear() + 3).slice(-2);
  return `${expMonth}/${expYear}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, amount } = await req.json();

    if (!session_id || !amount) {
      return new Response(
        JSON.stringify({ error: "session_id and amount are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify payment with Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ error: "Payment not completed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if ecard already exists for this session
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: existing } = await supabase
      .from("ecards")
      .select("*")
      .eq("stripe_session_id", session_id)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({
          card_number: existing.card_number,
          card_cvv: existing.card_cvv,
          card_expiry: existing.card_expiry,
          amount: existing.amount,
          balance: existing.balance,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate and store the ecard
    const cardNumber = generateCardNumber();
    const cardCvv = generateCVV();
    const cardExpiry = generateExpiry();
    const amountCents = Number(amount) * 100;
    const email = session.customer_details?.email || "guest@lovable.app";

    const { error: insertError } = await supabase.from("ecards").insert({
      user_email: email,
      card_number: cardNumber,
      card_cvv: cardCvv,
      card_expiry: cardExpiry,
      amount: amountCents,
      balance: amountCents,
      stripe_session_id: session_id,
      status: "active",
      activated_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create ecard" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        card_number: cardNumber,
        card_cvv: cardCvv,
        card_expiry: cardExpiry,
        amount: amountCents,
        balance: amountCents,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Activation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
