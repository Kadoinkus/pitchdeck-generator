import { resolve } from '$app/paths';
import type { ResolvedPathname } from '$app/types';

interface ShareLinks {
	sharePath: ResolvedPathname;
	pdfPath: ResolvedPathname;
	downloadPath: ResolvedPathname;
}

export function getShareLinks(token: string): ShareLinks {
	return {
		sharePath: resolve('/share/[token]', { token }),
		pdfPath: resolve('/api/pdf/[token]', { token }),
		downloadPath: resolve('/api/download/[token]', { token }),
	};
}

export function toAbsoluteUrl(pathname: ResolvedPathname, origin: string): string {
	return new URL(pathname, origin).toString();
}
