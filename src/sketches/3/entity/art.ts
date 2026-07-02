import type p5 from "p5";

function expect<T>(x: T, msg?: string): NonNullable<T> {
	if (x === null || x === undefined) {
		throw new Error(msg ?? "expected non-null value");
	}
	return x;
}

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

		const frames: p5.Image[] = [];
		for (let i = 0; i < frameCount; ++i) {
			const animLocator = new URL(`${i}.png`, animationURL);

			let frame: p5.Image;
			try {
				frame = await this.p.loadImage(animLocator.href);
			} catch (e) {
				throw new TypeError(
					`No se pudo cargar el fotograma ${i} de la animación "${name}" (es decir, ${animLocator.href}). La animación "${name}" dice tener ${frameCount} fotogramas en sus metadatos.`,
					{ cause: e },
				);
			}

			frames.push(frame);
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

		w *= this.appearance.width / this.canonical.width;
		h *= this.appearance.height / this.canonical.height;

		this.p.image(
			this.appearance,
			x - this.center[0] * (w / this.canonical.width),
			y - this.center[1] * (h / this.canonical.height),
			w,
			h,
		);

		if (import.meta.env.MODE === "DEBUG") {
			this.p.push();
			this.p.stroke(0, 100);
			this.p.fill(200, 50);
			this.p.circle(x, y, 10);

			this.p.noFill();
			this.p.rect(
				x - this.center[0] * (w / this.canonical.width),
				y - this.center[1] * (h / this.canonical.height),
				w,
				h,
			);

			this.p.pop();
		}

		this.p.pop();
	}
}
