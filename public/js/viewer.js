import { renderSlide } from './slide-renderers.js';

const viewer = document.getElementById('slide-viewer');
const page = document.querySelector('.page');
const slideCanvas = document.getElementById('slide-canvas');
const thumbnailsEl = document.getElementById('thumbnails');
const slideCounter = document.getElementById('slide-counter');

const downloadPptxBtn = document.getElementById('viewer-download-pptx');
const downloadPdfBtn = document.getElementById('viewer-download-pdf');
const shareBtn = document.getElementById('viewer-share-link');

let currentSlide = 0;
let slideData = null;

function setToolbarLinks(options = {}) {
  downloadPptxBtn.href = options.downloadUrl || '#';
  downloadPdfBtn.href = options.pdfUrl || '#';
  shareBtn.href = options.shareUrl || '#';

  downloadPptxBtn.classList.toggle('disabled', !options.downloadUrl);
  downloadPdfBtn.classList.toggle('disabled', !options.pdfUrl);
  shareBtn.classList.toggle('disabled', !options.shareUrl);
}

function renderThumbnails() {
  thumbnailsEl.innerHTML = '';

  slideData.slides.forEach((slide, index) => {
    const thumb = document.createElement('div');
    thumb.className = `thumb${index === currentSlide ? ' active' : ''}`;
    thumb.innerHTML = `<span class="thumb-number">${index + 1}</span><div class="thumb-inner">${renderSlide(slide, slideData.theme, slideData)}</div>`;
    thumb.addEventListener('click', () => goToSlide(index));
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

  page.classList.add('hidden');
  viewer.classList.remove('hidden');
}

export function updateViewerData(data) {
  if (!data?.slides?.length) return;

  slideData = data;
  currentSlide = Math.max(0, Math.min(currentSlide, data.slides.length - 1));
  renderThumbnails();
  goToSlide(currentSlide);
}

export function hideViewer() {
  viewer.classList.add('hidden');
  page.classList.remove('hidden');
}

function goToSlide(index) {
  if (!slideData || !slideData.slides?.length) return;

  const maxIndex = slideData.slides.length - 1;
  currentSlide = Math.max(0, Math.min(index, maxIndex));

  slideCanvas.innerHTML = renderSlide(slideData.slides[currentSlide], slideData.theme, slideData);
  slideCounter.textContent = `${currentSlide + 1} / ${slideData.slides.length}`;

  thumbnailsEl.querySelectorAll('.thumb').forEach((thumb, i) => {
    thumb.classList.toggle('active', i === currentSlide);
  });

  const activeThumb = thumbnailsEl.querySelector('.thumb.active');
  if (activeThumb) {
    activeThumb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

slideCanvas.addEventListener('click', (event) => {
  const target = event.target.closest('[data-ai-target]');
  if (!target) return;

  const detail = {
    target: target.getAttribute('data-ai-target'),
    label: target.getAttribute('data-ai-label') || target.getAttribute('data-ai-target')
  };

  window.dispatchEvent(new CustomEvent('deck:select-target', { detail }));
});

document.getElementById('back-to-editor').addEventListener('click', hideViewer);

document.getElementById('prev-slide').addEventListener('click', () => {
  goToSlide(currentSlide - 1);
});

document.getElementById('next-slide').addEventListener('click', () => {
  goToSlide(currentSlide + 1);
});

document.addEventListener('keydown', (event) => {
  if (viewer.classList.contains('hidden') || !slideData) return;
  if (event.key === 'ArrowLeft') goToSlide(currentSlide - 1);
  if (event.key === 'ArrowRight') goToSlide(currentSlide + 1);
  if (event.key === 'Escape') hideViewer();
});
