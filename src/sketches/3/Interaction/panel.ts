import type p5 from "p5";

export interface PanelButton{
	label: string;
	onClick: () => void;
}

export class Panel{
	p: p5;
	buttons: PanelButton[] = [];

	static PADDING = 12;
	static GAP = 12;

	constructor(p: p5){
		this.p = p;
	}

	show(buttons: PanelButton[]){
		this.buttons = buttons;
	}

	hide(){
		this.buttons = [];
	}

	get Visible(){
		return this.buttons.length > 0;
	}

	#buttonRects(height: number){
		const p=this.p;
		const panelTop = p.height - height;
		const n = this.buttons.length;
		if (n===0) return [];

		const totalGap = Panel.GAP*(n - 1);
		const w = (p.width - Panel.PADDING * 2 - totalGap) / n;
		const h = height - Panel.PADDING * 2;

		return this.buttons.map((_, i) =>({
			x: Panel.PADDING + i * (w + Panel.GAP),
			y: panelTop + Panel.PADDING,
			w,
			h,
		}));
	}
	draw(height: number){
		const p = this.p;
		const panelTop = p.height - height;

		p.push();
		p.noStroke();
		p.fill(30, 30, 30, 230);
		p.rect(0, panelTop, p.width, height);

		if (this.Visible){
			const rects = this.#buttonRects(height);
			p.textAlign(p.CENTER, p.CENTER);

			for (const [i, { x, y, w, h }] of rects.entries()) {
				const hovering =
					p.mouseX >= x &&
					p.mouseX <= x + w &&
					p.mouseY >= y &&
					p.mouseY <= y + h;

				p.fill(hovering ? 90 : 60);
				p.rect(x, y, w, h, 6);

				p.fill(255);
				p.text(this.buttons[i].label, x + w / 2, y + h / 2);
			}
		}
		p.pop();
	}
	clickedAt(x: number, y: number, height: number): boolean {
		if (!this.Visible) return false;

		const rects = this.#buttonRects(height);
		for (const [i, { x: rx, y: ry, w, h }] of rects.entries()) {
			if (x >= rx && x <= rx + w && y >= ry && y <= ry + h) {
				this.buttons[i].onClick();
				return true;
			}
		}
		return false;
	}
}