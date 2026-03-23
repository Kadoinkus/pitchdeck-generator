import { defineHandler } from 'nitro';
import { type AutofillResult, generateAutofill } from '../../../src/ai/orchestrator.ts';

export default defineHandler(async (event) => {
	const payload = await event.req.json();
	const output: AutofillResult = await generateAutofill(payload);
	return { success: true, ...output };
});
