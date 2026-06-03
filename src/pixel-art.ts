import type p5 from "p5";
import "p5.quadrille";

function pixelsToColors(p: p5, pixels: Uint8ClampedArray) {
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

export type Art = (x: number, y: number, size: number) => void;
export function Art(p: p5, pixels: Uint8ClampedArray, width: number): Art {
	if (pixels.length % width !== 0) {
		throw new Error(
			`El número de pixeles no es divisible por la longitud dada. (${pixels.length}/${width})`,
		);
	}

	const height = pixels.length / width;

	const colors = pixelsToColors(p, pixels);
	const quadrille = p.createQuadrille(width, colors);
	return (x, y, size) => {
		p.drawQuadrille(quadrille, {
			outlineWeight: 0,
			outline: null,
			x,
			y,
			cellLength: Math.min(size / width, size / height),
		});
	};
}
