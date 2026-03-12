import TurndownService from "turndown";

export function formatTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((h, i) => {
    const colValues = rows.map((r) => (r[i] ?? "").length);
    return Math.max(h.length, ...colValues);
  });

  const pad = (s: string, w: number) => s + " ".repeat(Math.max(0, w - s.length));

  const headerLine = headers.map((h, i) => pad(h, widths[i])).join("  ");
  const separatorLine = widths.map((w) => "-".repeat(w)).join("  ");
  const dataLines = rows.map((row) =>
    row.map((cell, i) => pad(cell ?? "", widths[i])).join("  "),
  );

  return [headerLine, separatorLine, ...dataLines].join("\n") + "\n";
}

export function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2) + "\n";
}

let turndownInstance: TurndownService | null = null;

export function htmlToMarkdown(html: string): string {
  if (!turndownInstance) {
    turndownInstance = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });
  }
  return turndownInstance.turndown(html);
}
