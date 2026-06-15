import type p5 from "p5";
import "p5.quadrille";

function expect<T>(x: T, msg?: string): NonNullable<T> {
	if (x === null || x === undefined) {
		throw new Error(msg ?? "expected non-null value");
	}
	return x;
}

class ArtMatrix {
	constructor(
		public width: number,
		public pixels: p5.Color[],
	) {
		if (pixels.length % width !== 0) {
			throw new TypeError(
				`The number of pixels, ${pixels.length}, is not a multiple of the provided width, ${width}.`,
			);
		}
	}

	get height() {
		return this.pixels.length / this.width;
	}
}

interface ArtAnimation {
	frames: ArtMatrix[];
	rate: number;
}

interface ArtAnimationState {
	since: number;
	identifier: string;
}

export class Art {
	private static ART_URL = new URL("/art/", window.location.origin);

	private static pixelsToColors(p: p5, pixels: Uint8ClampedArray) {
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

	private static intoColorArray(p: p5, url: URL): Promise<ArtMatrix> {
		return new Promise((resolve, reject) => {
			const canvas = document.createElement("canvas");
			const context = expect(canvas.getContext("2d"));
			const image = new Image();

			image.onload = () => {
				canvas.width = image.naturalWidth;
				canvas.height = image.naturalHeight;

				context.drawImage(image, 0, 0);

				const imageData = context.getImageData(
					0,
					0,
					canvas.width,
					canvas.height,
				);
				resolve(
					new ArtMatrix(canvas.width, Art.pixelsToColors(p, imageData.data)),
				);

				URL.revokeObjectURL(image.src);
			};

			image.onerror = (e) => {
				URL.revokeObjectURL(image.src);
				reject(e);
			};

			image.src = url.href;
		});
	}

	public static async fromName(p: p5, name: string): Promise<Art> {
		const location = new URL(`${name}/`, Art.ART_URL);
		console.debug(location);
		const canonURL = new URL("canon.png", location);
		console.debug(canonURL);

		const canonical = await Art.intoColorArray(p, canonURL);
		return new Art(p, location, canonical);
	}

	private static drawMatrix(
		p: p5,
		[x, y]: [number, number],
		matrix: ArtMatrix,
		width: number,
		height: number,
	) {
		p.push();
		const { width: widthInPixels, height: heightInPixels, pixels } = matrix;

		const heightPerPixel = height / heightInPixels;
		const widthPerPixel = width / widthInPixels;

		p.rectMode(p.CORNERS);
		for (let i = 0; i < widthInPixels; ++i) {
			for (let j = 0; j < heightInPixels; ++j) {
				const color = pixels[widthInPixels * j + i];

				p.noStroke();
				p.fill(color);

				p.rect(
					Math.round(x + widthPerPixel * i),
					Math.round(y + heightPerPixel * j),
					Math.round(x + widthPerPixel * (i + 1)),
					Math.round(y + heightPerPixel * (j + 1)),
				);
			}
		}
		p.pop();
	}

	private p: p5;

	private location: URL;

	private canonical: ArtMatrix;
	private animations: Map<string, ArtAnimation> = new Map();

	private animation: ArtAnimationState | null = null;

	private constructor(p: p5, location: URL, canonical: ArtMatrix) {
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
		if (typeof frameCount !== "number") {
			throw new TypeError();
		}

		const frames: ArtMatrix[] = [];
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

	draw([x, y]: [number, number], width: number, height: number) {
		Art.drawMatrix(this.p, [x, y], this.canonical, width, height);
	}
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
