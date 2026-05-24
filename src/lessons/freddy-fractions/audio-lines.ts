import dialogueData from "./tutor/dialogue.json";

export function freddyLineLookup(key: string): string | undefined {
  return (dialogueData.lines as Record<string, string>)[key];
}
