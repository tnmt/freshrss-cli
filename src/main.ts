#!/usr/bin/env bun

import { feedList, feedShow } from "./commands/feed.js";
import { articleList, articleShow, articleRead, articleUnread, articleStar, articleUnstar } from "./commands/article.js";
import { schema } from "./commands/schema.js";
import { handleError, CliError } from "./error.js";

const VERSION = "0.1.0";

interface ParsedArgs {
  resource: string;
  action: string;
  positional: string[];
  flags: Record<string, string | boolean>;
}

function parseArgs(argv: string[]): ParsedArgs {
  // argv[0] = bun, argv[1] = script path, rest = user args
  const args = argv.slice(2);

  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg;
      // Check if next arg is a value (not another flag)
      if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        flags[key] = args[i + 1];
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  return {
    resource: positional[0] ?? "",
    action: positional[1] ?? "",
    positional: positional.slice(2),
    flags,
  };
}

function showHelp(): void {
  const help = `freshrss - CLI tool for FreshRSS (Google Reader API compatible)

Usage: freshrss <resource> <action> [id] [--flags]

Resources:
  feed       Manage RSS feeds
  article    Manage articles
  schema     Output CLI specification as JSON

Feed commands:
  feed list                          List subscribed feeds
  feed show <id>                     Show feed details

Article commands:
  article list                       List unread articles
  article list --feed <feed-id>      Filter by feed
  article list --folder <name>       Filter by folder (category)
  article list --count <n>           Limit results (default 20)
  article show <id>                  Show article content (markdown)
  article read <id>                  Mark as read
  article unread <id>                Mark as unread
  article star <id>                  Star article
  article unstar <id>                Unstar article

Global flags:
  --json       Output as JSON
  --help       Show this help
  --version    Show version
`;
  process.stdout.write(help);
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv);

  if (parsed.flags["--help"] || parsed.resource === "help") {
    showHelp();
    return;
  }

  if (parsed.flags["--version"] || parsed.resource === "version") {
    process.stdout.write(`freshrss ${VERSION}\n`);
    return;
  }

  const jsonOutput = parsed.flags["--json"] === true;

  switch (parsed.resource) {
    case "feed":
      switch (parsed.action) {
        case "list":
          await feedList({ json: jsonOutput });
          break;
        case "show":
          await feedShow(parsed.positional[0], { json: jsonOutput });
          break;
        default:
          throw new CliError(
            "UNKNOWN_ACTION",
            `Unknown feed action: ${parsed.action || "(none)"}`,
            "Available actions: list, show",
          );
      }
      break;

    case "article":
      switch (parsed.action) {
        case "list": {
          const feed = parsed.flags["--feed"];
          const folder = parsed.flags["--folder"];
          const countRaw = parsed.flags["--count"];
          const count = typeof countRaw === "string" ? parseInt(countRaw, 10) : 20;
          await articleList({
            json: jsonOutput,
            feed: typeof feed === "string" ? feed : undefined,
            folder: typeof folder === "string" ? folder : undefined,
            count,
          });
          break;
        }
        case "show":
          await articleShow(parsed.positional[0], { json: jsonOutput });
          break;
        case "read":
          await articleRead(parsed.positional[0]);
          break;
        case "unread":
          await articleUnread(parsed.positional[0]);
          break;
        case "star":
          await articleStar(parsed.positional[0]);
          break;
        case "unstar":
          await articleUnstar(parsed.positional[0]);
          break;
        default:
          throw new CliError(
            "UNKNOWN_ACTION",
            `Unknown article action: ${parsed.action || "(none)"}`,
            "Available actions: list, show, read, unread, star, unstar",
          );
      }
      break;

    case "schema":
      schema();
      break;

    case "":
      showHelp();
      break;

    default:
      throw new CliError(
        "UNKNOWN_RESOURCE",
        `Unknown resource: ${parsed.resource}`,
        "Available resources: feed, article, schema",
      );
  }
}

main().catch(handleError);
