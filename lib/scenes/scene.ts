import { EffectComposer, Pass, RenderPass } from 'glaxier';
import { Symbols } from 'glaxier/symbols';
import * as THREE from 'three';

export interface SceneOptions {
    camera: THREE.Camera;
    effects?: Pass[];
    objects: THREE.Object3D[];
    renderer?: THREE.Renderer;
    loop?: Function;
    setup?: Function;
    attached?: boolean;
}

export class Scene {
    readonly __scn__ = Symbols.SCENE;
    readonly composer: EffectComposer;
    readonly renderer: THREE.Renderer;
    readonly scene: THREE.Scene;
    readonly camera: THREE.Camera;
    readonly effects: Pass[];
    readonly objects: THREE.Object3D[];
    readonly loop: Function;
    readonly setup: Function;

    private _attached: boolean;
    get attached() { return this._attached };
    get lights() {
        return this.objects.filter(o => o.type.includes('Light'));
    }
    get meshes() {
        return this.objects.filter(o => o.type.includes('Mesh'));
    }

    constructor(readonly options: SceneOptions) {
        const scene = this.scene = new THREE.Scene;
        const { renderer, camera, objects, effects, setup, loop, attached } = options;

        if (renderer) {
            this.renderer = renderer;
        }
        else {
            this.renderer = new THREE.WebGLRenderer;
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
        this.camera = camera;
        this.objects = objects ?? [];

        if(this.objects.length) this.scene.add(...this.objects);

        if(effects) {
            this.composer = new EffectComposer(this.renderer as THREE.WebGLRenderer);
            this.effects = effects;

            this.composer.addPass(new RenderPass(scene, camera));
            for(const effect of effects) this.composer.addPass(effect);
        }

        // Run the preload
        if (setup) {
            this.setup = setup;
        }

        // Attach the animation loop
        if (loop) {
            this.loop = loop;
        }

        if (attached) {
            this.attach();
        }
    }

    attach() {
        if (!this.attached) {
            if(this.setup) this.setup.call(this);
            const renderer = this.renderer as THREE.WebGLRenderer;
            renderer.setAnimationLoop(this.loop.bind(this));
            document.body.appendChild(this.renderer.domElement);
            this._attached = true
        }
    }
}
