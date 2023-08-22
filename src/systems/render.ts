import type { Query } from "geotic/src/Query";
import type { World } from "geotic/src/World";
import type { Entity } from "geotic/src/Entity";
import { Renderable } from "../components/Renderable";
import { Application, BLEND_MODES, Graphics, ParticleContainer, Sprite } from "pixi.js";
import { Ant } from "../graphics/Ant";
import Position from "../components/Position";
import { HomeMark } from "../graphics/HomeMark";
import { FoodMark } from "../graphics/FoodMark";
import { Food } from "../graphics/Food";
import { Home } from "../graphics/Home";
import Marker from "../components/Marker";
import Velocity from "../components/Velocity";

const getObject = (type: string) => {
    switch (type) {
        case "ant":
            return new Ant();
        case "homeMarker":
            return new HomeMark();
        case "foodMarker":
            return new FoodMark();
        case "food":
            return new Food();
        case "home":
            return new Home();
    }
};

export default function createRenderSystem(world: World, app: Application) {
    const renderableEntities: Query = world.createQuery({
        all: [Renderable, Position],
    });
    const entitiesGraphics = new Map<Entity, Graphics | Sprite>();
    const markerContainer = new ParticleContainer(
        20_000,
        {
            alpha: true,
            position: false,
            rotation: false,
            scale: false,
            tint: false,
            uvs: false,
            vertices: false,
        },
        20_000,
        true
    );
    markerContainer.blendMode = BLEND_MODES.ADD_NPM;

    app.stage.addChild(markerContainer);

    renderableEntities.onEntityAdded((entity: any) => {
        const obj = getObject(entity.renderable.type);

        if (obj) {
            entitiesGraphics.set(entity, obj);
            if (obj instanceof Sprite) {
                markerContainer.addChild(obj);
            } else {
                app.stage.addChild(obj);
            }
        }
    });

    renderableEntities.onEntityRemoved((entity: any) => {
        const obj = entitiesGraphics.get(entity)!;
        entitiesGraphics.delete(entity);

        if (obj instanceof Sprite) {
            markerContainer.removeChild(obj);
        } else {
            app.stage.removeChild(obj);
        }
    });

    return () => {
        for (const entity of renderableEntities.get()) {
            const obj = entitiesGraphics.get(entity);
            if (!obj) continue;

            obj.x = entity.position.x;
            obj.y = entity.position.y;

            if (entity.has(Marker)) {
                obj.alpha = entity.marker.power;
            }

            if (entity.has(Velocity)) {
                obj.rotation = entity.velocity.direction;
            }
        }
    };
}
