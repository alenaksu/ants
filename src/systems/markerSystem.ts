import { Sprite, Texture } from 'pixi.js';
import { World } from '../components/World';

export const createMarkerSystem = async (world: World) => {
    const textureData = new ImageData(world.app.screen.width, world.app.screen.height);
    const texture = Texture.from({
        width: world.app.screen.width,
        height: world.app.screen.height,
        resource: await createImageBitmap(textureData),
    });
    const sprite = new Sprite({
        x: 0,
        y: 0,
        width: world.app.screen.width,
        height: world.app.screen.height,
        texture,
    });

    world.app.stage.addChild(sprite);
    return () => {
        for (const marker of world.markers) {
            if (marker) {
                const index =
                    Math.floor(marker.y) * world.app.screen.width + Math.floor(marker.x) * 4;

                textureData.data[index] = (marker.tint >> 16) & 0xff;
                textureData.data[index + 1] = (marker.tint >> 8) & 0xff;
                textureData.data[index + 2] = marker.tint & 0xff;
                textureData.data[index + 3] = 255;
            }
        }
        texture.update();
    };
};
