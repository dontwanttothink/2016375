import type p5 from "p5";
import { expect } from "../utils";

interface EntityArtAnimation {
	frames: p5.Image[];
	rate: number;
}

interface EntityArtAnimationState {
	since: number;
	looping: boolean;
	identifier: string;
}

export class EntityArt {
	private static ENTITY_ART_URL = new URL(
		"/art/entities/",
		window.location.origin,
	);

	public static async fromName(p: p5, name: string): Promise<EntityArt> {
		const location = new URL(`${name}/`, EntityArt.ENTITY_ART_URL);
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
		return new EntityArt(p, location, canonical);
	}

	private p: p5;

	private location: URL;

	private canonical: p5.Image;
	private animations: Map<string, EntityArtAnimation> = new Map();

	private animation: EntityArtAnimationState | null = null;

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
		return this.canonical;
	}

	center: [number, number];

	private constructor(p: p5, location: URL, canonical: p5.Image) {
		this.p = p;
		this.location = location;
		this.canonical = canonical;
		this.center = [canonical.width / 2, canonical.height / 2];
	}

	async loadAnimation(name: string) {
		const animationURL = new URL(`animations/${name}/`, this.location);
		const manifestURL = new URL("meta.json", animationURL);
		const manifestResponse = await fetch(manifestURL);

		if (!manifestResponse.ok) {
			throw new Error(manifestResponse.statusText);
		}

		const { rate, frames: frameCount } = await manifestResponse.json();

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
		{ fit }: { fit: boolean } = { fit: false },
	) {
		this.p.push();
		this.p.noSmooth();
		const { origin, w, h } = this.properties([x, y], width, height, { fit });
		this.p.image(this.appearance, ...origin, w, h);
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
		let w = width;
		let h = height;

		if (fit) {
			const propoW = h * (this.canonical.width / this.canonical.height);
			const propoH = w * (this.canonical.height / this.canonical.width);

			if (propoW > width) {
				h = propoH;
			} else {
				w = propoW;
			}
		}

		w *= this.appearance.width / this.canonical.width;
		h *= this.appearance.height / this.canonical.height;

		const scaleX = w / this.canonical.width;
		const scaleY = h / this.canonical.height;

		const origin: [number, number] = [
			positionX - this.center[0] * scaleX,
			positionY - this.center[1] * scaleY,
		];

		return { origin, w, h, scaleX, scaleY };
	}
}
