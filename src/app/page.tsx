import { Suspense } from "react";
import HomeContent from "./home-content";

export default function HomePage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
