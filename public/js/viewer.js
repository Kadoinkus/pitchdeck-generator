import { renderSlide } from "./slide-renderers.js";

const viewer = document.getElementById("slide-viewer");
const page = document.querySelector(".page");
const slideCanvas = document.getElementById("slide-canvas");
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
	renderThumbnails();
	goToSlide(currentSlide);

	page.classList.add("hidden");
	viewer.classList.remove("hidden");
}

export function updateViewerData(data) {
	if (!data?.slides?.length) return;

	slideData = data;
	currentSlide = Math.max(0, Math.min(currentSlide, data.slides.length - 1));
	renderThumbnails();
	goToSlide(currentSlide);
}

export function hideViewer() {
	closeShareMenu();
	viewer.classList.add("hidden");
	page.classList.remove("hidden");
}

function goToSlide(index) {
	if (!slideData || !slideData.slides?.length) return;

	const maxIndex = slideData.slides.length - 1;
	currentSlide = Math.max(0, Math.min(index, maxIndex));

	const current = slideData.slides[currentSlide];
	slideCanvas.innerHTML = renderSlide(current, slideData.theme, slideData);
	slideCounter.textContent = `${currentSlide + 1} / ${slideData.slides.length}`;

	thumbnailsEl.querySelectorAll(".thumb").forEach((thumb, i) => {
		thumb.classList.toggle("active", i === currentSlide);
	});

	const activeThumb = thumbnailsEl.querySelector(".thumb.active");
	if (activeThumb) {
		activeThumb.scrollIntoView({ block: "nearest", behavior: "smooth" });
	}
}

slideCanvas.addEventListener("click", (event) => {
	const target = event.target.closest("[data-ai-target]");
	if (!target) return;

	const detail = {
		target: target.getAttribute("data-ai-target"),
		label:
			target.getAttribute("data-ai-label") ||
			target.getAttribute("data-ai-target"),
	};

	window.dispatchEvent(new CustomEvent("deck:select-target", { detail }));
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
