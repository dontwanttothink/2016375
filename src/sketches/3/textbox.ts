import type p5 from "p5";
import type { Entity } from "./entity";
import { expect } from "./utils";

export interface TextboxButton {
	label: string;
	id: number;
}

export class Textbox {
	static MARGIN = 10;

	static PADDING = 12;
	static GAP = 12;

	p: p5;

	#isVisible: boolean = false;
	#lastActiveInteraction: {
		buttons: TextboxButton[];
		entity: Entity;
	} | null = null;

	width?: number;
	height?: number;
	origin?: [number, number];

	#opacity: number = 0;

	constructor(p: p5) {
		this.p = p;
	}

	show(buttons: Iterable<[number, string]>, onBehalfOf: Entity) {
		this.#lastActiveInteraction = {
			buttons: [...buttons].map(([id, label]) => ({
				id,
				label,
			})),
			entity: onBehalfOf,
		};
		this.#isVisible = true;
	}

	hide() {
		this.#isVisible = false;
	}

	*#buttonRects(): Generator<
		[number, { x: number; y: number; w: number; h: number }]
	> {
		const n = expect(this.#lastActiveInteraction).buttons.length;

		const totalGap = Textbox.GAP * (n - 1);
		const availableWidth = expect(this.width) - totalGap - Textbox.PADDING * 2;
		const availableHeight =
			expect(this.height) - Textbox.MARGIN - Textbox.PADDING * 2;

		const w = availableWidth / n;
		const h = availableHeight;

		for (let i = 0; i < n; ++i) {
			yield [
				i,
				{
					x: expect(this.origin)[0] + Textbox.PADDING + Textbox.GAP * i + w * i,
					y: expect(this.origin)[1] + Textbox.MARGIN + Textbox.PADDING,
					h,
					w,
				},
			];
		}
	}

	draw(origin: [number, number], width: number, height: number) {
		// actualizar geometría
		this.origin = origin;
		this.width = width;
		this.height = height;

		// actualizar opacidad
		if (this.#isVisible) {
			this.#opacity = Math.min(1, this.#opacity + this.p.deltaTime / 100);
		} else {
			this.#opacity = Math.max(0, this.#opacity - this.p.deltaTime / 100);
		}

		// dibujar
		this.p.push();
		this.p.noStroke();
		this.p.fill(86, 60, 17, this.#opacity * 255);
		this.p.rectMode(this.p.CORNER);

		this.p.rect(
			origin[0],
			origin[1] + Textbox.MARGIN,
			width,
			height - Textbox.MARGIN,
		);

		this.p.textFont("Pixelify Sans Variable");
		this.p.textSize(16);

		const activeInteraction = this.#lastActiveInteraction;

		if (activeInteraction) {
			this.p.textAlign(this.p.CENTER, this.p.CENTER);

			for (const [i, { x, y, w, h }] of this.#buttonRects()) {
				const hovering =
					this.p.mouseX >= x &&
					this.p.mouseX <= x + w &&
					this.p.mouseY >= y &&
					this.p.mouseY <= y + h;

				this.p.fill(
					255,
					this.p.constrain(
						(this.#opacity - 0.7) * ((hovering ? 70 : 60) / (1 - 0.7)),
						0,
						255,
					),
				);
				this.p.rect(x, y, w, h);

				this.p.fill(255, this.#opacity * 255);
				this.p.text(activeInteraction.buttons[i].label, x + w / 2, y + h / 2);
			}
		}

		this.p.pop();
	}

	#buttonAt([x, y]: [number, number]) {
		if (!this.#isVisible || !this.#lastActiveInteraction) return null;

		for (const [i, { x: rx, y: ry, w, h }] of this.#buttonRects()) {
			if (x >= rx && x <= rx + w && y >= ry && y <= ry + h) {
				return expect(this.#lastActiveInteraction.buttons.at(i));
			}
		}

		return null;
	}

	interactiveAt(location: [number, number]) {
		return !!this.#buttonAt(location);
	}

	clickedAt(location: [number, number]) {
		if (!this.#isVisible || !this.#lastActiveInteraction) return null;

		const target = this.#buttonAt(location);
		if (target) {
			this.#lastActiveInteraction.entity.interacted(target.id);
		}
	}
}
