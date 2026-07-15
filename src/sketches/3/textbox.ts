import type p5 from "p5";
import { Art } from "./art";
import type { ProtagonistEntity } from "./characters/protagonist";
import type { Entity } from "./entity";
import { BatteryDisplay } from "./hud/battery";
import { expect } from "./utils";

export interface TextboxButton {
	label: string;
	id: number;
}

export enum TextboxDisplayKind {
	Buttons,
	Energy,
	Message,
}

type TextboxDisplay =
	| {
			kind: TextboxDisplayKind.Buttons;
			buttons: TextboxButton[];
			entity: Entity;
	  }
	| {
			kind: TextboxDisplayKind.Energy;
			entity: Entity;
			batteryDisplay: BatteryDisplay;
	  }
	| {
			kind: TextboxDisplayKind.Message;
			message: string;
	  };

export class Textbox {
	static MARGIN = 10;

	static PADDING = 12;
	static GAP = 12;

	p: p5;

	#isVisibleUntil: number = -Infinity;
	#lastActiveTextboxDisplay: TextboxDisplay | null = null;

	width?: number;
	height?: number;
	origin?: [number, number];

	#opacity: number = 0;

	#batteryArt: Art;

	public static async create(p: p5): Promise<Textbox> {
		const batteryArt = await Art.fromName(p, "battery", "hud");
		await batteryArt.loadAnimation("draining");
		await batteryArt.loadAnimation("reloading");

		return new Textbox(p, batteryArt);
	}

	private constructor(p: p5, batteryArt: Art) {
		this.#batteryArt = batteryArt;
		this.p = p;
	}

	/**
	 * Indica si el cuadro debería estar visible en este instante, según el
	 * momento programado para su desaparición.
	 */
	get #isVisible(): boolean {
		return this.p.millis() < this.#isVisibleUntil;
	}

	showButtons(buttons: Iterable<[number, string]>, onBehalfOf: Entity) {
		this.#lastActiveTextboxDisplay = {
			kind: TextboxDisplayKind.Buttons,
			buttons: [...buttons].map(([id, label]) => ({
				id,
				label,
			})),
			entity: onBehalfOf,
		};
		this.#isVisibleUntil = Infinity;
	}

	showEnergy(
		entity: ProtagonistEntity,
		{ reloading = false }: { reloading?: boolean } = {},
	) {
		this.#lastActiveTextboxDisplay = {
			kind: TextboxDisplayKind.Energy,
			entity,
			batteryDisplay: new BatteryDisplay(this.p, this.#batteryArt, entity, {
				reloading,
			}),
		};
		this.#isVisibleUntil = Infinity;
	}

	showMessage(message: string) {
		this.#lastActiveTextboxDisplay = {
			kind: TextboxDisplayKind.Message,
			message,
		};
		this.#isVisibleUntil = Infinity;
	}

	hide(at: number = -Infinity) {
		if (this.#isVisible) {
			this.#isVisibleUntil = at;
		}
	}

	*#buttonRects(
		n: number,
	): Generator<[number, { x: number; y: number; w: number; h: number }]> {
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

		const activeInteraction = this.#lastActiveTextboxDisplay;

		if (activeInteraction?.kind === TextboxDisplayKind.Buttons) {
			this.p.textAlign(this.p.CENTER, this.p.CENTER);

			for (const [i, { x, y, w, h }] of this.#buttonRects(
				activeInteraction.buttons.length,
			)) {
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
		} else if (activeInteraction?.kind === TextboxDisplayKind.Energy) {
			const contentTop = origin[1] + Textbox.MARGIN + Textbox.PADDING;
			const contentHeight = height - Textbox.MARGIN - Textbox.PADDING * 2;

			// reservamos un recuadro a la derecha para la batería, que se ajusta a
			// su interior conservando sus proporciones
			const batteryBoxWidth = contentHeight * 1.5;
			activeInteraction.batteryDisplay.tick();
			activeInteraction.batteryDisplay.draw(
				[
					origin[0] + width - Textbox.PADDING - batteryBoxWidth / 2,
					contentTop + contentHeight / 2,
				],
				batteryBoxWidth,
				contentHeight,
				this.#opacity,
			);

			// el texto ocupa el espacio a la izquierda del recuadro de la batería
			this.p.textAlign(this.p.LEFT, this.p.TOP);
			this.p.fill(255, this.#opacity * 255);

			const x = origin[0] + Textbox.PADDING;
			const maxWidth =
				width - Textbox.PADDING * 2 - batteryBoxWidth - Textbox.GAP;
			let y = contentTop;

			const heading = "Estar en un lugar así puede ser agotador.";
			this.p.textSize(20);
			this.p.text(heading, x, y, maxWidth);
			y += this.p.textBounds(heading, x, y, maxWidth).h + Textbox.GAP;

			this.p.textSize(13);
			this.p.text("Échale un vistazo a tu energía.", x, y, maxWidth);
		} else if (activeInteraction?.kind === TextboxDisplayKind.Message) {
			this.p.textAlign(this.p.LEFT, this.p.TOP);
			this.p.fill(255, this.#opacity * 255);

			this.p.text(
				activeInteraction.message,
				origin[0] + Textbox.PADDING,
				origin[1] + Textbox.MARGIN + Textbox.PADDING,
				width - Textbox.PADDING * 2,
			);
		}

		this.p.pop();
	}

	#buttonAt([x, y]: [number, number]) {
		if (
			!this.#isVisible ||
			this.#lastActiveTextboxDisplay?.kind !== TextboxDisplayKind.Buttons
		)
			return null;

		const { buttons } = this.#lastActiveTextboxDisplay;

		for (const [i, { x: rx, y: ry, w, h }] of this.#buttonRects(
			buttons.length,
		)) {
			if (x >= rx && x <= rx + w && y >= ry && y <= ry + h) {
				return expect(buttons.at(i));
			}
		}

		return null;
	}

	interactiveAt(location: [number, number]) {
		return !!this.#buttonAt(location);
	}

	clickedAt(location: [number, number]) {
		if (
			!this.#isVisible ||
			this.#lastActiveTextboxDisplay?.kind !== TextboxDisplayKind.Buttons
		)
			return null;

		const target = this.#buttonAt(location);
		if (target) {
			this.#lastActiveTextboxDisplay.entity.onInteracted(target.id, this);
		}
	}
}
