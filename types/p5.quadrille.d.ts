import type p5 from "p5";
import type Quadrille from "p5.quadrille";

declare module "./p5.quadrille" {
	interface p5 {
		createQuadrille(cols: number, rows: number): Quadrille;
		createQuadrille(matrix: unknown[]): Quadrille;
		createQuadrille(width: number, array: unknown[]): Quadrille;
		createQuadrille(): Quadrille;
		drawQuadrille(
			quadrille: Quadrille,
			options?:
				| {
						cellLength: number;
						outline: p5.Color;
						outlineWeight: number;
						textColor: p5.Color;
						textZoom: number;
						textFont: p5.Font;
						x: number;
						y: number;
						row: number;
						col: number;
						filter:
							| Array
							| Set
							| ((m: any) => boolean)
							| { value: any; row: number; col: number };
						graphics: p5.Graphics;
				  }
				| Record<string, any>,
		);
	}
}
