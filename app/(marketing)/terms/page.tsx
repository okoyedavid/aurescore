import type { Metadata } from "next";
import TermsPage from "@/features/terms/TermsPage";

export const metadata: Metadata = { title: "Terms | AureScore" };
export default function Page() { return <TermsPage />; }
