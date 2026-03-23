import { renderSlide } from "/js/slide-renderers.js";

const deckEl = document.getElementById("share-deck");
const template = document.getElementById("share-slide-template");
const titleEl = document.getElementById("share-title");
const subtitleEl = document.getElementById("share-subtitle");
const pptxLink = document.getElementById("share-download-pptx");
const printButton = document.getElementById("share-print");

function getTokenFromPath() {
	const parts = window.location.pathname.split("/").filter(Boolean);
	return parts[1] || "";
}

function renderDeck(slideData) {
	deckEl.innerHTML = "";

	slideData.slides.forEach((slide, index) => {
		const node = template.content.firstElementChild.cloneNode(true);
		const frame = node.querySelector(".share-slide-frame");
		frame.innerHTML = renderSlide(slide, slideData.theme, slideData);
		frame.setAttribute("aria-label", `Slide ${index + 1}`);
		deckEl.appendChild(node);
	});
}

async function bootstrap() {
	const token = getTokenFromPath();
	if (!token) {
		titleEl.textContent = "Invalid share link";
		return;
	}

	try {
		const response = await fetch(`/api/share/${token}`);
		const result = await response.json();

		if (!response.ok || !result.success || !result.slideData) {
			throw new Error(result.message || "Deck not found.");
		}

		const slideData = result.slideData;
		titleEl.textContent = `${slideData.project?.projectTitle || "Pitch Deck"}`;
		subtitleEl.textContent = `Prepared for ${slideData.project?.clientName || "Client"} · ${slideData.slides.length} slides`;

		if (result.downloadUrl) {
			pptxLink.href = result.downloadUrl;
			pptxLink.classList.remove("disabled");
		} else {
			pptxLink.href = "#";
			pptxLink.classList.add("disabled");
		}

		renderDeck(slideData);

		const url = new URL(window.location.href);
		if (url.searchParams.get("print") === "1") {
			setTimeout(() => window.print(), 350);
		}
	} catch (error) {
		console.error(error);
		titleEl.textContent = "Could not load deck";
		subtitleEl.textContent =
			error.message || "Try generating a new share link.";
	}
}

printButton.addEventListener("click", () => {
	window.print();
});

bootstrap();
