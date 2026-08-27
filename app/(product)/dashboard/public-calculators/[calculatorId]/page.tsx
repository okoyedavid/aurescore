import PublicCalculatorManagementPage from "@/features/public-calculators/PublicCalculatorManagementPage";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ calculatorId: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const [{ calculatorId }, query] = await Promise.all([params, searchParams]);
  const tab = Array.isArray(query.tab) ? query.tab[0] : query.tab;
  return (
    <PublicCalculatorManagementPage
      calculatorId={calculatorId}
      initialTab={tab}
    />
  );
}
