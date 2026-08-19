import type { Metadata } from "next";
import SolutionsPage from "@/features/solutions/SolutionsPage";

export const metadata: Metadata = { title: "Solutions | AureScore", description: "Connected academic result workflows for departments, faculties, institutions, and students." };
export default function Page() { return <SolutionsPage />; }
