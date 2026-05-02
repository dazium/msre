import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader } from "lucide-react";

interface PaymentButtonProps {
  invoiceId: number;
  invoiceNumber: string;
  amount: number;
  currency?: string;
  onSuccess?: () => void;
}

export function PaymentButton({
  invoiceId,
  invoiceNumber,
  amount,
  currency = "USD",
  onSuccess,
}: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const createCheckoutMutation = trpc.payments.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
        onSuccess?.();
      }
      setIsLoading(false);
    },
    onError: (error) => {
      console.error("Payment error:", error);
      setIsLoading(false);
    },
  });

  const handlePayment = async () => {
    setIsLoading(true);
    const successUrl = `${window.location.origin}/invoices/${invoiceId}?payment=success`;
    const cancelUrl = `${window.location.origin}/invoices/${invoiceId}?payment=cancelled`;

    createCheckoutMutation.mutate({
      invoiceId,
      invoiceNumber,
      amount,
      currency,
      successUrl,
      cancelUrl,
    });
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={isLoading || createCheckoutMutation.isPending}
      className="gap-2"
      size="lg"
    >
      {isLoading || createCheckoutMutation.isPending ? (
        <>
          <Loader className="w-4 h-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4" />
          Pay ${amount.toFixed(2)}
        </>
      )}
    </Button>
  );
}
