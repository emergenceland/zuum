// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function log(...args: any[]): void {
  if (process.env.SUPPRESS_LOGGING === "true") {
    return;
  }

  // eslint-disable-next-line no-console
  console.log(...args);
}
