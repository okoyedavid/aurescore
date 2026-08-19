import type { Metadata } from "next";
import ContactPage from "@/features/contact/ContactPage";

export const metadata: Metadata = {
  title: "Contact | AureScore",
  description: "Discuss an AureScore pilot or institution-wide rollout.",
};
export default function Page() {
  return <ContactPage />;
}
