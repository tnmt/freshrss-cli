import { loadConfig } from "../config.js";
import {
  login,
  getStreamContents,
  getItemContents,
  setItemTag,
  removeItemTag,
} from "../client.js";
import { formatTable, formatJson, htmlToMarkdown } from "../output.js";
import { CliError } from "../error.js";

export async function articleList(flags: {
  json: boolean;
  feed?: string;
  folder?: string;
  count: number;
  all?: boolean;
}): Promise<void> {
  const config = loadConfig();
  const auth = await login(config);

  const streamId = flags.folder
    ? `user/-/label/${flags.folder}`
    : flags.feed ?? "user/-/state/com.google/reading-list";
  const excludeTag = flags.all ? undefined : "user/-/state/com.google/read";

  const data = await getStreamContents(
    config,
    auth,
    streamId,
    flags.count,
    undefined,
    excludeTag,
  );

  if (flags.json) {
    process.stdout.write(formatJson(data.items));
    return;
  }

  const headers = ["ID", "TITLE", "FEED", "DATE"];
  const rows = data.items.map((item) => [
    item.id,
    item.title.length > 60 ? item.title.slice(0, 57) + "..." : item.title,
    item.origin?.title ?? "",
    new Date(item.published * 1000).toISOString().slice(0, 10),
  ]);
  process.stdout.write(formatTable(headers, rows));
}

export async function articleShow(
  id: string,
  flags: { json: boolean },
): Promise<void> {
  if (!id) {
    throw new CliError(
      "MISSING_ARGUMENT",
      "Article ID is required",
      "Usage: freshrss article show <id>",
    );
  }

  const config = loadConfig();
  const auth = await login(config);

  const data = await getItemContents(config, auth, [id]);

  if (!data.items || data.items.length === 0) {
    throw new CliError(
      "NOT_FOUND",
      `Article not found: ${id}`,
      "Use 'freshrss article list' to see available articles",
    );
  }

  const item = data.items[0];

  if (flags.json) {
    process.stdout.write(formatJson(item));
    return;
  }

  const url = item.canonical?.[0]?.href ?? "";
  const date = new Date(item.published * 1000).toISOString();
  const markdown = htmlToMarkdown(item.summary.content);

  const output = [
    `# ${item.title}`,
    "",
    `- **Author**: ${item.author || "(unknown)"}`,
    `- **Feed**: ${item.origin?.title ?? "(unknown)"}`,
    `- **Date**: ${date}`,
    `- **URL**: ${url}`,
    "",
    "---",
    "",
    markdown,
    "",
  ];

  process.stdout.write(output.join("\n"));
}

export async function articleRead(id: string): Promise<void> {
  if (!id) {
    throw new CliError(
      "MISSING_ARGUMENT",
      "Article ID is required",
      "Usage: freshrss article read <id>",
    );
  }

  const config = loadConfig();
  const auth = await login(config);
  await setItemTag(config, auth, id, "user/-/state/com.google/read");

  process.stdout.write(`Marked as read: ${id}\n`);
}

export async function articleUnread(id: string): Promise<void> {
  if (!id) {
    throw new CliError(
      "MISSING_ARGUMENT",
      "Article ID is required",
      "Usage: freshrss article unread <id>",
    );
  }

  const config = loadConfig();
  const auth = await login(config);
  await removeItemTag(config, auth, id, "user/-/state/com.google/read");

  process.stdout.write(`Marked as unread: ${id}\n`);
}

export async function articleStar(id: string): Promise<void> {
  if (!id) {
    throw new CliError(
      "MISSING_ARGUMENT",
      "Article ID is required",
      "Usage: freshrss article star <id>",
    );
  }

  const config = loadConfig();
  const auth = await login(config);
  await setItemTag(config, auth, id, "user/-/state/com.google/starred");

  process.stdout.write(`Starred: ${id}\n`);
}

export async function articleUnstar(id: string): Promise<void> {
  if (!id) {
    throw new CliError(
      "MISSING_ARGUMENT",
      "Article ID is required",
      "Usage: freshrss article unstar <id>",
    );
  }

  const config = loadConfig();
  const auth = await login(config);
  await removeItemTag(config, auth, id, "user/-/state/com.google/starred");

  process.stdout.write(`Unstarred: ${id}\n`);
}
