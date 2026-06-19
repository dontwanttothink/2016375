import { format } from "prettier";
import * as prettierEStree from "prettier/plugins/estree";
import * as prettierMeriyah from "prettier/plugins/meriyah";

function assert<T>(x: T, msg?: string): asserts x is NonNullable<T> {
	if (x === null || x === undefined) {
		throw new Error(msg ?? "expected non-null value");
	}
}

function expect<T>(x: T, msg?: string): NonNullable<T> {
	assert(x, msg);
	return x;
}

const zone = expect(document.getElementById("dropoff"));
const input = expect(document.getElementById("image"));
const code = expect(document.getElementById("generated-source"));

zone.addEventListener("drop", (e) => {
	e.preventDefault();
	const items = expect(e.dataTransfer).items;
	interacted(
		[...items].map((item) => item.getAsFile()).filter((file) => !!file),
	);
});

input.addEventListener("change", (e) => {
	interacted([...expect((expect(e.target) as HTMLInputElement).files)]);
});

zone.addEventListener("dragover", (e) => {
	assert(e?.dataTransfer);

	const fileItems = [...e.dataTransfer.items].filter(
		(item) => item.kind === "file",
	);
	if (fileItems.length > 0) {
		e.preventDefault();
		if (fileItems.some((item) => item.type.startsWith("image/png"))) {
			e.dataTransfer.dropEffect = "copy";
		} else {
			e.dataTransfer.dropEffect = "none";
		}
	}
});

window.addEventListener("dragover", (e) => {
	assert(e?.dataTransfer);
	assert(e?.target);

	const fileItems = [...e.dataTransfer.items].filter(
		(item) => item.kind === "file",
	);
	if (fileItems.length > 0) {
		e.preventDefault();
		if (!zone.contains(e.target as Node)) {
			e.dataTransfer.dropEffect = "none";
		}
	}
});

window.addEventListener("drop", (e) => {
	assert(e?.dataTransfer);

	if ([...e.dataTransfer.items].some((item) => item.kind === "file")) {
		e.preventDefault();
	}
});

async function interacted(files: File[]) {
	const pixelArrays = await Promise.all(files.map(intoPixelArray));

	const sources = (
		await Promise.all(
			pixelArrays.map(intoSource).map(async (str) =>
				format(await str, {
					parser: "meriyah",
					plugins: [prettierEStree, prettierMeriyah],
				}),
			),
		)
	).join("\n\n");

	code.textContent = sources;
	code.classList.remove("hidden");
	zone.classList.add("hidden");
}

async function intoSource(arr: Uint8ClampedArray) {
	let out = "new Uint8ClampedArray([";
	for (const val of arr) {
		out += `${val},`;
		await Promise.resolve();
	}
	out += "]);";
	return out;
}

function intoPixelArray(file: File): Promise<Uint8ClampedArray> {
	return new Promise((resolve, reject) => {
		const canvas = document.createElement("canvas");
		const context = expect(canvas.getContext("2d"));
		const image = new Image();

		image.onload = () => {
			canvas.width = image.width;
			canvas.height = image.height;

			context.drawImage(image, 0, 0);

			const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
			resolve(imageData.data);

			URL.revokeObjectURL(image.src);
		};

		image.onerror = (e) => {
			URL.revokeObjectURL(image.src);
			reject(e);
		};

		image.src = URL.createObjectURL(file);
	});
}
