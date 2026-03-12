import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { CliError } from "./error.js";

export interface Config {
  url: string;
  user: string;
  apiPassword: string;
}

function loadConfigFile(): Partial<Config> {
  const configPath = join(homedir(), ".config", "freshrss-cli", "config.json");
  if (!existsSync(configPath)) {
    return {};
  }
  try {
    const raw = readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      url: parsed.url ?? parsed.FRESHRSS_URL,
      user: parsed.user ?? parsed.FRESHRSS_USER,
      apiPassword: parsed.apiPassword ?? parsed.FRESHRSS_API_PASSWORD,
    };
  } catch {
    return {};
  }
}

export function loadConfig(): Config {
  const fileConfig = loadConfigFile();

  const url = process.env.FRESHRSS_URL ?? fileConfig.url;
  const user = process.env.FRESHRSS_USER ?? fileConfig.user;
  const apiPassword = process.env.FRESHRSS_API_PASSWORD ?? fileConfig.apiPassword;

  if (!url) {
    throw new CliError(
      "CONFIG_MISSING",
      "FRESHRSS_URL is not set",
      "Set FRESHRSS_URL environment variable or add 'url' to ~/.config/freshrss-cli/config.json",
    );
  }
  if (!user) {
    throw new CliError(
      "CONFIG_MISSING",
      "FRESHRSS_USER is not set",
      "Set FRESHRSS_USER environment variable or add 'user' to ~/.config/freshrss-cli/config.json",
    );
  }
  if (!apiPassword) {
    throw new CliError(
      "CONFIG_MISSING",
      "FRESHRSS_API_PASSWORD is not set",
      "Set FRESHRSS_API_PASSWORD environment variable or add 'apiPassword' to ~/.config/freshrss-cli/config.json",
    );
  }

  return { url: url.replace(/\/$/, ""), user, apiPassword };
}
