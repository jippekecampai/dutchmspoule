import Stripe from "stripe";
import { getServerConfig } from "./config.server";

export const ENTRY_FEE_CENTS = 1000;
export const ENTRY_FEE_CURRENCY = "eur";

export function getStripeClient() {
  const { stripeSecretKey } = getServerConfig();
  if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  return new Stripe(stripeSecretKey, {
    apiVersion: "2026-02-25.clover" as Stripe.StripeConfig["apiVersion"],
  });
}

export function getAppUrl(request?: Request) {
  const configuredUrl = getServerConfig().appUrl;
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");

  if (request) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  }

  throw new Error("Missing APP_URL");
}
