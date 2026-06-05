export type NoteAttachment = {
  name: string;
  url: string;
};

export type ParsedNoteBody = {
  text: string;
  attachments: NoteAttachment[];
};

const ATTACHMENT_TOKEN_REGEX = /^\[\[attachment\|(.+?)\|(.+?)\]\]$/;

function tryDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getFileNameFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const raw = parts[parts.length - 1] ?? 'attachment';
    return tryDecode(raw);
  } catch {
    return 'attachment';
  }
}

export function serializeNoteBody(text: string, attachments: NoteAttachment[]) {
  const lines: string[] = [];
  const trimmed = text.trim();
  if (trimmed) lines.push(trimmed);

  for (const attachment of attachments) {
    lines.push(
      `[[attachment|${encodeURIComponent(attachment.name)}|${encodeURIComponent(attachment.url)}]]`
    );
  }

  return lines.join('\n');
}

export function parseNoteBody(body: string): ParsedNoteBody {
  const attachments: NoteAttachment[] = [];
  const textLines: string[] = [];

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      textLines.push(rawLine);
      continue;
    }

    const tokenMatch = line.match(ATTACHMENT_TOKEN_REGEX);
    if (tokenMatch) {
      attachments.push({
        name: tryDecode(tokenMatch[1]),
        url: tryDecode(tokenMatch[2]),
      });
      continue;
    }

    if (line.toLowerCase().startsWith('attachment: ')) {
      const url = line.slice('attachment: '.length).trim();
      if (/^https?:\/\//i.test(url)) {
        attachments.push({ name: getFileNameFromUrl(url), url });
        continue;
      }
    }

    textLines.push(rawLine);
  }

  return {
    text: textLines.join('\n').trim(),
    attachments,
  };
}
