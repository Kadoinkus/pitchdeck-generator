/**
 * Client-side dominant color extraction from images.
 *
 * Draws the image to an offscreen canvas at low resolution,
 * clusters pixel colors via simplified k-means, and returns
 * the most chromatic (saturated) cluster center as a hex string.
 */

interface RgbPixel {
	r: number;
	g: number;
	b: number;
}

interface Cluster {
	center: RgbPixel;
	pixels: RgbPixel[];
}

function rgbToHex(pixel: RgbPixel): string {
	const r = Math.round(pixel.r).toString(16).padStart(2, '0');
	const g = Math.round(pixel.g).toString(16).padStart(2, '0');
	const b = Math.round(pixel.b).toString(16).padStart(2, '0');
	return `#${r}${g}${b}`;
}

function rgbDistance(a: RgbPixel, b: RgbPixel): number {
	const dr = a.r - b.r;
	const dg = a.g - b.g;
	const db = a.b - b.b;
	return dr * dr + dg * dg + db * db;
}

/** Perceived lightness 0..1 (Rec. 709). */
function luminance(p: RgbPixel): number {
	return (0.2126 * p.r + 0.7152 * p.g + 0.0722 * p.b) / 255;
}

/** Rough saturation proxy 0..1 — max channel spread / max channel value. */
function saturationProxy(p: RgbPixel): number {
	const max = Math.max(p.r, p.g, p.b);
	if (max === 0) return 0;
	const min = Math.min(p.r, p.g, p.b);
	return (max - min) / max;
}

function meanPixel(pixels: RgbPixel[]): RgbPixel {
	if (pixels.length === 0) return { r: 128, g: 128, b: 128 };
	let r = 0;
	let g = 0;
	let b = 0;
	for (const p of pixels) {
		r += p.r;
		g += p.g;
		b += p.b;
	}
	const n = pixels.length;
	return { r: r / n, g: g / n, b: b / n };
}

function kMeans(pixels: RgbPixel[], k: number, iterations: number): Cluster[] {
	// Seed initial centers evenly from the pixel array
	const step = Math.max(1, Math.floor(pixels.length / k));
	const clusters: Cluster[] = Array.from({ length: k }, (_, i) => {
		const src = pixels[Math.min(i * step, pixels.length - 1)];
		return {
			center: { r: src?.r ?? 128, g: src?.g ?? 128, b: src?.b ?? 128 },
			pixels: [] as RgbPixel[],
		};
	});

	for (let iter = 0; iter < iterations; iter++) {
		// Clear pixel assignments
		for (const cluster of clusters) cluster.pixels = [];

		// Assign each pixel to nearest center
		for (const pixel of pixels) {
			let bestIdx = 0;
			let bestDist = Infinity;
			for (let ci = 0; ci < clusters.length; ci++) {
				const cluster = clusters[ci];
				if (!cluster) continue;
				const dist = rgbDistance(pixel, cluster.center);
				if (dist < bestDist) {
					bestDist = dist;
					bestIdx = ci;
				}
			}
			clusters[bestIdx]?.pixels.push(pixel);
		}

		// Recompute centers
		for (const cluster of clusters) {
			if (cluster.pixels.length > 0) {
				cluster.center = meanPixel(cluster.pixels);
			}
		}
	}

	return clusters;
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve(img);
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error('Failed to load image'));
		};
		img.src = url;
	});
}

/**
 * Extract the dominant brand color from an image file.
 *
 * Downscales to 64x64 for speed, filters out near-white and near-black
 * pixels, clusters the remainder, and returns the most saturated cluster.
 */
export async function extractDominantColor(file: File): Promise<string> {
	const img = await loadImageElement(file);

	const SIZE = 64;
	const canvas = document.createElement('canvas');
	canvas.width = SIZE;
	canvas.height = SIZE;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas 2D context unavailable');

	ctx.drawImage(img, 0, 0, SIZE, SIZE);
	const imageData = ctx.getImageData(0, 0, SIZE, SIZE);
	const { data } = imageData;

	// Collect non-extreme pixels
	const pixels: RgbPixel[] = [];
	for (let i = 0; i < data.length; i += 4) {
		const r = data[i] ?? 0;
		const g = data[i + 1] ?? 0;
		const b = data[i + 2] ?? 0;
		const pixel: RgbPixel = { r, g, b };
		const lum = luminance(pixel);
		// Skip near-white and near-black — usually backgrounds, not brand colors
		if (lum > 0.92 || lum < 0.08) continue;
		pixels.push(pixel);
	}

	// Fallback: if almost everything was filtered, use all pixels
	if (pixels.length < 10) {
		for (let i = 0; i < data.length; i += 4) {
			pixels.push({ r: data[i] ?? 0, g: data[i + 1] ?? 0, b: data[i + 2] ?? 0 });
		}
	}

	const clusters = kMeans(pixels, 5, 12);

	// Pick the most chromatic cluster with meaningful pixel count
	const minClusterSize = Math.max(1, pixels.length * 0.02);
	const viable = clusters.filter((c) => c.pixels.length >= minClusterSize);
	const candidates = viable.length > 0 ? viable : clusters;

	let best: Cluster | undefined = candidates[0];
	let bestScore = -1;
	for (const cluster of candidates) {
		const score = saturationProxy(cluster.center) * Math.sqrt(cluster.pixels.length);
		if (score > bestScore) {
			bestScore = score;
			best = cluster;
		}
	}

	if (!best) throw new Error('No color clusters found');
	return rgbToHex(best.center);
}
