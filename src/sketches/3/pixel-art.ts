import type p5 from "p5";
import "p5.quadrille";

function expect<T>(x: T, msg?: string): NonNullable<T> {
	if (x === null || x === undefined) {
		throw new Error(msg ?? "expected non-null value");
	}
	return x;
}

interface ArtAnimation {
	frames: p5.Image[];
	rate: number;
}

interface ArtAnimationState {
	since: number;
	looping: boolean;
	identifier: string;
}

export class Art {
	private static ART_URL = new URL("/art/", window.location.origin);

	public static async fromName(p: p5, name: string): Promise<Art> {
		const location = new URL(`${name}/`, Art.ART_URL);
		const canonURL = new URL("canon.png", location);

		const canonical = await p.loadImage(canonURL.href);
		return new Art(p, location, canonical);
	}

	private p: p5;

	private location: URL;

	private canonical: p5.Image;
	private animations: Map<string, ArtAnimation> = new Map();

	private animation: ArtAnimationState | null = null;

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

	private constructor(p: p5, location: URL, canonical: p5.Image) {
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

		const { rate, frames: frameCount } = await manifestResponse.json();

		if (typeof rate !== "number") {
			throw new TypeError();
		}
		if (typeof frameCount !== "number") {
			throw new TypeError();
		}

		const frames: p5.Image[] = [];
		for (let i = 0; i < frameCount; ++i) {
			const animLocator = new URL(`${i}.png`, animationURL);
			frames.push(await this.p.loadImage(animLocator.href));
		}

		const animation = {
			rate,
			frames,
		};

		this.animations.set(name, animation);
	}

	animate(identifier: string, looping: boolean = false) {
		if (!this.animations.has(identifier)) {
			throw new TypeError(
				`No se ha cargado una animación con el identificador "${identifier}".`,
			);
		}

		this.animation = {
			identifier,
			looping,
			since: this.p.millis(),
		};
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

		let w = width;
		let h = height;

		if (fit) {
			// a propósito, las dimensiones se basan en el tamaño canónico
			const propoW = h * (this.canonical.width / this.canonical.height);
			const propoH = w * (this.canonical.height / this.canonical.width);

			if (propoW > width) {
				h = propoH;
			} else {
				w = propoW;
			}
		}

		this.p.image(this.appearance, x, y, w, h);
		this.p.pop();
	}
}
