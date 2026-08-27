import PublicCalculatorPage from "@/features/public-calculators/PublicCalculatorPage";

export default async function Page({
  params,
}: {
  params: Promise<{ calculatorId: string }>;
}) {
  const { calculatorId } = await params;
  return <PublicCalculatorPage calculatorId={calculatorId} />;
}
