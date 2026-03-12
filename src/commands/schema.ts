import { formatJson } from "../output.js";

const SCHEMA = {
  name: "freshrss",
  version: "0.1.0",
  description: "CLI tool for FreshRSS (Google Reader API compatible)",
  globalFlags: {
    "--json": { description: "Output as JSON instead of human-readable table" },
    "--help": { description: "Show help" },
    "--version": { description: "Show version" },
  },
  commands: {
    feed: {
      description: "Manage RSS feeds",
      actions: {
        list: {
          description: "List subscribed feeds",
          args: [],
          flags: {},
        },
        show: {
          description: "Show feed details",
          args: [{ name: "id", required: true, description: "Feed ID" }],
          flags: {},
        },
      },
    },
    article: {
      description: "Manage articles",
      actions: {
        list: {
          description: "List unread articles",
          args: [],
          flags: {
            "--feed": {
              description: "Filter by feed ID",
              type: "string",
            },
            "--count": {
              description: "Limit results (default 20)",
              type: "number",
              default: 20,
            },
          },
        },
        show: {
          description: "Show article content as markdown",
          args: [{ name: "id", required: true, description: "Article ID" }],
          flags: {},
        },
        read: {
          description: "Mark article as read",
          args: [{ name: "id", required: true, description: "Article ID" }],
          flags: {},
        },
        unread: {
          description: "Mark article as unread",
          args: [{ name: "id", required: true, description: "Article ID" }],
          flags: {},
        },
        star: {
          description: "Star an article",
          args: [{ name: "id", required: true, description: "Article ID" }],
          flags: {},
        },
        unstar: {
          description: "Unstar an article",
          args: [{ name: "id", required: true, description: "Article ID" }],
          flags: {},
        },
      },
    },
    schema: {
      description: "Output CLI specification as JSON",
      actions: {},
    },
  },
  config: {
    envVars: ["FRESHRSS_URL", "FRESHRSS_USER", "FRESHRSS_API_PASSWORD"],
    configFile: "~/.config/freshrss-cli/config.json",
  },
};

export function schema(): void {
  process.stdout.write(formatJson(SCHEMA));
}
