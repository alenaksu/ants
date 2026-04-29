import { Application, Sprite, WebGLRenderer, RenderTexture } from 'pixi.js';
import { Config } from '../types';
import { clamp } from '../utils';

const quadVert = `#version 300 es
    layout(location = 0) in vec2 aPosition;
    out vec2 vUv;
    void main(void) {
        gl_Position = vec4(aPosition, 0.0, 1.0);
        vUv = (aPosition + 1.0) / 2.0;
    }
`;

// Combined dissipate + deposit shader.
// Blurs the previous accumulated state, then adds fresh deposits.
// Deposits are folded into the blur kernel so everything decays uniformly.
const dissipateFragment = `#version 300 es
    precision highp float;
    in vec2 vUv;
    out vec4 outColor;

    uniform sampler2D uTexture;
    uniform sampler2D uDeposits;
    uniform float uEvaporationRate;
    uniform float uEvaporationThreshold;
    uniform float uMaxPower;

    void main() {
    vec2 texelSize = 1.0 / vec2(textureSize(uTexture, 0));

        float blurred = 0.0;
        float weights[9];
        weights[0] = 1.0; weights[1] = 2.0; weights[2] = 1.0;
        weights[3] = 2.0; weights[4] = 4.0; weights[5] = 2.0;
        weights[6] = 1.0; weights[7] = 2.0; weights[8] = 1.0;

        int k = 0;
        for (int y = -1; y <= 1; y++) {
            for (int x = -1; x <= 1; x++) {
                vec2 coord = vUv + vec2(float(x), float(y)) * texelSize;
                blurred += texture(uTexture, coord).r * weights[k];
                k++;
            }
        }

        float result = clamp((blurred / 16.0) * uEvaporationRate + texture(uDeposits, vUv).r, 0.0, uMaxPower);
        if (result < uEvaporationThreshold) result = 0.0;

        outColor = vec4(result, 0.0, 0.0, 1.0);
    }
`;

const colorizeFragment = `#version 300 es
    precision highp float;
    in vec2 vUv;
    out vec4 outColor;

    uniform sampler2D uTexture;
    uniform vec3 uTint;
    uniform float uMaxPower;

    void main() {
        float value = texture(uTexture, vUv).r;
        float normalized = clamp(value, 0.0, 1.0);
        outColor = vec4(uTint * normalized, normalized);
    }
`;

function compileShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(`Shader compile error:\n${gl.getShaderInfoLog(shader)}`);
    }
    return shader;
}

function createProgram(gl: WebGL2RenderingContext, vertSrc: string, fragSrc: string): WebGLProgram {
    const program = gl.createProgram()!;
    gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vertSrc));
    gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fragSrc));
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`Program link error:\n${gl.getProgramInfoLog(program)}`);
    }
    return program;
}

interface GlState {
    program: WebGLProgram | null;
    vao: WebGLVertexArrayObject | null;
    framebuffer: WebGLFramebuffer | null;
    activeTexture: number;
    texture0: WebGLTexture | null;
    texture1: WebGLTexture | null;
    viewport: Int32Array;
    blend: boolean;
}

function createR32FTexture(width: number, height: number): RenderTexture {
    return RenderTexture.create({
        width,
        height,
        scaleMode: 'nearest',
        antialias: false,
        format: 'r32float',
        addressMode: 'clamp-to-edge',
    });
}

export class MarkerMap {
    // CPU mirror — populated by readPixels each frame, read by antSystem for steering
    private map: Float32Array;
    // Deposit-only buffer — new deposits per frame, cleared after GPU upload
    private depositMap: Float32Array;

    // [current, next] ping-pong pair. GPU source of truth.
    // current = accumulated state from previous frame (read input)
    // next    = write target for this frame's dissipate output
    private dataTextures: [RenderTexture, RenderTexture];
    // RGBA display texture for the stage sprite
    private displayTexture: RenderTexture;

    private gl!: WebGL2RenderingContext;
    private dissipateProgram!: WebGLProgram;
    private colorizeProgram!: WebGLProgram;
    private quadVao!: WebGLVertexArrayObject;
    private depositGlTexture!: WebGLTexture;
    private glReady = false;

    // Cached readPixels format queried from the driver
    private readFormat!: number;
    private readType!: number;
    private readStride!: number;

    private tintR: number;
    private tintG: number;
    private tintB: number;

    public mapSprite: Sprite;

    constructor(
        private app: Application,
        private config: Config,
        tint: number
    ) {
        const width = app.screen.width;
        const height = app.screen.height;

        this.map = new Float32Array(width * height).fill(0);
        this.depositMap = new Float32Array(width * height).fill(0);

        this.tintR = ((tint >> 16) & 0xff) / 255;
        this.tintG = ((tint >> 8) & 0xff) / 255;
        this.tintB = (tint & 0xff) / 255;

        this.dataTextures = [createR32FTexture(width, height), createR32FTexture(width, height)];
        this.displayTexture = RenderTexture.create({
            width,
            height,
            scaleMode: 'nearest',
            antialias: false,
        });

        this.mapSprite = new Sprite({
            width,
            height,
            texture: this.displayTexture,
            blendMode: 'add',
            zIndex: -1,
        });
    }

    dispose() {
        this.mapSprite.destroy();
        this.dataTextures[0].destroy(true);
        this.dataTextures[1].destroy(true);
        this.displayTexture.destroy(true);
        this.glReady = false;
    }

    private initGl() {
        const renderer = this.app.renderer as WebGLRenderer;
        const gl = renderer.gl as WebGL2RenderingContext;
        this.gl = gl;

        this.dissipateProgram = createProgram(gl, quadVert, dissipateFragment);
        this.colorizeProgram = createProgram(gl, quadVert, colorizeFragment);

        // Fullscreen quad VAO
        const positions = new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]);
        const vbo = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        this.quadVao = gl.createVertexArray()!;
        gl.bindVertexArray(this.quadVao);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // Raw GL texture for deposit uploads
        this.depositGlTexture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, this.depositGlTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);

        // Force PixiJS to allocate GPU storage for all textures and framebuffers
        for (const rt of [...this.dataTextures, this.displayTexture]) {
            renderer.texture.initSource(rt.source);
            const renderTarget = renderer.renderTarget.getRenderTarget(rt);
            renderer.renderTarget.getGpuRenderTarget(renderTarget);
        }

        // Query the driver's preferred readPixels format for r32float FBOs
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.getFramebuffer(this.dataTextures[0]));
        this.readFormat = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT);
        this.readType = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        this.readStride = this.readFormat === gl.RED ? 1 : 4;

        this.glReady = true;
    }

    private saveGlState(): GlState {
        const activeTexture = this.gl.getParameter(this.gl.ACTIVE_TEXTURE);

        const gl = this.gl;
        gl.activeTexture(gl.TEXTURE0);
        const texture0 = gl.getParameter(gl.TEXTURE_BINDING_2D);
        gl.activeTexture(gl.TEXTURE1);
        const texture1 = gl.getParameter(gl.TEXTURE_BINDING_2D);

        gl.activeTexture(activeTexture);

        return {
            program: gl.getParameter(gl.CURRENT_PROGRAM),
            vao: gl.getParameter(gl.VERTEX_ARRAY_BINDING),
            framebuffer: gl.getParameter(gl.FRAMEBUFFER_BINDING),
            activeTexture: gl.getParameter(gl.ACTIVE_TEXTURE),
            texture0,
            texture1,
            viewport: gl.getParameter(gl.VIEWPORT),
            blend: gl.getParameter(gl.BLEND),
        };
    }

    private restoreGlState(state: GlState) {
        const gl = this.gl;
        gl.useProgram(state.program);
        gl.bindVertexArray(state.vao);
        gl.bindFramebuffer(gl.FRAMEBUFFER, state.framebuffer);
        gl.viewport(state.viewport[0], state.viewport[1], state.viewport[2], state.viewport[3]);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, state.texture0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, state.texture1);
        gl.activeTexture(state.activeTexture);
        if (state.blend) gl.enable(gl.BLEND);
        else gl.disable(gl.BLEND);
    }

    private getGlTexture(rt: RenderTexture): WebGLTexture {
        const renderer = this.app.renderer as WebGLRenderer;
        return renderer.texture.getGlSource(rt.source).texture;
    }

    private getFramebuffer(rt: RenderTexture): WebGLFramebuffer {
        const renderer = this.app.renderer as WebGLRenderer;
        const renderTarget = renderer.renderTarget.getRenderTarget(rt);
        const glRenderTarget = renderer.renderTarget.getGpuRenderTarget(renderTarget);
        return glRenderTarget.resolveTargetFramebuffer ?? glRenderTarget.framebuffer;
    }

    private drawQuad(
        program: WebGLProgram,
        outputFbo: WebGLFramebuffer,
        setUniforms: (
            gl: WebGL2RenderingContext,
            loc: (name: string) => WebGLUniformLocation | null
        ) => void
    ) {
        const gl = this.gl;
        const width = this.app.screen.width;
        const height = this.app.screen.height;

        gl.useProgram(program);
        gl.disable(gl.BLEND);
        gl.bindFramebuffer(gl.FRAMEBUFFER, outputFbo);
        gl.viewport(0, 0, width, height);

        const loc = (name: string) => gl.getUniformLocation(program, name);
        setUniforms(gl, loc);

        gl.bindVertexArray(this.quadVao);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }

    private getIndex(x: number, y: number) {
        return Math.floor(y) * this.app.screen.width + Math.floor(x);
    }

    set(x: number, y: number, value: number): this {
        this.depositMap[this.getIndex(x, y)] = value;
        return this;
    }

    get(x: number, y: number): number {
        return this.getByIndex(this.getIndex(x, y))!;
    }

    getByIndex(index: number): number {
        return this.map.at(index)!;
    }

    delete(x: number, y: number) {
        this.depositMap[this.getIndex(x, y)] = 0;
    }

    getAll() {
        return this.map;
    }

    get size() {
        return this.map.length;
    }

    releaseMarker(x: number, y: number, power: number, radius: number = 1) {
        const depositMap = this.depositMap;
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const cx = Math.floor(x) + dx;
                const cy = Math.floor(y) + dy;
                const index = this.getIndex(cx, cy);
                if (index >= 0 && index < depositMap.length) {
                    depositMap[index] = clamp(
                        power + depositMap[index],
                        0,
                        this.config.marker.maxPower
                    );
                }
            }
        }
    }

    evaporate() {
        const renderer = this.app.renderer as WebGLRenderer;
        if (!this.gl) this.gl = renderer.gl as WebGL2RenderingContext;

        const saved = this.saveGlState();

        if (!this.glReady) this.initGl();

        const gl = this.gl;
        const width = this.app.screen.width;
        const height = this.app.screen.height;

        const [current, next] = this.dataTextures;

        // 1. Upload depositMap → depositGlTexture
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.depositGlTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.R32F,
            width,
            height,
            0,
            gl.RED,
            gl.FLOAT,
            this.depositMap
        );

        // 2. Dissipate + deposit pass: read current + deposits → write next
        this.drawQuad(this.dissipateProgram, this.getFramebuffer(next), (gl, loc) => {
            // Bind current state to unit 0
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.getGlTexture(current));
            gl.uniform1i(loc('uTexture'), 0);
            // Deposits already bound to unit 1
            gl.uniform1i(loc('uDeposits'), 1);
            gl.uniform1f(loc('uEvaporationRate'), this.config.marker.evaporationRate);
            gl.uniform1f(loc('uEvaporationThreshold'), this.config.marker.evaporationThreshold);
            gl.uniform1f(loc('uMaxPower'), this.config.marker.maxPower);
        });

        // 4. Read back GPU → CPU (best-effort, for ant steering)
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.getFramebuffer(next));
        gl.readBuffer(gl.COLOR_ATTACHMENT0);

        const tempData = new Float32Array(this.map.length * this.readStride);
        gl.readPixels(0, 0, width, height, this.readFormat, this.readType, tempData);
        for (let i = 0; i < this.map.length; i++) {
            this.map[i] = tempData[i * this.readStride];
        }

        // 4. Swap: next becomes current for the next frame
        this.dataTextures = [next, current];

        // 5. Clear deposit buffer
        this.depositMap.fill(0);

        // 6. Colorize pass: read next → write displayTexture
        this.drawQuad(this.colorizeProgram, this.getFramebuffer(this.displayTexture), (gl, loc) => {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.getGlTexture(next));
            gl.uniform1i(loc('uTexture'), 0);
            gl.uniform3f(loc('uTint'), this.tintR, this.tintG, this.tintB);
            gl.uniform1f(loc('uMaxPower'), this.config.marker.maxPower);
        });

        // 7. Restore GL state
        this.restoreGlState(saved);
    }
}
