import type Quadrille from "p5.quadrille";

declare module "./p5.quadrille" {
	interface p5 {
		createQuadrille(cols: number, rows: number): Quadrille;
		createQuadrille(): Quadrille;
		drawQuadrille(quadrille: Quadrille);
	}
}
