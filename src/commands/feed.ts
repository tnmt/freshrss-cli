import { loadConfig } from "../config.js";
import { login, getSubscriptionList, subscriptionEdit } from "../client.js";
import { formatTable, formatJson } from "../output.js";
import { CliError } from "../error.js";

export async function feedList(flags: { json: boolean }): Promise<void> {
  const config = loadConfig();
  const auth = await login(config);
  const data = await getSubscriptionList(config, auth);

  if (flags.json) {
    process.stdout.write(formatJson(data.subscriptions));
    return;
  }

  const headers = ["ID", "TITLE", "URL"];
  const rows = data.subscriptions.map((s) => [s.id, s.title, s.url]);
  process.stdout.write(formatTable(headers, rows));
}

export async function feedShow(
  id: string,
  flags: { json: boolean },
): Promise<void> {
  if (!id) {
    throw new CliError("MISSING_ARGUMENT", "Feed ID is required", "Usage: freshrss feed show <id>");
  }

  const config = loadConfig();
  const auth = await login(config);
  const data = await getSubscriptionList(config, auth);

  const feed = data.subscriptions.find((s) => s.id === id);
  if (!feed) {
    throw new CliError("NOT_FOUND", `Feed not found: ${id}`, "Use 'freshrss feed list' to see available feeds");
  }

  if (flags.json) {
    process.stdout.write(formatJson(feed));
    return;
  }

  const lines = [
    `ID:         ${feed.id}`,
    `Title:      ${feed.title}`,
    `URL:        ${feed.url}`,
    `HTML URL:   ${feed.htmlUrl}`,
    `Icon URL:   ${feed.iconUrl}`,
    `Categories: ${feed.categories.map((c) => c.label).join(", ") || "(none)"}`,
  ];
  process.stdout.write(lines.join("\n") + "\n");
}

export async function feedAdd(
  url: string,
  flags: { title?: string; folder?: string },
): Promise<void> {
  if (!url) {
    throw new CliError("MISSING_ARGUMENT", "Feed URL is required", "Usage: freshrss feed add <url> [--title <title>] [--folder <folder>]");
  }

  const config = loadConfig();
  const auth = await login(config);
  await subscriptionEdit(config, auth, "subscribe", url, flags.title, flags.folder);
  process.stdout.write(`Added: ${url}\n`);
}

export async function feedDelete(id: string): Promise<void> {
  if (!id) {
    throw new CliError("MISSING_ARGUMENT", "Feed ID is required", "Usage: freshrss feed delete <id>");
  }

  const config = loadConfig();
  const auth = await login(config);

  // id is already in feed/URL format from feed list
  await subscriptionEdit(config, auth, "unsubscribe", id);
  process.stdout.write(`Deleted: ${id}\n`);
}
