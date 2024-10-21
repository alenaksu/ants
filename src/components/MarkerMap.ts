import {
    Application,
    Sprite,
    Texture,
    TextureSource,
    BlurFilter,
    Geometry,
    QuadGeometry,
    Shader,
    Filter,
    GlProgram,
    DefaultShader,
    Renderer,
    WebGLRenderer,
    BufferResource,
    RenderTexture,
} from 'pixi.js';
import { Config } from '../types';
import { clamp } from '../utils';

class FloatBufferResource extends BufferResource {}

const dissipateVertex = `
    in vec2 aPosition;
    out vec2 vTextureCoord;

    uniform vec4 uInputSize;
    uniform vec4 uOutputFrame;
    uniform vec4 uOutputTexture;

    vec4 filterVertexPosition( void ) {
        vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
        
        position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
        position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;

        return vec4(position, 0.0, 1.0);
    }

    vec2 filterTextureCoord( void ) {
        return aPosition * (uOutputFrame.zw * uInputSize.zw);
    }

    void main(void) {
        gl_Position = filterVertexPosition();
        vTextureCoord = filterTextureCoord();
    }
`;

const dissipateFragment = `
    in vec2 vTextureCoord;    
    out vec4 finalColor;
    
    uniform sampler2D uTexture;
    uniform float uEvaporationRate;
    uniform float uEvaporationThreshold;

    void main() {
        // guassian blur kernel
        mat3 kernel = mat3(
            1.0, 2.0, 1.0,
            2.0, 4.0, 2.0,
            1.0, 2.0, 1.0
        );
        float blurred = 0.0;
        float weightsSum = 0.0;
        for (int y = -1; y <= 1; y++) {
            for (int x = -1; x <= 1; x++) {
                vec2 neighborCoord = vTextureCoord + vec2(float(x), float(y));
                vec4 color = texture2D(uTexture, neighborCoord) * kernel[y][x];
                weightsSum += kernel[y][x];
                blurred += color.r;
            }
        }

        blurred /= weightsSum;
        blurred *= uEvaporationRate;

        // finalColor = blurred < uEvaporationThreshold 
        //     ? vec4(vec3(0.0), 1.0) 
        //     : vec4(vec3(blurred), 1.0);
        finalColor = texture2D(uTexture, vTextureCoord);
    }
`;

const createSprite = (
    width: number,
    height: number,
    data: Float32Array,
    config: Config
): Sprite => {
    const texture = RenderTexture.create({
        width: width,
        height: height,
        resource: data,
        scaleMode: 'nearest',
        antialias: false,
        format: 'r32float',
        addressMode: 'clamp-to-edge',
    });

    const blurFilter = new Filter({
        glProgram: GlProgram.from({
            fragment: dissipateFragment,
            vertex: dissipateVertex,
        }),
        resources: {
            config: {
                uEvaporationRate: {
                    type: 'f32',
                    value: config.marker.evaporationRate,
                },
                uEvaporationThreshold: {
                    type: 'f32',
                    value: config.marker.evaporationThreshold,
                },
            },
        },
    });

    const sprite = new Sprite({
        width: width,
        height: height,
        texture: texture,
        blendMode: 'add',
        zIndex: -1,
        filters: [blurFilter],
    });

    return sprite;
};

export class MarkerMap {
    private map!: Float32Array;
    private processor: Application;
    public mapSprite: Sprite;

    constructor(private app: Application, private config: Config) {
        this.map = new Float32Array(app.screen.width * app.screen.height).fill(0);

        const canvas = document.createElement('canvas');
        const offscreenCanvas = canvas.transferControlToOffscreen();
        const offscreenApp = new Application();
        const width = app.screen.width;
        const height = app.screen.height;

        offscreenApp.init({
            canvas: offscreenCanvas,
            width,
            height,
        });
        const sprite = createSprite(width, height, this.map, config);
        offscreenApp.stage.addChild(sprite);

        this.mapSprite = sprite;
        this.processor = offscreenApp;
    }

    private getIndex(x: number, y: number) {
        return Math.floor(y) * this.app.screen.width + Math.floor(x);
    }

    set(x: number, y: number, value: number): this {
        this.map[this.getIndex(x, y)] = value;

        return this;
    }

    get(x: number, y: number): number {
        return this.getByIndex(this.getIndex(x, y))!;
    }

    getByIndex(index: number): number {
        return this.map.at(index)!;
    }

    delete(x: number, y: number) {
        this.set(x, y, 0);
    }

    getAll() {
        return this.map;
    }

    get size() {
        return this.map.length;
    }

    releaseMarker(x: number, y: number, power: number, radius: number = 1) {
        const map = this.map;
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const cx = Math.floor(x) + dx;
                const cy = Math.floor(y) + dy;

                const index = this.getIndex(cx, cy);

                if (index >= 0 && index < map.length) {
                    map[index] = clamp(power + map[index], 0, this.config.marker.maxPower);
                }
            }
        }
    }

    evaporate() {
        this.mapSprite.texture.source.update();
        this.mapSprite.texture.update();

        this.processor.renderer.render(this.mapSprite, {
            renderTexture: this.mapSprite.texture as RenderTexture,
        });

        const renderer = this.processor.renderer as WebGLRenderer;
        // const renderer = this.app.renderer as WebGLRenderer;
        const gl = renderer.gl;
        const map = this.map;
        const width = gl.drawingBufferWidth;
        const height = gl.drawingBufferHeight;

        const renderTarget = renderer.renderTarget.getRenderTarget(this.mapSprite.texture);
        const glRenderTarget = renderer.renderTarget.getGpuRenderTarget(renderTarget);

        gl.bindFramebuffer(gl.FRAMEBUFFER, glRenderTarget.resolveTargetFramebuffer);
        gl.readBuffer(gl.COLOR_ATTACHMENT0);

        const tempData = new Float32Array(this.map.length * 4);
        gl.readPixels(
            0,
            0,
            gl.drawingBufferWidth,
            gl.drawingBufferHeight,
            gl.RGBA,
            gl.FLOAT,
            tempData
        );

        for (let i = 0; i < map.length; i++) {
            if (this.map[i] && tempData[i * 4] && this.map[i] !== tempData[i * 4]) {
                console.log({
                    i,
                    map: this.map[i],
                    temp: tempData[i * 4],
                });
            }
            this.map[i] = tempData[i * 4];
        }

        // // const width = this.app.screen.width;
        // // const height = this.app.screen.height;
        // const config = this.config;
        // // const map = this.map;

        // const currentMap = Array.from(map);
        // for (let x = 0; x < width; x++) {
        //     for (let y = 0; y < height; y++) {
        //         const index = y * width + x;
        //         const radius = 1;

        //         let average = currentMap[index];

        //         for (let dx = -radius; dx <= radius; dx++) {
        //             for (let dy = -radius; dy <= radius; dy++) {
        //                 const nx = x + dx;
        //                 const ny = y + dy;
        //                 const neighborIndex = ny * width + nx;

        //                 average += currentMap[neighborIndex] ?? 0;
        //             }
        //         }

        //         const total = (radius * 2 + 1) ** 2 + 1;
        //         map[index] = (average / total) * config.marker.evaporationRate;
        //         if (map[index] < config.marker.evaporationThreshold) {
        //             map[index] = 0;
        //         }
        //     }
        // }

        // this.mapSprite.texture.source.update();
        // this.mapSprite.texture.update();
    }
}
