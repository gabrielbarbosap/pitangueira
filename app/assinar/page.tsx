import type { Metadata } from "next";
import { Suspense } from "react";
import { AssinarTela } from "../components/assinatura/AssinarTela";

export const metadata: Metadata = {
  title: "Assinar — Pitangueira",
  robots: { index: false },
};

export default function AssinarPage() {
  return (
    <Suspense fallback={<div className="grade min-h-dvh" />}>
      <AssinarTela />
    </Suspense>
  );
}
