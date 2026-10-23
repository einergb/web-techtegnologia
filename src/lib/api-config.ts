export function getApiBaseUrl() {
  return (process.env.API_BASE_URL || "https://tiendaapi.codeconheiner.com").replace(/\/$/, "");
}
