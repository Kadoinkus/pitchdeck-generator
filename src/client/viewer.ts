// @ts-nocheck
import { renderSlide } from "./slide-renderers.js";

const viewer = document.getElementById("slide-viewer");
const page = document.querySelector(".page");
const slideCanvas = document.getElementById("slide-canvas");
const slideTrack = document.getElementById("slide-track");
const thumbnailsEl = document.getElementById("thumbnails");
const slideCounter = document.getElementById("slide-counter");

const downloadPptxBtn = document.getElementById("viewer-download-pptx");
const downloadPdfBtn = document.getElementById("viewer-download-pdf");
const shareBtn = document.getElementById("viewer-share-link");
const copyShareBtn = document.getElementById("viewer-copy-share");
const shareDropdown = document.getElementById("viewer-share-dropdown");
const shareToggleBtn = document.getElementById("viewer-share-toggle");

let currentSlide = 0;
let slideData = null;
let copyFeedbackTimer = null;
let suppressClickUntil = 0;

const drag = {
	active: false,
	startX: 0,
	deltaX: 0,
	width: 0,
	moved: false
};

function isShareMenuOpen() {
	return Boolean(shareDropdown?.classList.contains("open"));
}

function closeShareMenu() {
	if (!shareDropdown || !shareToggleBtn) return;
	shareDropdown.classList.remove("open");
	shareToggleBtn.setAttribute("aria-expanded", "false");
}

function toggleShareMenu() {
	if (!shareDropdown || !shareToggleBtn || shareToggleBtn.disabled) return;
	const willOpen = !isShareMenuOpen();
	shareDropdown.classList.toggle("open", willOpen);
	shareToggleBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
}

function resetCopyShareLabel() {
	if (!copyShareBtn) return;
	copyShareBtn.textContent = "Copy share link";
}

function setToolbarLinks(options = {}) {
	const hasDownloadUrl = Boolean(options.downloadUrl);
	const hasPdfUrl = Boolean(options.pdfUrl);
	const hasShareUrl = Boolean(options.shareUrl);
	const hasAnyShareAction = hasDownloadUrl || hasPdfUrl || hasShareUrl;

	downloadPptxBtn.href = options.downloadUrl || "#";
	downloadPdfBtn.href = options.pdfUrl || "#";
	shareBtn.href = options.shareUrl || "#";

	downloadPptxBtn.classList.toggle("disabled", !hasDownloadUrl);
	downloadPdfBtn.classList.toggle("disabled", !hasPdfUrl);
	shareBtn.classList.toggle("disabled", !hasShareUrl);

	if (shareToggleBtn) {
		shareToggleBtn.disabled = !hasAnyShareAction;
		shareToggleBtn.classList.toggle("disabled", !hasAnyShareAction);
		if (!hasAnyShareAction) {
			closeShareMenu();
		}
	}

	if (copyShareBtn) {
		copyShareBtn.disabled = !hasShareUrl;
		copyShareBtn.classList.toggle("disabled", !hasShareUrl);
		resetCopyShareLabel();
	}
}

function updateTrackPosition({ animate = true, offsetPx = 0 } = {}) {
	if (!slideCanvas || !slideTrack) return;
	const width = slideCanvas.clientWidth || 1;
	const position = -currentSlide * width + offsetPx;
	if (!animate) {
		slideTrack.style.transition = "none";
	}
	slideTrack.style.transform = `translate3d(${position}px, 0, 0)`;
	if (!animate) {
		requestAnimationFrame(() => {
			if (!drag.active) {
				slideTrack.style.transition = "";
			}
		});
	}
}

function updateSlidePageStates() {
	if (!slideTrack) return;
	slideTrack.querySelectorAll(".slide-page").forEach((node, index) => {
		node.classList.toggle("is-active", index === currentSlide);
		node.classList.toggle("is-prev", index === currentSlide - 1);
		node.classList.toggle("is-next", index === currentSlide + 1);
	});
}

function renderSlides() {
	if (!slideTrack || !slideData?.slides?.length) return;
	slideTrack.innerHTML = "";

	slideData.slides.forEach((slide, index) => {
		const pageNode = document.createElement("section");
		pageNode.className = "slide-page";
		pageNode.dataset.slideIndex = String(index);
		pageNode.innerHTML = renderSlide(slide, slideData.theme, slideData);
		slideTrack.appendChild(pageNode);
	});
}

function renderThumbnails() {
	thumbnailsEl.innerHTML = "";

	slideData.slides.forEach((slide, index) => {
		const thumb = document.createElement("div");
		thumb.className = `thumb${index === currentSlide ? " active" : ""}`;
		thumb.innerHTML = `<span class="thumb-number">${index + 1}</span><div class="thumb-inner">${renderSlide(slide, slideData.theme, slideData)}</div>`;
		thumb.addEventListener("click", () => goToSlide(index));
		thumbnailsEl.appendChild(thumb);
	});
}

export function showViewer(data, options = {}) {
	if (!data?.slides?.length) return;

	slideData = data;
	currentSlide = Math.max(0, Math.min(currentSlide, data.slides.length - 1));

	setToolbarLinks(options);
	renderSlides();
	renderThumbnails();
	goToSlide(currentSlide, { animate: false });

	page.classList.add("hidden");
	viewer.classList.remove("hidden");
}

export function updateViewerData(data) {
	if (!data?.slides?.length) return;

	slideData = data;
	currentSlide = Math.max(0, Math.min(currentSlide, data.slides.length - 1));
	renderSlides();
	renderThumbnails();
	goToSlide(currentSlide, { animate: false });
}

export function hideViewer() {
	closeShareMenu();
	viewer.classList.add("hidden");
	page.classList.remove("hidden");
}

function goToSlide(index, options = {}) {
	if (!slideData || !slideData.slides?.length) return;

	const maxIndex = slideData.slides.length - 1;
	currentSlide = Math.max(0, Math.min(index, maxIndex));

	slideCounter.textContent = `${currentSlide + 1} / ${slideData.slides.length}`;
	updateSlidePageStates();
	updateTrackPosition({ animate: options.animate !== false });

	thumbnailsEl.querySelectorAll(".thumb").forEach((thumb, i) => {
		thumb.classList.toggle("active", i === currentSlide);
	});

	const activeThumb = thumbnailsEl.querySelector(".thumb.active");
	if (activeThumb) {
		activeThumb.scrollIntoView({ block: "nearest", behavior: "smooth" });
	}
}

function startSwipe(event) {
	if (!slideData?.slides?.length || slideData.slides.length < 2) return;
	if (event.button !== undefined && event.button !== 0) return;
	if (event.target.closest("a,button,input,textarea,select")) return;

	drag.active = true;
	drag.startX = event.clientX;
	drag.deltaX = 0;
	drag.width = slideCanvas.clientWidth || 1;
	drag.moved = false;
	slideCanvas.classList.add("is-dragging");
	slideCanvas.setPointerCapture?.(event.pointerId);
}

function moveSwipe(event) {
	if (!drag.active) return;
	drag.deltaX = event.clientX - drag.startX;
	if (Math.abs(drag.deltaX) > 6) drag.moved = true;

	const maxIndex = (slideData?.slides?.length || 1) - 1;
	let offset = drag.deltaX;
	if ((currentSlide === 0 && drag.deltaX > 0) || (currentSlide === maxIndex && drag.deltaX < 0)) {
		offset *= 0.35;
	}

	updateTrackPosition({ animate: false, offsetPx: offset });
}

function endSwipe(event) {
	if (!drag.active) return;
	drag.active = false;
	slideCanvas.classList.remove("is-dragging");
	slideCanvas.releasePointerCapture?.(event.pointerId);

	const threshold = Math.min(140, (drag.width || 1) * 0.16);
	const delta = drag.deltaX;
	const moved = drag.moved;

	if (moved && Math.abs(delta) > threshold) {
		suppressClickUntil = Date.now() + 240;
		if (delta < 0) goToSlide(currentSlide + 1);
		else goToSlide(currentSlide - 1);
		return;
	}

	goToSlide(currentSlide);
}

slideCanvas.addEventListener("pointerdown", startSwipe);
slideCanvas.addEventListener("pointermove", moveSwipe);
slideCanvas.addEventListener("pointerup", endSwipe);
slideCanvas.addEventListener("pointercancel", endSwipe);

slideCanvas.addEventListener("click", (event) => {
	if (Date.now() < suppressClickUntil) {
		event.preventDefault();
		event.stopPropagation();
		return;
	}

	const target = event.target.closest("[data-ai-target]");
	if (!target) return;

	const detail = {
		target: target.getAttribute("data-ai-target"),
		label:
			target.getAttribute("data-ai-label") ||
			target.getAttribute("data-ai-target")
	};

	window.dispatchEvent(new CustomEvent("deck:select-target", { detail }));
});

window.addEventListener("resize", () => {
	if (viewer.classList.contains("hidden")) return;
	updateTrackPosition({ animate: false });
});

document.getElementById("back-to-editor").addEventListener("click", hideViewer);

document.getElementById("prev-slide").addEventListener("click", () => {
	goToSlide(currentSlide - 1);
});

document.getElementById("next-slide").addEventListener("click", () => {
	goToSlide(currentSlide + 1);
});

shareToggleBtn?.addEventListener("click", (event) => {
	event.preventDefault();
	toggleShareMenu();
});

copyShareBtn?.addEventListener("click", async () => {
	if (!shareBtn?.href || shareBtn.href.endsWith("#") || copyShareBtn.disabled)
		return;

	try {
		await navigator.clipboard.writeText(shareBtn.href);
		copyShareBtn.textContent = "Link copied";
		clearTimeout(copyFeedbackTimer);
		copyFeedbackTimer = setTimeout(() => {
			resetCopyShareLabel();
		}, 1400);
		closeShareMenu();
	} catch {
		copyShareBtn.textContent = "Copy failed";
		clearTimeout(copyFeedbackTimer);
		copyFeedbackTimer = setTimeout(() => {
			resetCopyShareLabel();
		}, 1400);
	}
});

[downloadPptxBtn, downloadPdfBtn, shareBtn].forEach((item) => {
	item?.addEventListener("click", () => {
		closeShareMenu();
	});
});

document.addEventListener("click", (event) => {
	if (!isShareMenuOpen()) return;
	if (!shareDropdown?.contains(event.target)) {
		closeShareMenu();
	}
});

document.addEventListener("keydown", (event) => {
	if (viewer.classList.contains("hidden") || !slideData) return;
	if (event.key === "ArrowLeft") goToSlide(currentSlide - 1);
	if (event.key === "ArrowRight") goToSlide(currentSlide + 1);
	if (event.key === "Escape") {
		if (isShareMenuOpen()) {
			closeShareMenu();
			return;
		}
		hideViewer();
	}
});

