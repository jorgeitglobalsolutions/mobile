const pickedBySession: Record<string, string[]> = {};

export function queuePickedExercise(sessionId: string, name: string): void {
  if (!sessionId.trim()) return;
  const n = name.trim();
  if (!n) return;
  if (!pickedBySession[sessionId]) pickedBySession[sessionId] = [];
  pickedBySession[sessionId]!.push(n);
}

export function consumePickedExercises(sessionId: string): string[] {
  if (!sessionId.trim()) return [];
  const list = pickedBySession[sessionId] ?? [];
  if (!list.length) return [];
  const out = [...list];
  delete pickedBySession[sessionId];
  return out;
}

