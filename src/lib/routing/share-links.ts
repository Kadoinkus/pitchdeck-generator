import { resolve } from '$app/paths';

interface ShareLinks {
	sharePath: string;
	pdfPath: string;
	downloadPath: string;
}

export function getShareLinks(token: string): ShareLinks {
	return {
		sharePath: resolve('/share/[token]', { token }),
		pdfPath: resolve('/share/[token]?print=1', { token }),
		downloadPath: resolve('/api/download/[token]', { token }),
	};
}

export function toAbsoluteUrl(pathname: string, origin: string): string {
	return new URL(pathname, origin).toString();
}
