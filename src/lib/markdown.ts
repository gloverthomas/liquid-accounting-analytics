/** Line-level markdown parsing for answers; inline formatting is handled by AnswerMarkdown. */

export type Block = { kind: "p"; text: string } | { kind: "ul" | "ol"; items: string[] };

export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  for (const rawLine of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const ordered = line.match(/^\d+[.)]\s+(.*)$/);
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    const kind = ordered ? "ol" : bullet ? "ul" : null;
    if (kind) {
      const last = blocks.at(-1);
      const item = (ordered ?? bullet)![1];
      if (last && last.kind === kind) blocks[blocks.length - 1] = { kind, items: [...last.items, item] };
      else blocks.push({ kind, items: [item] });
      continue;
    }
    // Headings are flattened to bold paragraphs to keep answers compact.
    blocks.push({ kind: "p", text: heading ? `**${heading[1]}**` : line });
  }
  return blocks;
}
