import { renderSlide } from "/js/slide-renderers.js";

const deckEl = document.getElementById("share-deck");
const trackEl = document.getElementById("share-track");
const template = document.getElementById("share-slide-template");
const titleEl = document.getElementById("share-title");
const subtitleEl = document.getElementById("share-subtitle");
const counterEl = document.getElementById("share-counter");
const pptxLink = document.getElementById("share-download-pptx");
const printButton = document.getElementById("share-print");
const prevButton = document.getElementById("share-prev");
const nextButton = document.getElementById("share-next");

let slideData = null;
let currentSlide = 0;
let isPrintMode = false;

const drag = {
	active: false,
	startX: 0,
	deltaX: 0,
	width: 0,
	moved: false
};

function getTokenFromPath() {
	const parts = window.location.pathname.split("/").filter(Boolean);
	return parts[1] || "";
}

function updateTrackPosition({ animate = true, offsetPx = 0 } = {}) {
	if (!trackEl || !deckEl) return;
	const width = deckEl.clientWidth || 1;
	const x = -currentSlide * width + offsetPx;
	if (!animate) {
		trackEl.style.transition = "none";
	}
	trackEl.style.transform = `translate3d(${x}px, 0, 0)`;
	if (!animate) {
		requestAnimationFrame(() => {
			if (!drag.active) trackEl.style.transition = "";
		});
	}
}

function updateUi() {
	if (!slideData) return;
	const total = slideData.slides.length;
	if (counterEl) counterEl.textContent = `${currentSlide + 1} / ${total}`;
	if (prevButton) prevButton.disabled = currentSlide <= 0;
	if (nextButton) nextButton.disabled = currentSlide >= total - 1;

	trackEl.querySelectorAll(".share-slide").forEach((node, index) => {
		node.classList.toggle("is-active", index === currentSlide);
	});
}

function goToSlide(index, options = {}) {
	if (!slideData?.slides?.length) return;
	const maxIndex = slideData.slides.length - 1;
	currentSlide = Math.max(0, Math.min(index, maxIndex));
	updateUi();
	updateTrackPosition({ animate: options.animate !== false });
}

function renderDeck(data) {
	if (!trackEl) return;
	trackEl.innerHTML = "";

	data.slides.forEach((slide, index) => {
		const node = template.content.firstElementChild.cloneNode(true);
		const frame = node.querySelector(".share-slide-frame");
		frame.innerHTML = renderSlide(slide, data.theme, data);
		frame.setAttribute("aria-label", `Slide ${index + 1}`);
		trackEl.appendChild(node);
	});
}

function startSwipe(event) {
	if (!slideData?.slides?.length || slideData.slides.length < 2 || isPrintMode) return;
	if (event.button !== undefined && event.button !== 0) return;
	if (event.target.closest("a,button,input,textarea,select")) return;

	drag.active = true;
	drag.startX = event.clientX;
	drag.deltaX = 0;
	drag.width = deckEl.clientWidth || 1;
	drag.moved = false;
	deckEl.classList.add("is-dragging");
	deckEl.setPointerCapture?.(event.pointerId);
}

function moveSwipe(event) {
	if (!drag.active) return;
	drag.deltaX = event.clientX - drag.startX;
	if (Math.abs(drag.deltaX) > 6) drag.moved = true;

	const maxIndex = slideData.slides.length - 1;
	let offset = drag.deltaX;
	if ((currentSlide === 0 && offset > 0) || (currentSlide === maxIndex && offset < 0)) {
		offset *= 0.35;
	}

	updateTrackPosition({ animate: false, offsetPx: offset });
}

function endSwipe(event) {
	if (!drag.active) return;
	drag.active = false;
	deckEl.classList.remove("is-dragging");
	deckEl.releasePointerCapture?.(event.pointerId);

	const threshold = Math.min(140, (drag.width || 1) * 0.16);
	const delta = drag.deltaX;
	if (drag.moved && Math.abs(delta) > threshold) {
		if (delta < 0) goToSlide(currentSlide + 1);
		else goToSlide(currentSlide - 1);
		return;
	}

	goToSlide(currentSlide);
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

		slideData = result.slideData;
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
		goToSlide(0, { animate: false });

		const url = new URL(window.location.href);
		isPrintMode = url.searchParams.get("print") === "1";
		if (isPrintMode) {
			document.body.classList.add("print-mode");
			setTimeout(() => window.print(), 350);
		}
	} catch (error) {
		console.error(error);
		titleEl.textContent = "Could not load deck";
		subtitleEl.textContent =
			error.message || "Try generating a new share link.";
	}
}

prevButton?.addEventListener("click", () => {
	goToSlide(currentSlide - 1);
});

nextButton?.addEventListener("click", () => {
	goToSlide(currentSlide + 1);
});

printButton.addEventListener("click", () => {
	window.print();
});

deckEl.addEventListener("pointerdown", startSwipe);
deckEl.addEventListener("pointermove", moveSwipe);
deckEl.addEventListener("pointerup", endSwipe);
deckEl.addEventListener("pointercancel", endSwipe);

window.addEventListener("resize", () => {
	if (!slideData) return;
	updateTrackPosition({ animate: false });
});

document.addEventListener("keydown", (event) => {
	if (!slideData || isPrintMode) return;
	if (event.key === "ArrowLeft") goToSlide(currentSlide - 1);
	if (event.key === "ArrowRight") goToSlide(currentSlide + 1);
});

bootstrap();
