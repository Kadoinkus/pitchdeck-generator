import { z } from 'zod';
import { PROVIDER_IDS, type ProviderId, PROVIDERS } from './registry.ts';

export const AiUserConfigSchema = z.object({
	providerId: z.enum(PROVIDER_IDS),
	modelId: z.string().min(1),
	baseURL: z.string().url().or(z.literal('')),
	apiKey: z.string().default(''),
});

export type AiUserConfig = z.infer<typeof AiUserConfigSchema>;

const STORAGE_KEY = 'ai-config';

export function loadConfig(): AiUserConfig | null {
	if (typeof localStorage === 'undefined') return null;
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return null;
	try {
		const parsed = AiUserConfigSchema.safeParse(JSON.parse(raw));
		return parsed.success ? parsed.data : null;
	} catch {
		return null;
	}
}

export function saveConfig(config: AiUserConfig): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearConfig(): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.removeItem(STORAGE_KEY);
}

export function getDefaultConfig(providerId: ProviderId): AiUserConfig {
	const provider = PROVIDERS[providerId];
	const defaultModel = provider.models[0] ?? '';
	return {
		providerId,
		modelId: defaultModel,
		baseURL: provider.defaultBaseURL,
		apiKey: '',
	};
}
