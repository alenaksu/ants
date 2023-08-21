export function* range(to: number, from: number = 0) {
  for (let i = from; i < to; i++) {
    yield i;
  }
}

export const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(min, n), max);

export const calculateDistance = (entity0: any, entity1: any) => {
  const dx = entity1.position.x - entity0.position.x;
  const dy = entity1.position.y - entity0.position.y;
  return Math.sqrt(dx ** 2 + dy ** 2);
};
