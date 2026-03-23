import type { Request, Response } from 'express';
import { Router } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { generateAutofill, getAiProviderDefinitions, runChatAssistant } from '../ai/orchestrator.ts';
import { buildDeck } from '../deck-builder.ts';
import { getEditableFieldDefinitions, getTemplateDefinitions } from '../deck-model.ts';
import { readShare, saveShare } from '../share-store.ts';
import { buildSlideData } from '../slide-data.ts';
import { safeText, sanitizeFilename } from '../utils.ts';

interface ShareablePayload extends Record<string, unknown> {
	aiTextApiKey?: string;
	aiImageApiKey?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function createApiRouter(outputDir: string): ReturnType<typeof Router> {
	const router = Router();

	function sanitizePayloadForShare(
		input: ShareablePayload = {},
	): Record<string, unknown> {
		const {
			aiTextApiKey: _aiTextApiKey,
			aiImageApiKey: _aiImageApiKey,
			...rest
		} = input;

		return rest;
	}

	router.get('/health', (_req: Request, res: Response): void => {
		res.json({ ok: true });
	});

	router.get('/templates', (_req: Request, res: Response): void => {
		res.json({ success: true, templates: getTemplateDefinitions() });
	});

	router.get('/editable-fields', (_req: Request, res: Response): void => {
		res.json({ success: true, fields: getEditableFieldDefinitions() });
	});

	router.get('/ai/providers', (_req: Request, res: Response): void => {
		res.json({ success: true, providers: getAiProviderDefinitions() });
	});

	router.post('/preview', (req: Request, res: Response): void => {
		try {
			const payload: Record<string, unknown> = req.body || {};
			const slideData = buildSlideData(payload);
			res.json({ success: true, slideData });
		} catch (error: unknown) {
			console.error('Preview build failed:', error);
			res
				.status(500)
				.json({ success: false, message: 'Could not build preview.' });
		}
	});

	router.get(
		'/share/:token',
		async (req: Request, res: Response): Promise<void> => {
			try {
				const token = Array.isArray(req.params.token)
					? req.params.token[0]
					: req.params.token;
				if (!token) {
					res
						.status(400)
						.json({ success: false, message: 'Share token is missing.' });
					return;
				}

				const record = await readShare(outputDir, token);
				if (!record) {
					res
						.status(404)
						.json({ success: false, message: 'Share link not found.' });
					return;
				}

				res.json({
					success: true,
					token: record.token,
					createdAt: record.createdAt,
					slideData: record.slideData || null,
					downloadUrl: record.downloadUrl || null,
				});
			} catch (error: unknown) {
				console.error('Share lookup failed:', error);
				res
					.status(500)
					.json({ success: false, message: 'Could not load shared deck.' });
			}
		},
	);

	router.post(
		'/ai/autofill',
		async (req: Request, res: Response): Promise<void> => {
			try {
				const payload: Record<string, unknown> = req.body || {};
				const output = await generateAutofill(payload);
				res.json({ success: true, ...output });
			} catch (error: unknown) {
				console.error('AI autofill failed:', error);
				res.status(500).json({
					success: false,
					message: 'Could not generate AI autofill content.',
				});
			}
		},
	);

	router.post(
		'/ai/chat',
		async (req: Request, res: Response): Promise<void> => {
			try {
				const body: Record<string, unknown> = req.body || {};
				const payload: Record<string, unknown> = isRecord(body.payload)
					? body.payload
					: {};
				const chatRequest = {
					targetField: body.targetField,
					message: body.message,
					history: Array.isArray(body.history) ? body.history : [],
				};

				const output = await runChatAssistant(payload, chatRequest);
				res.json({ success: true, ...output });
			} catch (error: unknown) {
				console.error('AI chat failed:', error);
				res.status(500).json({
					success: false,
					message: 'Could not generate AI chat response.',
				});
			}
		},
	);

	router.post(
		'/draft-text',
		async (req: Request, res: Response): Promise<void> => {
			try {
				const payload: Record<string, unknown> = req.body || {};
				const output = await generateAutofill(payload);
				res.json({ success: true, draft: output.draft });
			} catch (error: unknown) {
				console.error('Text draft generation failed:', error);
				res
					.status(500)
					.json({ success: false, message: 'Could not generate text draft.' });
			}
		},
	);

	router.post(
		'/draft-images',
		async (req: Request, res: Response): Promise<void> => {
			try {
				const payload: Record<string, unknown> = req.body || {};
				const output = await generateAutofill(payload);
				res.json({ success: true, draft: output.imageDraft });
			} catch (error: unknown) {
				console.error('Image prompt generation failed:', error);
				res.status(500).json({
					success: false,
					message: 'Could not generate image prompts.',
				});
			}
		},
	);

	router.post(
		'/generate',
		async (req: Request, res: Response): Promise<void> => {
			try {
				await fs.mkdir(outputDir, { recursive: true });

				const payload: Record<string, unknown> = req.body || {};
				const deck = buildDeck(payload);
				const clientName = safeText(payload.clientName, 'client');
				const projectTitle = safeText(payload.projectTitle, 'proposal');
				const deckVersion = safeText(payload.deckVersion, 'v1').replace(
					/[^a-z0-9.-]/gi,
					'-',
				);
				const fileBase = sanitizeFilename(
					`${clientName}-${projectTitle}-${deckVersion}`,
				);
				const fileName = `${fileBase}-${Date.now()}.pptx`;
				const filePath = path.join(outputDir, fileName);

				await deck.writeFile({ fileName: filePath });

				const slideData = buildSlideData(payload);
				const shareToken = await saveShare(outputDir, {
					payload: sanitizePayloadForShare(payload),
					slideData,
					fileName,
					downloadUrl: `/generated/${fileName}`,
				});

				res.json({
					success: true,
					fileName,
					downloadUrl: `/generated/${fileName}`,
					slideData,
					shareToken,
					shareUrl: `/share/${shareToken}`,
					pdfUrl: `/share/${shareToken}?print=1`,
				});
			} catch (error: unknown) {
				console.error('Deck generation failed:', error);
				res.status(500).json({
					success: false,
					message: 'Could not generate the PowerPoint file.',
				});
			}
		},
	);

	return router;
}
