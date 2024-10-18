type Cluster = 'devnet' | 'testnet' | 'mainnet-beta';
export type GetExplorerLinkFn = (linkType: "transaction" | "tx" | "address" | "block", id: string, cluster?: Cluster | "localnet") => string;

const encodeURL = (baseUrl: string, searchParams: Record<string, string>) => {
  // This was a little new to me, but it's the
  // recommended way to build URLs with query params
  // (and also means you don't have to do any encoding)
  // https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
  const url = new URL(baseUrl);
  url.search = new URLSearchParams(searchParams).toString();
  return url.toString();
};
export const getExplorerLink: GetExplorerLinkFn = (linkType, id, cluster = "mainnet-beta") => {
  const searchParams: Record<string, string> = {};
  if (cluster !== "mainnet-beta") {
      if (cluster === "localnet") {
          // localnet technically isn't a cluster, so requires special handling
          searchParams["cluster"] = "custom";
          searchParams["customUrl"] = "http://localhost:8899";
      }
      else {
          searchParams["cluster"] = cluster;
      }
  }
  let baseUrl = "";
  if (linkType === "address") {
      baseUrl = `https://explorer.solana.com/address/${id}`;
  }
  if (linkType === "transaction" || linkType === "tx") {
      baseUrl = `https://explorer.solana.com/tx/${id}`;
  }
  if (linkType === "block") {
      baseUrl = `https://explorer.solana.com/block/${id}`;
  }
  return encodeURL(baseUrl, searchParams);
};
