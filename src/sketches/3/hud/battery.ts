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

	/**
	 * Si está en `true`, se reproduce la animación "reloading" en lugar de
	 * mostrar el fotograma correspondiente al nivel de energía.
	 */
	#reloading: boolean;

	constructor(
		p: p5,
		art: Art,
		protagonist: ProtagonistEntity,
		{ reloading = false }: { reloading?: boolean } = {},
	) {
		this.p = p;
		this.entity = protagonist;
		this.art = art;
		this.displayedLevel = protagonist.energy;
		this.#reloading = reloading;

		if (reloading) {
			// establecemos la base appearance a una batería cargada (porque eso
			// es lo que debemos mostrar al final de la animación)
			this.art.removeBaseAppearanceOverride(); // la forma canónica es una batería cargada jiji

			this.art.animate("reloading");
		}
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
		if (!this.#reloading) {
			// detenemos cualquier animación previa (p. ej. un "reloading" anterior)
			// para que el fotograma del nivel tenga efecto
			this.art.immediatelyStopAnimating();

			const ratio = this.p.constrain(
				this.displayedLevel / ProtagonistEntity.MAX_ENERGY,
				0,
				1,
			);
			const frame = Math.ceil(
				ratio *
					(expect(this.art.getAnimationProperties("draining")).frames.length -
						1),
			);

			this.art.overrideBaseAppearance("draining", frame);
		}

		this.art.draw(center, width, height, { fit: true, opacity });
	}
}
