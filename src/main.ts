import p5 from "p5";

const setup = async (p: p5) => {
	p.createCanvas(800, 600);
	p.background(0);
	p.ellipse(p.width / 2, p.height / 2, 100, 100);
};

new p5((p: p5) => {
	p.setup = () => setup(p);
});
