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
    const { payment_intent_id } = await req.json();

    if (!payment_intent_id) {
      return new Response(
        JSON.stringify({ error: "payment_intent_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Verify Stripe reports a real card-present payment before loading funds.
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
    if (paymentIntent.status !== "succeeded") {
      return new Response(
        JSON.stringify({ error: `Payment not completed. Status: ${paymentIntent.status}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!paymentIntent.payment_method_types.includes("card_present")) {
      return new Response(
        JSON.stringify({ error: "Only card-present Tap to Pay payments can be captured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const amountCents = paymentIntent.amount;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    

    // Find existing merchant card
    const { data: existingCard } = await supabase
      .from("ecards")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingCard) {
      // Check if already processed
      if (existingCard.stripe_session_id === payment_intent_id) {
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

      const { error: updateError } = await supabase
        .from("ecards")
        .update({
          amount: existingCard.amount + amountCents,
          balance: existingCard.balance + amountCents,
          stripe_session_id: payment_intent_id,
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

    const { error: insertError } = await supabase.from("ecards").insert({
      user_email: "merchant@vpay.app",
      card_number: cardNumber,
      card_cvv: cardCvv,
      card_expiry: "∞",
      amount: amountCents,
      balance: amountCents,
      stripe_session_id: payment_intent_id,
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
    console.error("Capture terminal payment error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
