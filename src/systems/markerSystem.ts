import { Sprite, Texture, TextureSource, createTexture } from 'pixi.js';
import { World } from '../components/World';
import { Config, System } from '../types';
import { colors, lerp } from '../utils';

const createSprite = (world: World): [Sprite, Uint8ClampedArray] => {
    const width = world.app.screen.width;
    const height = world.app.screen.height;

    const textureData = new Uint8ClampedArray(width * height * 4);

    const texture = Texture.from(TextureSource.from({
        width: width,
        height: height,
        resource: textureData,
        scaleMode: 'nearest',
        antialias: false
    }));

    const sprite = new Sprite({
        width: width,
        height: height,
        texture: texture,
        blendMode: 'add',
        zIndex: -1,
    });

    return [sprite, textureData];
}

export const createMarkerSystem: System = async (world: World, config: Config) => {
    const [spriteHome, homeData] = createSprite(world);
    const [spriteFood, foodData] = createSprite(world);

    world.app.stage.addChild(spriteHome);
    world.app.stage.addChild(spriteFood);

    let lastTime = 0;

    return (ticker) => {
        world.evaporateMarkers();
        world.dissipateMarkers();

        const alpha = 0x00;
        for (let i = 0; i < world.homeMap.length; i++) {
            const index = i * 4;
            homeData[index] = lerp(world.homeMap[i], 0, colors.home >> 16 & 0xff);
            homeData[index + 1] = lerp(world.homeMap[i], 0, colors.home >> 8 & 0xff);
            homeData[index + 2] = lerp(world.homeMap[i], 0, colors.home & 0xff);
            homeData[index + 3] = alpha;
        }

        for (let i = 0; i < world.foodMap.length; i++) {
            const index = i * 4;
            foodData[index] = lerp(world.foodMap[i], 0, colors.food >> 16 & 0xff);
            foodData[index + 1] = lerp(world.foodMap[i], 0, colors.food >> 8 & 0xff);
            foodData[index + 2] = lerp(world.foodMap[i], 0, colors.food & 0xff);
            foodData[index + 3] = alpha;
        }

        spriteHome.texture.source.update();
        spriteFood.texture.source.update();
        spriteHome.texture.update();
        spriteFood.texture.update();
    };
};
