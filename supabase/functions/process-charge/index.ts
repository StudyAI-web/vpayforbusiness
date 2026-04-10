import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateCardNumber(): string {
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const amountCents = Math.round(Number(amount) * 100);

    // Find existing merchant card
    const { data: existingCard } = await supabase
      .from("ecards")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingCard) {
      // Check if this session was already processed
      if (existingCard.stripe_session_id === session_id) {
        return new Response(
          JSON.stringify({
            card_number: existingCard.card_number,
            card_cvv: existingCard.card_cvv,
            card_expiry: existingCard.card_expiry,
            amount: existingCard.amount,
            balance: existingCard.balance,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Add funds to existing card
      const { error: updateError } = await supabase
        .from("ecards")
        .update({
          amount: existingCard.amount + amountCents,
          balance: existingCard.balance + amountCents,
          stripe_session_id: session_id,
        })
        .eq("id", existingCard.id);

      if (updateError) {
        console.error("Update error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to add funds" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          card_number: existingCard.card_number,
          card_cvv: existingCard.card_cvv,
          card_expiry: existingCard.card_expiry,
          amount: existingCard.amount + amountCents,
          balance: existingCard.balance + amountCents,
          added: amountCents,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new merchant card
    const cardNumber = generateCardNumber();
    const cardCvv = generateCVV();
    const email = session.customer_details?.email || "merchant@vpay.app";

    const { error: insertError } = await supabase.from("ecards").insert({
      user_email: email,
      card_number: cardNumber,
      card_cvv: cardCvv,
      card_expiry: "∞",
      amount: amountCents,
      balance: amountCents,
      stripe_session_id: session_id,
      status: "active",
      activated_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create card" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        card_number: cardNumber,
        card_cvv: cardCvv,
        card_expiry: "∞",
        amount: amountCents,
        balance: amountCents,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Process charge error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
