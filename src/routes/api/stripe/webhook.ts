import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getServerConfig } from "@/lib/config.server";
import { ENTRY_FEE_CENTS, ENTRY_FEE_CURRENCY, getStripeClient } from "@/lib/stripe.server";

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { stripeWebhookSecret } = getServerConfig();
        if (!stripeWebhookSecret) {
          return new Response("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });
        }

        const signature = request.headers.get("stripe-signature");
        if (!signature) {
          return new Response("Missing stripe-signature", { status: 400 });
        }

        const rawBody = await request.text();
        let event: Stripe.Event;

        try {
          event = getStripeClient().webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Invalid Stripe webhook signature";
          return new Response(message, { status: 400 });
        }

        if (event.type === "checkout.session.completed") {
          const session = event.data.object;
          const userId = session.metadata?.user_id || session.client_reference_id;

          if (!userId || session.payment_status !== "paid") {
            return Response.json({ received: true });
          }

          const { error } = await supabaseAdmin
            .from("participant_payments")
            .upsert({
              user_id: userId,
              status: "paid",
              amount_cents: session.amount_total || ENTRY_FEE_CENTS,
              currency: session.currency || ENTRY_FEE_CURRENCY,
              provider: "stripe",
              provider_reference: session.id,
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: "user_id" });

          if (error) {
            return new Response(error.message, { status: 500 });
          }
        }

        return Response.json({ received: true });
      },
    },
  },
});
