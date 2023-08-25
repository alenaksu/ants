export function* range(to: number, from: number = 0) {
    for (let i = from; i < to; i++) {
        yield i;
    }
}

export const clamp = (n: number, min: number, max: number) => Math.min(Math.max(min, n), max);

export const calculateDistance = (
    entity0: { x: number; y: number },
    entity1: { x: number; y: number }
) => {
    const dx = entity1.x - entity0.x;
    const dy = entity1.y - entity0.y;
    return Math.sqrt(dx ** 2 + dy ** 2);
};

export const colors  = {
  ant: 0xe76f51,
  food: 0x06d6a0,
  home: 0xef476f

  //0xef476f : 0x06d6a0
}