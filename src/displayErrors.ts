const dialog = document.createElement("dialog");

const heading = document.createElement("h1");
const subtitle = document.createElement("p");

const messageParagraph = document.createElement("p");
const locationParagraph = document.createElement("p");
const tipParagraph = document.createElement("p");
const closingParagraph = document.createElement("p");

heading.textContent = "Hubo un error.";
heading.style.marginBottom = "0";
subtitle.textContent = "Pero no nos están evaluando todavía, ¿o sí?";
subtitle.style.textAlign = "center";
subtitle.style.marginTop = "0";

tipParagraph.textContent =
	"Hay más información en la consola del navegador. Los detalles allí son probablemente mucho más útiles.";

closingParagraph.textContent =
	"(Si necesitas cerrar este mensaje, presiona Esc.)";
closingParagraph.style.opacity = "70%";

dialog.classList.add("error-notification");
dialog.append(heading);
dialog.append(subtitle);
dialog.append(messageParagraph);
dialog.append(locationParagraph);
dialog.append(tipParagraph);
dialog.append(closingParagraph);

const bodyElement = document.body;
bodyElement.append(dialog);

function b(content: string) {
	const out = document.createElement("b");
	out.textContent = content;
	return out;
}

window.addEventListener("error", (ev) => {
	messageParagraph.textContent = `El mensaje es: “`;
	messageParagraph.append(b(ev.message));
	messageParagraph.append("”.");

	locationParagraph.textContent = "Ocurrió en la línea ";
	locationParagraph.append(b(String(ev.lineno)));
	locationParagraph.append(" (columna ");
	locationParagraph.append(b(String(ev.colno)));
	locationParagraph.append(") del archivo “");
	locationParagraph.append(b(new URL(ev.filename).pathname));
	locationParagraph.append("”.");

	dialog.showModal();
});

window.addEventListener("unhandledrejection", (ev) => {
	messageParagraph.textContent = "La razón dada es: “";
	messageParagraph.append(b(ev.reason));
	messageParagraph.append("”.");
	locationParagraph.textContent =
		"Por razones técnicas, la ubicación del código que produjo este error no se muestra aquí.";

	dialog.showModal();
});
