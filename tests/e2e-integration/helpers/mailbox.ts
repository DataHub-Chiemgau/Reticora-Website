import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Postfach des SMTP-Fängers: Mailpit (RETICORA_IT_MAILPIT_URL, im Compose-Stack http://127.0.0.1:8025)
 * oder der lokale Fänger aus scripts/integration-local.sh (RETICORA_IT_MAIL_DIR, eine JSON-Datei je Mail).
 */
export interface Mail {
  /** alle Empfänger (To, Cc, Bcc bzw. Umschlag), klein geschrieben */
  recipients: string[];
  replyTo: string[];
  subject: string;
}

export const SALES = process.env.RETICORA_IT_SALES ?? 'vertrieb@example.com';
const MAILPIT = process.env.RETICORA_IT_MAILPIT_URL ?? (process.env.RETICORA_IT_MAIL_DIR ? '' : 'http://127.0.0.1:8025');
const DIR = process.env.RETICORA_IT_MAIL_DIR ?? '';

type Address = { Address: string };
const addrs = (l: Address[] | null | undefined) => (l ?? []).map((a) => a.Address.toLowerCase());

async function mailpit(): Promise<Mail[]> {
  const list = (await (await fetch(`${MAILPIT}/api/v1/messages?limit=1000`)).json()) as { messages: { ID: string }[] };
  const out: Mail[] = [];
  for (const { ID } of list.messages ?? []) {
    const m = (await (await fetch(`${MAILPIT}/api/v1/message/${encodeURIComponent(ID)}`)).json()) as {
      To: Address[]; Cc: Address[]; Bcc: Address[]; ReplyTo: Address[]; Subject: string;
    };
    out.push({ recipients: [...new Set([...addrs(m.To), ...addrs(m.Cc), ...addrs(m.Bcc)])], replyTo: addrs(m.ReplyTo), subject: m.Subject });
  }
  return out;
}

function directory(): Mail[] {
  if (!existsSync(DIR)) return [];
  return readdirSync(DIR)
    .filter((f) => f.endsWith('.json') && !f.startsWith('.'))
    .map((f) => JSON.parse(readFileSync(join(DIR, f), 'utf8')) as { rcpt_tos: string[]; data: string })
    .map(({ rcpt_tos, data }) => {
      const head = data.split(/\r?\n\r?\n/)[0].replace(/\r?\n[ \t]+/g, ' ');
      const header = (name: string) => new RegExp(`^${name}:(.*)$`, 'im').exec(head)?.[1] ?? '';
      const emails = (v: string) => (v.match(/[^\s<>,"]+@[^\s<>,"]+/g) ?? []).map((a) => a.toLowerCase());
      return { recipients: [...new Set([...rcpt_tos.map((a) => a.toLowerCase()), ...emails(header('To')), ...emails(header('Cc'))])], replyTo: emails(header('Reply-To')), subject: header('Subject').trim() };
    });
}

export const allMails = (): Promise<Mail[]> => (DIR ? Promise.resolve(directory()) : mailpit());

/** Mails, die diese Adresse betreffen: als Antwortadresse (Vertriebsmail) oder als Empfänger (darf es nie geben). */
export async function mailsAbout(email: string) {
  const all = await allMails();
  const e = email.toLowerCase();
  return { toSales: all.filter((m) => m.replyTo.includes(e) && m.recipients.length === 1 && m.recipients[0] === SALES).length, replyTo: all.filter((m) => m.replyTo.includes(e)).length, toVisitor: all.filter((m) => m.recipients.includes(e)).length };
}

let n = 0;
export const uniqueEmail = (tag: string) => `it-${tag}-${Date.now()}-${process.pid}-${n++}@example.com`;
