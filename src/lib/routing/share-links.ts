import type { ResolvedPathname } from '$app/types';

export function toAbsoluteUrl(pathname: ResolvedPathname, origin: string): string {
	return new URL(pathname, origin).toString();
}
