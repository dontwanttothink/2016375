import type p5 from "p5";
import { expect } from "./utils";

interface ArtAnimation {
	frames: p5.Image[];
	rate: number;
}

interface ArtAnimationState {
	since: number;
	looping: boolean;
	identifier: string;
}

interface ArtOverrideState {
	identifier: string;
	frame: number;
}

export class Art {
	private static ART_URL = new URL("/art/", window.location.origin);

	public static async fromName(
		p: p5,
		name: string,
		folder: string,
	): Promise<Art> {
		const location = new URL(`${folder}/${name}/`, Art.ART_URL);
		const canonURL = new URL("canon.png", location);

		let canonical: p5.Image;
		try {
			canonical = await p.loadImage(canonURL.href);
		} catch (e) {
			throw new TypeError(
				`No se pudo cargar la imagen "${name}" (es decir, ${canonURL.href})`,
				{ cause: e },
			);
		}
		return new Art(p, location, canonical);
	}

	private p: p5;

	private location: URL;

	private canonical: p5.Image;
	private animations: Map<string, ArtAnimation> = new Map();

	getAnimationProperties(identifier: string) {
		return this.animations.get(identifier);
	}

	private animation: ArtAnimationState | null = null;
	private override: ArtOverrideState | null = null;

	get appearance(): p5.Image {
		if (this.animation) {
			const { identifier, since, looping } = this.animation;
			const { frames, rate } = expect(this.animations.get(identifier));

			const t = (this.p.millis() - since) / 1000;
			const n = Math.floor(t * rate);

			if (n > frames.length && !looping) {
				this.immediatelyStopAnimating();
				return this.appearance;
			}

			return frames[n % frames.length];
		}

		if (this.override) {
			const { identifier, frame } = this.override;
			const { frames } = expect(this.animations.get(identifier));
			return expect(frames.at(frame));
		}

		return this.canonical;
	}

	protected constructor(p: p5, location: URL, canonical: p5.Image) {
		this.p = p;
		this.location = location;
		this.canonical = canonical;
	}

	async loadAnimation(name: string) {
		const animationURL = new URL(`animations/${name}/`, this.location);
		const manifestURL = new URL("meta.json", animationURL);
		const manifestResponse = await fetch(manifestURL);

		if (!manifestResponse.ok) {
			throw new Error(manifestResponse.statusText);
		}

		let manifest: unknown;
		try {
			manifest = await manifestResponse.json();
		} catch (e) {
			throw new Error(
				`No se pudieron cargar los metadatos en "${manifestURL.href}"`,
				{ cause: e },
			);
		}

		if (!manifest || typeof manifest !== "object") {
			throw new TypeError();
		}
		if (!("rate" in manifest)) {
			throw new TypeError();
		}
		if (!("frames" in manifest)) {
			throw new TypeError();
		}

		const { rate, frames: frameCount } = manifest;

		if (typeof rate !== "number") {
			throw new TypeError();
		}
		if (typeof frameCount !== "number") {
			throw new TypeError();
		}

		const promisedFrames = [];
		for (let i = 0; i < frameCount; ++i) {
			const animLocator = new URL(`${i}.png`, animationURL);
			promisedFrames.push(this.p.loadImage(animLocator.href));
		}

		let frames: p5.Image[];
		try {
			frames = await Promise.all(promisedFrames);
		} catch (e) {
			throw new TypeError(
				`No se pudo al menos un fotograma de la animación "${name}". La animación "${name}" dice tener ${frameCount} fotogramas en sus metadatos.`,
				{ cause: e },
			);
		}

		const animation = {
			rate,
			frames,
		};

		this.animations.set(name, animation);
	}

	animate(identifier: string, looping: boolean = false, restart = false) {
		if (!this.animations.has(identifier)) {
			throw new TypeError(
				`No se ha cargado una animación con el identificador "${identifier}".`,
			);
		}

		if (this.animation?.identifier === identifier && !restart) {
			this.animation = {
				identifier,
				looping,
				since: this.animation.since,
			};
		} else {
			this.animation = {
				identifier,
				looping,
				since: this.p.millis(),
			};
		}
	}

	overrideBaseAppearance(withAnimationIdentifier: string, atFrame: number) {
		this.override = {
			identifier: withAnimationIdentifier,
			frame: atFrame,
		};
	}

	removeBaseAppearanceOverride() {
		this.override = null;
	}

	/**
	 * Inmediatamente regresa la entidad a su apariencia canónica. Esta función
	 * es idempotente.
	 */
	immediatelyStopAnimating() {
		this.animation = null;
	}

	draw(
		[x, y]: [number, number],
		width: number,
		height: number,
		{ fit = false, opacity = 1 }: { fit?: boolean; opacity?: number } = {},
	) {
		this.p.push();
		this.p.noSmooth();

		const { origin, w, h } = this.properties([x, y], width, height, { fit });

		// tint() no funciona por un bug de p5, creo. entonces usamos la api de
		// canvas directamente :(

		const ctx = this.p.drawingContext as CanvasRenderingContext2D;
		const previousGlobalAlpha = ctx.globalAlpha;

		ctx.globalAlpha = opacity * previousGlobalAlpha;
		this.p.image(this.appearance, ...origin, w, h);
		ctx.globalAlpha = previousGlobalAlpha;

		if (import.meta.env.MODE === "DEBUG") {
			this.p.noFill();
			this.p.stroke(0, 100);
			this.p.rect(...origin, w, h);
		}
		this.p.pop();
	}

	/**
	 * Proporciona información geométrica sobre esta imagen dados parámetros
	 * idénticos a los usados al dibujar.
	 *
	 * Las unidades están dadas en pixeles del espacio del escenario.
	 */
	properties(
		[positionX, positionY]: [number, number],
		width: number,
		height: number,
		{ fit }: { fit: boolean },
	) {
		// dimensiones con las que se dibujaría la apariencia canónica
		let canonicalWidth = width;
		let canonicalHeight = height;

		if (fit) {
			const propoW =
				canonicalHeight * (this.canonical.width / this.canonical.height);
			const propoH =
				canonicalWidth * (this.canonical.height / this.canonical.width);

			if (propoW > width) {
				canonicalHeight = propoH;
			} else {
				canonicalWidth = propoW;
			}
		}

		// cada pixel de la apariencia actual conserva el mismo tamaño en pantalla
		// que tendría un pixel de la apariencia canónica
		const scaleX = canonicalWidth / this.canonical.width;
		const scaleY = canonicalHeight / this.canonical.height;

		const w = this.appearance.width * scaleX;
		const h = this.appearance.height * scaleY;

		// centrada horizontalmente en la posición, y con su borde inferior donde
		// estaría el de la apariencia canónica
		const origin: [number, number] = [
			positionX - w / 2,
			positionY + canonicalHeight / 2 - h,
		];

		return { origin, w, h, scaleX, scaleY };
	}
}
