<script lang="ts">
	import type { SuggestedChange } from '$lib/ai/orchestrator.ts';
	import { setChatTarget, viewer } from '$lib/stores/viewer.svelte.ts';

	interface Props {
		/** Current form payload to send with chat requests. */
		payload?: Record<string, unknown>;
		/** Called when the user applies a suggested change. */
		onApply?: (field: string, value: string) => void;
	}

	let { payload = {}, onApply }: Props = $props();

	interface ChatMessage {
		role: 'user' | 'assistant';
		text: string;
		suggestions?: SuggestedChange[];
	}

	let isOpen = $state(false);
	let messages = $state<ChatMessage[]>([]);
	let inputText = $state('');
	let sending = $state(false);

	const chatTarget = $derived(viewer.chatTarget);

	function togglePanel(): void {
		isOpen = !isOpen;
	}

	function closePanel(): void {
		isOpen = false;
	}

	function clearTarget(): void {
		setChatTarget(null);
	}

	async function sendMessage(): Promise<void> {
		const text = inputText.trim();
		if (!text || sending) return;

		const userMsg: ChatMessage = { role: 'user', text };
		messages = [...messages, userMsg];
		inputText = '';
		sending = true;

		try {
			const response = await fetch('/api/ai/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					targetField: chatTarget?.target ?? null,
					message: text,
					payload,
				}),
			});

			const data: unknown = await response.json();
			if (isChatResponse(data)) {
				const assistantMsg: ChatMessage = {
					role: 'assistant',
					text: data.reply,
					suggestions: data.suggestedChanges,
				};
				messages = [...messages, assistantMsg];
			} else {
				messages = [
					...messages,
					{ role: 'assistant', text: 'Sorry, something went wrong.' },
				];
			}
		} catch {
			messages = [
				...messages,
				{ role: 'assistant', text: 'Network error. Please try again.' },
			];
		} finally {
			sending = false;
		}
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	interface ChatResponse {
		reply: string;
		suggestedChanges?: SuggestedChange[];
	}

	function isChatResponse(value: unknown): value is ChatResponse {
		return (
			typeof value === 'object'
			&& value !== null
			&& 'reply' in value
			&& typeof value.reply === 'string'
		);
	}

	function applyChange(field: string, value: string): void {
		onApply?.(field, value);
	}
</script>

{#if isOpen}
	<div class="viewer-chat-panel">
		<div class="chat-head">
			<strong>AI Assistant</strong>
			<button type="button" onclick={closePanel} aria-label="Close chat">
				&#10005;
			</button>
		</div>

		{#if chatTarget}
			<p class="chat-target-line">
				Targeting: <strong>{chatTarget.label}</strong>
				<button type="button" onclick={clearTarget} aria-label="Clear target">
					&#10005;
				</button>
			</p>
		{/if}

		<div class="viewer-chat-messages">
			{#each messages as msg (msg)}
				<div class="chat-message {msg.role}">{msg.text}</div>
				{#if msg.suggestions?.length}
					<div class="viewer-chat-suggestions">
						{#each msg.suggestions as suggestion (suggestion.field)}
							<div class="suggestion-card">
								<strong>{suggestion.label}</strong>
								<p>{suggestion.value}</p>
								<button
									type="button"
									onclick={() => applyChange(suggestion.field, suggestion.value)}
								>
									Apply
								</button>
							</div>
						{/each}
					</div>
				{/if}
			{/each}
		</div>

		<textarea
			placeholder="Ask the AI to refine this slide…"
			bind:value={inputText}
			onkeydown={handleKeydown}
			disabled={sending}
		></textarea>
		<button
			type="button"
			onclick={sendMessage}
			disabled={sending || !inputText.trim()}
		>
			{sending ? 'Sending…' : 'Send'}
		</button>
	</div>
{:else}
	<button
		class="viewer-chat-launcher"
		type="button"
		onclick={togglePanel}
		aria-label="Open AI chat"
	>
		&#128172;
	</button>
{/if}

<style>
	.viewer-chat-launcher {
		position: absolute;
		right: 20px;
		bottom: 20px;
		width: 52px;
		height: 52px;
		border: 1px solid rgba(255, 255, 255, 0.3);
		background: rgba(255, 255, 255, 0.14);
		color: #f2fbff;
		backdrop-filter: blur(6px);
		border-radius: 50%;
		padding: 0;
		font-size: 0.94rem;
		font-weight: 700;
		box-shadow: 0 16px 26px rgba(11, 31, 77, 0.24);
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.viewer-chat-panel {
		position: absolute;
		right: 20px;
		bottom: 20px;
		width: min(360px, calc(100vw - 24px));
		max-height: min(560px, calc(100vh - 120px));
		background: #ffffff;
		border: 1px solid #d4e1ff;
		border-radius: 16px;
		box-shadow: 0 28px 44px rgba(18, 40, 90, 0.28);
		padding: 12px;
		display: grid;
		gap: 8px;
	}

	.chat-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.chat-target-line {
		margin: 0;
		font-size: 0.8rem;
		color: #45608f;
	}

	.viewer-chat-messages {
		min-height: 120px;
		max-height: 190px;
		overflow-y: auto;
		border: 1px solid #d4e1ff;
		background: #f9fbff;
		border-radius: 10px;
		padding: 8px;
		display: grid;
		gap: 8px;
	}

	.viewer-chat-suggestions {
		display: grid;
		gap: 8px;
		max-height: 170px;
		overflow-y: auto;
	}

	.chat-message {
		border-radius: 10px;
		padding: 7px 9px;
		line-height: 1.38;
		font-size: 0.83rem;
	}

	.chat-message.user {
		background: #e9f4ff;
		border: 1px solid #c7dbff;
		color: #173d70;
	}

	.chat-message.assistant {
		background: #eff9fb;
		border: 1px solid #c9eef1;
		color: #144668;
	}

	.viewer-chat-panel textarea {
		width: 100%;
		min-height: 78px;
		resize: vertical;
		border: 1px solid #cfddff;
		border-radius: 10px;
		padding: 8px 10px;
		font: inherit;
	}

	.suggestion-card {
		border: 1px solid #d1e0ff;
		background: #f8fbff;
		border-radius: 10px;
		padding: 8px;
		display: grid;
		gap: 6px;
	}

	.suggestion-card strong {
		font-size: 0.84rem;
		color: #1c3f73;
	}

	.suggestion-card p {
		margin: 0;
		font-size: 0.8rem;
		color: #3a5c8e;
		white-space: pre-wrap;
	}
</style>
