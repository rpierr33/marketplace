import { Suspense } from "react";
import SuccessContent from "./success-content";

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
