export type DashboardSearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function dashboardQuerySuffix(searchParams: DashboardSearchParams): Promise<string> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    for (const item of Array.isArray(value) ? value : value ? [value] : []) {
      params.append(key, item);
    }
  }
  return params.size ? "?" + params.toString() : "";
}
