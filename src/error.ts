export class CliError extends Error {
  constructor(
    public code: string,
    message: string,
    public hint?: string,
  ) {
    super(message);
    this.name = "CliError";
  }
}

export function handleError(err: unknown): never {
  if (err instanceof CliError) {
    const output: { code: string; message: string; hint?: string } = {
      code: err.code,
      message: err.message,
    };
    if (err.hint) {
      output.hint = err.hint;
    }
    process.stderr.write(JSON.stringify(output, null, 2) + "\n");
    process.exit(1);
  }

  if (err instanceof Error) {
    const output = {
      code: "UNKNOWN_ERROR",
      message: err.message,
    };
    process.stderr.write(JSON.stringify(output, null, 2) + "\n");
    process.exit(1);
  }

  const output = {
    code: "UNKNOWN_ERROR",
    message: String(err),
  };
  process.stderr.write(JSON.stringify(output, null, 2) + "\n");
  process.exit(1);
}
