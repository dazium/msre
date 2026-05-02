import Stripe from "stripe";
import { ENV } from "./_core/env";

const stripe = new Stripe(ENV.STRIPE_SECRET_KEY);

export async function createCheckoutSession(input: {
  invoiceId: number;
  invoiceNumber: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  userId: number;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: input.currency.toLowerCase(),
          product_data: {
            name: `Invoice ${input.invoiceNumber}`,
            description: `Payment for invoice ${input.invoiceNumber}`,
          },
          unit_amount: Math.round(input.amount * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    customer_email: input.customerEmail,
    client_reference_id: input.userId.toString(),
    metadata: {
      user_id: input.userId.toString(),
      invoice_id: input.invoiceId.toString(),
      invoice_number: input.invoiceNumber,
      customer_email: input.customerEmail,
      customer_name: input.customerName,
    },
    allow_promotion_codes: true,
  });

  return session;
}

export async function getPaymentIntent(paymentIntentId: string) {
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

export async function refundPayment(paymentIntentId: string, amount?: number) {
  // Refund using payment intent directly
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount ? Math.round(amount * 100) : undefined,
  });
}

export async function getCustomer(customerId: string) {
  return stripe.customers.retrieve(customerId);
}

export async function createCustomer(email: string, name: string, metadata?: Record<string, string>) {
  return stripe.customers.create({
    email,
    name,
    metadata,
  });
}

export { stripe };
