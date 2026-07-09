import type p5 from "p5";
import type { Stage } from ".";

interface DebugCellHighlight {
	location: [number, number];
	since: number;
}

export class StageDebug {
	p: p5;
	stage: Stage;
	highlights: Set<DebugCellHighlight> = new Set();

	static HIGHLIGHT_DURATION = 100;

	constructor(p: p5, stage: Stage) {
		this.p = p;
		this.stage = stage;
	}

	highlight(location: [number, number]) {
		this.highlights.add({
			location,
			since: this.p.millis(),
		});
	}

	drawHighlights() {
		this.p.push();
		this.p.noStroke();

		for (const highlight of this.highlights) {
			const { since, location } = highlight;
			const t = (this.p.millis() - since) / StageDebug.HIGHLIGHT_DURATION;
			this.p.fill(255, 0, 0, (1 - t) * 230);
			this.p.square(...this.stage.toScreenSpace(location), this.stage.scale);

			if (t > 1) {
				this.highlights.delete(highlight);
			}
		}

		this.p.pop();
	}

	drawGrid() {
		this.p.push();
		this.p.stroke("red");
		for (
			let i = 0;
			i * this.stage.grid.cellSize <
			Math.max(this.stage.width, this.stage.height);
			++i
		) {
			this.p.line(
				...this.stage.toScreenSpace([
					0,
					this.stage.grid.origin[1] + i * this.stage.grid.cellSize,
				]),
				...this.stage.toScreenSpace([
					this.stage.width,
					this.stage.grid.origin[1] + i * this.stage.grid.cellSize,
				]),
			);

			this.p.line(
				...this.stage.toScreenSpace([
					this.stage.grid.origin[0] + i * this.stage.grid.cellSize,
					0,
				]),
				...this.stage.toScreenSpace([
					this.stage.grid.origin[0] + i * this.stage.grid.cellSize,
					this.stage.height,
				]),
			);
		}
		this.p.pop();
	}

	drawCollision(collision: boolean[]) {
		if (!this.p.keyIsDown("C")) {
			return;
		}

		this.p.push();
		this.p.noStroke();
		this.p.fill(150, 200, 200, 200);
		for (const [i, occupied] of collision.entries()) {
			if (occupied) {
				this.p.square(
					...this.stage.toScreenSpace([
						i % this.stage.width,
						Math.floor(i / this.stage.width),
					]),
					this.stage.scale,
				);
			}
		}
		this.p.pop();
	}
}
