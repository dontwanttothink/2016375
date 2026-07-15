import type p5 from "p5";
import type { Art } from "../art";
import { ProtagonistEntity } from "../characters/protagonist";
import { expect } from "../utils";

export class BatteryDisplay {
	/**
	 * Rapidez con la que `displayedLevel` persigue la energía real, en unidades
	 * de energía por segundo.
	 */
	static EASING_RATE = 8;

	p: p5;

	entity: ProtagonistEntity;
	displayedLevel: number;

	art: Art;

	constructor(p: p5, art: Art, protagonist: ProtagonistEntity) {
		this.p = p;
		this.entity = protagonist;
		this.art = art;
		this.displayedLevel = protagonist.energy;
	}

	tick() {
		const target = this.entity.energy;
		const step = (BatteryDisplay.EASING_RATE * this.p.deltaTime) / 1000;

		if (Math.abs(target - this.displayedLevel) <= step) {
			this.displayedLevel = target;
		} else {
			this.displayedLevel += Math.sign(target - this.displayedLevel) * step;
		}
	}

	/**
	 * Dibuja la batería ajustándola dentro del recuadro dado, mostrando el
	 * fotograma que corresponde al nivel actualmente animado.
	 *
	 * @param center centro del recuadro, en el espacio de la pantalla
	 */
	draw(
		center: [number, number],
		width: number,
		height: number,
		opacity: number,
	) {
		const ratio = this.p.constrain(
			this.displayedLevel / ProtagonistEntity.MAX_ENERGY,
			0,
			1,
		);
		const frame = Math.ceil(
			ratio *
				(expect(this.art.getAnimationProperties("draining")).frames.length - 1),
		);

		this.art.overrideBaseAppearance("draining", frame);
		this.art.draw(center, width, height, { fit: true, opacity });
	}
}
