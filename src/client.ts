import type { Config } from "./config.js";

let cachedAuth: string | null = null;

export function clearAuthCache(): void {
  cachedAuth = null;
}

export async function login(config: Config): Promise<string> {
  if (cachedAuth) return cachedAuth;

  const res = await fetch(
    `${config.url}/api/greader.php/accounts/ClientLogin`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        Email: config.user,
        Passwd: config.apiPassword,
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`FreshRSS login failed: ${res.status}`);
  }

  const text = await res.text();
  const authLine = text
    .split("\n")
    .find((line) => line.startsWith("Auth="));
  if (!authLine) {
    throw new Error("FreshRSS login response missing Auth token");
  }

  cachedAuth = authLine.replace("Auth=", "").trim();
  return cachedAuth;
}

function authHeaders(auth: string): Record<string, string> {
  return {
    Authorization: `GoogleLogin auth=${auth}`,
  };
}

async function authedFetch(
  config: Config,
  auth: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(`${config.url}${path}`, {
    ...init,
    headers: {
      ...authHeaders(auth),
      ...init?.headers,
    },
  });

  if (res.status === 401) {
    clearAuthCache();
    throw new Error("FreshRSS auth expired");
  }

  return res;
}

// ---- Types ----

export interface Subscription {
  id: string;
  title: string;
  url: string;
  htmlUrl: string;
  iconUrl: string;
  categories: Array<{ id: string; label: string }>;
}

export interface StreamItem {
  id: string;
  title: string;
  canonical: Array<{ href: string }>;
  origin?: { streamId: string; title: string; htmlUrl: string };
  author: string;
  summary: { content: string };
  visual?: { url: string };
  published: number;
  categories: string[];
}

export interface StreamContents {
  id: string;
  title: string;
  continuation?: string;
  items: StreamItem[];
}

// ---- API Functions ----

export async function getSubscriptionList(
  config: Config,
  auth: string,
): Promise<{ subscriptions: Subscription[] }> {
  const res = await authedFetch(
    config,
    auth,
    "/api/greader.php/reader/api/0/subscription/list?output=json",
  );
  if (!res.ok) throw new Error(`getSubscriptionList failed: ${res.status}`);
  return res.json();
}

export async function getStreamContents(
  config: Config,
  auth: string,
  streamId: string,
  count = 20,
  continuation?: string,
  excludeTag?: string,
): Promise<StreamContents> {
  const params = new URLSearchParams({
    n: String(count),
    output: "json",
  });
  if (continuation) params.set("c", continuation);
  if (excludeTag) params.set("xt", excludeTag);

  const encodedStreamId = encodeURIComponent(streamId);
  const res = await authedFetch(
    config,
    auth,
    `/api/greader.php/reader/api/0/stream/contents/${encodedStreamId}?${params}`,
  );
  if (!res.ok) throw new Error(`getStreamContents failed: ${res.status}`);
  return res.json();
}

export async function getItemContents(
  config: Config,
  auth: string,
  itemIds: string[],
): Promise<StreamContents> {
  const params = new URLSearchParams({ output: "json" });
  for (const id of itemIds) {
    params.append("i", id);
  }

  const res = await authedFetch(
    config,
    auth,
    `/api/greader.php/reader/api/0/stream/items/contents`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    },
  );
  if (!res.ok) throw new Error(`getItemContents failed: ${res.status}`);
  return res.json();
}

export async function getUnreadItemIds(
  config: Config,
  auth: string,
  count = 1000,
): Promise<{ itemRefs: Array<{ id: string }> }> {
  const params = new URLSearchParams({
    s: "user/-/state/com.google/reading-list",
    xt: "user/-/state/com.google/read",
    n: String(count),
    output: "json",
  });

  const res = await authedFetch(
    config,
    auth,
    `/api/greader.php/reader/api/0/stream/items/ids?${params}`,
  );
  if (!res.ok) throw new Error(`getUnreadItemIds failed: ${res.status}`);
  return res.json();
}

export async function setItemTag(
  config: Config,
  auth: string,
  itemId: string,
  addTag: string,
): Promise<void> {
  const res = await authedFetch(
    config,
    auth,
    "/api/greader.php/reader/api/0/edit-tag",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        i: itemId,
        a: addTag,
      }),
    },
  );
  if (!res.ok) throw new Error(`setItemTag failed: ${res.status}`);
}

export async function subscriptionEdit(
  config: Config,
  auth: string,
  action: "subscribe" | "unsubscribe",
  feedUrl: string,
  title?: string,
  folder?: string,
): Promise<void> {
  const params = new URLSearchParams({
    ac: action,
    s: feedUrl.startsWith("feed/") ? feedUrl : `feed/${feedUrl}`,
  });
  if (title) params.set("t", title);
  if (folder) params.set("a", `user/-/label/${folder}`);

  const res = await authedFetch(
    config,
    auth,
    "/api/greader.php/reader/api/0/subscription/edit",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    },
  );
  if (!res.ok) throw new Error(`subscriptionEdit (${action}) failed: ${res.status}`);
}

export async function removeItemTag(
  config: Config,
  auth: string,
  itemId: string,
  removeTag: string,
): Promise<void> {
  const res = await authedFetch(
    config,
    auth,
    "/api/greader.php/reader/api/0/edit-tag",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        i: itemId,
        r: removeTag,
      }),
    },
  );
  if (!res.ok) throw new Error(`removeItemTag failed: ${res.status}`);
}
