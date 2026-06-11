import Stripe from "stripe";
import { getRequestHeader } from "@tanstack/react-start/server";
import { getServerConfig } from "./config.server";

export const ENTRY_FEE_CENTS = 1500;
export const ENTRY_FEE_CURRENCY = "eur";

export function getStripeClient() {
  const { stripeSecretKey } = getServerConfig();
  if (!stripeSecretKey) {
    throw new Error("Stripe is nog niet geconfigureerd.");
  }

  return new Stripe(stripeSecretKey, {
    apiVersion: "2026-02-25.clover" as never,
  });
}

export function getAppUrl(request?: Request) {
  const configuredUrl = getServerConfig().appUrl;
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");

  if (request) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  }

  try {
    const origin = getRequestHeader("origin") || getRequestHeader("referer");
    if (origin) {
      const url = new URL(origin);
      return `${url.protocol}//${url.host}`;
    }
  } catch {
    // not inside a request context
  }

  throw new Error("Kon de app-URL niet bepalen.");
}
