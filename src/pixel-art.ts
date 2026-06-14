import type p5 from "p5";
import "p5.quadrille";

function expect<T>(x: T, msg?: string): NonNullable<T> {
	if (x === null || x === undefined) {
		throw new Error(msg ?? "expected non-null value");
	}
	return x;
}

interface ArtAnimation {
	frames: p5.Color[][];
	rate: number;
}

interface ArtAnimationState {
	since: number;
	identifier: string;
}

export class Art {
	static ART_URL = new URL("/art");

	static pixelsToColors(p: p5, pixels: Uint8ClampedArray) {
		const out: p5.Color[] = [];
		p.push();
		p.colorMode(p.RGB, 255);
		for (let i = 0; i < pixels.length; i += 4) {
			out.push(
				p.color(
					Number(pixels[i]),
					Number(pixels[i + 1]),
					Number(pixels[i + 2]),
					Number(pixels[i + 3]),
				),
			);
		}
		p.pop();
		return out;
	}

	static intoColorArray(p: p5, url: URL): Promise<p5.Color[]> {
		return new Promise((resolve, reject) => {
			const canvas = document.createElement("canvas");
			const context = expect(canvas.getContext("2d"));
			const image = new Image();

			image.onload = () => {
				canvas.width = image.width;
				canvas.height = image.height;

				context.drawImage(image, 0, 0);

				const imageData = context.getImageData(
					0,
					0,
					canvas.width,
					canvas.height,
				);
				resolve(Art.pixelsToColors(p, imageData.data));

				URL.revokeObjectURL(image.src);
			};

			image.onerror = (e) => {
				URL.revokeObjectURL(image.src);
				reject(e);
			};

			image.src = url.href;
		});
	}

	static async fromName(p: p5, name: string): Art {
		const location = new URL(`${name}`, Art.ART_URL);
		const canonURL = new URL("canon.png", location);

		const canonical = await Art.intoColorArray(p, canonURL);
		return new Art(p, location, canonical);
	}

	private p: p5;

	private location: URL;

	private canonical: p5.Color[];
	private animations: Map<string, ArtAnimation> = new Map();

	animation: ArtAnimationState | null = null;

	private constructor(p: p5, location: URL, canonical: p5.Color[]) {
		this.p = p;
		this.location = location;
		this.canonical = canonical;
	}

	async loadAnimation(name: string) {
		const animationURL = new URL(`animations/${name}`, this.location);
		const manifestURL = new URL("meta.json", animationURL);
		const manifestResponse = await fetch(manifestURL);

		if (!manifestResponse.ok) {
			throw new Error(manifestResponse.statusText);
		}

		const { rate, frames: frameCount } = await manifestResponse.json();

		if (typeof rate !== "number") {
			throw new TypeError();
		}
		if (typeof frameCount === "number") {
			throw new TypeError();
		}

		const frames: p5.Color[][] = [];
		for (let i = 0; i < frameCount; ++i) {
			const animLocator = new URL(`${i}.png`, animationURL);
			frames.push(await Art.intoColorArray(this.p, animLocator));
		}

		const animation = {
			rate,
			frames,
		};

		this.animations.set(name, animation);
	}

	draw() {}
}

// export function Art(p: p5, pixels: Uint8ClampedArray, width: number): Art {
// 	if (pixels.length % width !== 0) {
// 		throw new Error(
// 			`El número de pixeles no es divisible por la longitud dada. (${pixels.length}/${width})`,
// 		);
// 	}

// 	const height = pixels.length / width;

// 	const colors = pixelsToColors(p, pixels);
// 	const quadrille = p.createQuadrille(width, colors);
// 	return (x, y, size) => {
// 		p.drawQuadrille(quadrille, {
// 			outlineWeight: 0,
// 			outline: null,
// 			x,
// 			y,
// 			cellLength: Math.min(size / width, size / height),
// 		});
// 	};
// }
