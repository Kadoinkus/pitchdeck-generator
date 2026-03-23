import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { sanitizeFilename, safeText } from '../utils.js';
import { buildDeck } from '../deck-builder.js';
import { buildSlideData } from '../slide-data.js';
import { getTemplateDefinitions, getEditableFieldDefinitions } from '../deck-model.js';
import { generateAutofill, getAiProviderDefinitions, runChatAssistant } from '../ai/orchestrator.js';
import { readShare, saveShare } from '../share-store.js';

export function createApiRouter(outputDir) {
  const router = Router();

  function sanitizePayloadForShare(input = {}) {
    const {
      aiTextApiKey: _aiTextApiKey,
      aiImageApiKey: _aiImageApiKey,
      ...rest
    } = input;

    return rest;
  }

  router.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  router.get('/templates', (_req, res) => {
    res.json({ success: true, templates: getTemplateDefinitions() });
  });

  router.get('/editable-fields', (_req, res) => {
    res.json({ success: true, fields: getEditableFieldDefinitions() });
  });

  router.get('/ai/providers', (_req, res) => {
    res.json({ success: true, providers: getAiProviderDefinitions() });
  });

  router.post('/preview', (req, res) => {
    try {
      const slideData = buildSlideData(req.body || {});
      res.json({ success: true, slideData });
    } catch (error) {
      console.error('Preview build failed:', error);
      res.status(500).json({ success: false, message: 'Could not build preview.' });
    }
  });

  router.get('/share/:token', async (req, res) => {
    try {
      const record = await readShare(outputDir, req.params.token);
      if (!record) {
        return res.status(404).json({ success: false, message: 'Share link not found.' });
      }

      res.json({
        success: true,
        token: record.token,
        createdAt: record.createdAt,
        slideData: record.slideData || null,
        downloadUrl: record.downloadUrl || null
      });
    } catch (error) {
      console.error('Share lookup failed:', error);
      res.status(500).json({ success: false, message: 'Could not load shared deck.' });
    }
  });

  router.post('/ai/autofill', async (req, res) => {
    try {
      const output = await generateAutofill(req.body || {});
      res.json({ success: true, ...output });
    } catch (error) {
      console.error('AI autofill failed:', error);
      res.status(500).json({ success: false, message: 'Could not generate AI autofill content.' });
    }
  });

  router.post('/ai/chat', async (req, res) => {
    try {
      const payload = req.body?.payload || {};
      const chatRequest = {
        targetField: req.body?.targetField,
        message: req.body?.message,
        history: Array.isArray(req.body?.history) ? req.body.history : []
      };

      const output = await runChatAssistant(payload, chatRequest);
      res.json({ success: true, ...output });
    } catch (error) {
      console.error('AI chat failed:', error);
      res.status(500).json({ success: false, message: 'Could not generate AI chat response.' });
    }
  });

  router.post('/draft-text', async (req, res) => {
    try {
      const output = await generateAutofill(req.body || {});
      res.json({ success: true, draft: output.draft });
    } catch (error) {
      console.error('Text draft generation failed:', error);
      res.status(500).json({ success: false, message: 'Could not generate text draft.' });
    }
  });

  router.post('/draft-images', async (req, res) => {
    try {
      const output = await generateAutofill(req.body || {});
      res.json({ success: true, draft: output.imageDraft });
    } catch (error) {
      console.error('Image prompt generation failed:', error);
      res.status(500).json({ success: false, message: 'Could not generate image prompts.' });
    }
  });

  router.post('/generate', async (req, res) => {
    try {
      await fs.mkdir(outputDir, { recursive: true });

      const payload = req.body || {};
      const deck = buildDeck(payload);
      const clientName = safeText(payload.clientName, 'client');
      const projectTitle = safeText(payload.projectTitle, 'proposal');
      const deckVersion = safeText(payload.deckVersion, 'v1').replace(/[^a-z0-9.-]/gi, '-');
      const fileBase = sanitizeFilename(`${clientName}-${projectTitle}-${deckVersion}`);
      const fileName = `${fileBase}-${Date.now()}.pptx`;
      const filePath = path.join(outputDir, fileName);

      await deck.writeFile({ fileName: filePath });

      const slideData = buildSlideData(payload);
      const shareToken = await saveShare(outputDir, {
        payload: sanitizePayloadForShare(payload),
        slideData,
        fileName,
        downloadUrl: `/generated/${fileName}`
      });

      res.json({
        success: true,
        fileName,
        downloadUrl: `/generated/${fileName}`,
        slideData,
        shareToken,
        shareUrl: `/share/${shareToken}`,
        pdfUrl: `/share/${shareToken}?print=1`
      });
    } catch (error) {
      console.error('Deck generation failed:', error);
      res.status(500).json({
        success: false,
        message: 'Could not generate the PowerPoint file.'
      });
    }
  });

  return router;
}
