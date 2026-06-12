/**
 * Local dev SMTP delivery to Mailpit (bundled with `supabase start`).
 * Used when RESEND_API_KEY is unset so transactional emails appear in the Mailpit UI.
 */

export type DevSmtpInput = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type DevSmtpResult = { ok: true } | { ok: false; error: string };

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const BOUNDARY = "containerly-dev-mailpit-boundary";

function devSmtpHost(): string {
  return Deno.env.get("DEV_SMTP_HOST")?.trim() || "inbucket";
}

function devSmtpPort(): number {
  const raw = Deno.env.get("DEV_SMTP_PORT")?.trim();
  const port = raw ? Number(raw) : 1025;
  return Number.isFinite(port) && port > 0 ? port : 1025;
}

function parseMailboxAddress(value: string): string {
  const match = value.match(/<([^>]+)>/);
  return (match ? match[1] : value).trim();
}

function encodeSubject(subject: string): string {
  if (/^[\x20-\x7E]*$/.test(subject)) return subject;
  const bytes = encoder.encode(subject);
  const base64 = btoa(String.fromCharCode(...bytes));
  return `=?UTF-8?B?${base64}?=`;
}

function buildMimeMessage(input: DevSmtpInput): string {
  const text = input.text ?? input.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const headers = [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${encodeSubject(input.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${BOUNDARY}"`,
  ];
  const parts = [
    `--${BOUNDARY}`,
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
    `--${BOUNDARY}`,
    "Content-Type: text/html; charset=utf-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    input.html,
    `--${BOUNDARY}--`,
  ];
  return [...headers, "", ...parts].join("\r\n");
}

function dotStuff(body: string): string {
  return body
    .split("\n")
    .map((line) => (line.startsWith(".") ? `.${line}` : line))
    .join("\r\n");
}

class SmtpReader {
  private buffer = "";

  constructor(private conn: Deno.Conn) {}

  async readLine(): Promise<string> {
    while (!this.buffer.includes("\n")) {
      const buf = new Uint8Array(1024);
      const n = await this.conn.read(buf);
      if (n === null) throw new Error("SMTP connection closed");
      this.buffer += decoder.decode(buf.subarray(0, n));
    }
    const idx = this.buffer.indexOf("\n");
    const line = this.buffer.slice(0, idx).replace(/\r$/, "");
    this.buffer = this.buffer.slice(idx + 1);
    return line;
  }

  async readResponse(): Promise<void> {
    while (true) {
      const line = await this.readLine();
      if (/^\d{3} /.test(line)) {
        const code = Number(line.slice(0, 3));
        if (code >= 400) throw new Error(line);
        return;
      }
    }
  }
}

async function writeLine(conn: Deno.Conn, line: string): Promise<void> {
  await conn.write(encoder.encode(`${line}\r\n`));
}

async function command(conn: Deno.Conn, reader: SmtpReader, line: string): Promise<void> {
  await writeLine(conn, line);
  await reader.readResponse();
}

export async function sendViaDevSmtp(input: DevSmtpInput): Promise<DevSmtpResult> {
  let conn: Deno.Conn | undefined;
  try {
    conn = await Deno.connect({ hostname: devSmtpHost(), port: devSmtpPort() });
    const reader = new SmtpReader(conn);
    await reader.readResponse();
    await command(conn, reader, "EHLO localhost");
    const fromAddress = parseMailboxAddress(input.from);
    await command(conn, reader, `MAIL FROM:<${fromAddress}>`);
    await command(conn, reader, `RCPT TO:<${input.to}>`);
    await command(conn, reader, "DATA");
    await writeLine(conn, dotStuff(buildMimeMessage(input)));
    await writeLine(conn, ".");
    await reader.readResponse();
    await command(conn, reader, "QUIT");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Dev SMTP send failed" };
  } finally {
    try {
      conn?.close();
    } catch {
      /* ignore */
    }
  }
}
