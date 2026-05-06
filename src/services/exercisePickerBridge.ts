const pickedQueue: string[] = [];

export function queuePickedExercise(name: string): void {
  const n = name.trim();
  if (!n) return;
  pickedQueue.push(n);
}

export function consumePickedExercises(): string[] {
  if (!pickedQueue.length) return [];
  const out = [...pickedQueue];
  pickedQueue.length = 0;
  return out;
}

