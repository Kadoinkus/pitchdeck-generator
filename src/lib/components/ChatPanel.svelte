<script lang="ts">
	import { chat } from '$lib/ai.remote';
	import type { SuggestedChange } from '$lib/ai/orchestrator';
	import { viewer } from '$lib/stores/viewer.svelte';
	import { tick } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';

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
	let chatInputEl: HTMLTextAreaElement | undefined = $state();
	let panelEl: HTMLDivElement | undefined = $state();
	/** Element that held focus before the panel opened (M6: focus restore). */
	let previousFocus: Element | null = null;
	let sending = $state(false);
	let panelWidth = $state(380);
	let panelHeight = $state(480);
	let resizeAxis = $state<'left' | 'top' | 'corner' | null>(null);
	/* F6: Not read reactively — plain let suffices. */
	let resizeStart = { x: 0, y: 0, w: 0, h: 0 };

	const MIN_W = 300;
	const MAX_W = 700;
	const MIN_H = 320;
	const MAX_H = 800;
	const mobile = new MediaQuery('max-width: 480px');
	const isMobile = $derived(mobile.current);

	const chatTarget = $derived(viewer.chatTarget);

	function beginResize(
		axis: 'left' | 'top' | 'corner',
		event: PointerEvent,
	): void {
		event.preventDefault();
		resizeAxis = axis;
		resizeStart = {
			x: event.clientX,
			y: event.clientY,
			w: panelWidth,
			h: panelHeight,
		};
		const target = event.currentTarget;
		if (target instanceof HTMLElement) {
			target.setPointerCapture(event.pointerId);
		}
	}

	function moveResize(event: PointerEvent): void {
		if (!resizeAxis) return;
		const dx = resizeStart.x - event.clientX;
		const dy = resizeStart.y - event.clientY;

		if (resizeAxis === 'left' || resizeAxis === 'corner') {
			panelWidth = Math.max(MIN_W, Math.min(resizeStart.w + dx, MAX_W));
		}
		if (resizeAxis === 'top' || resizeAxis === 'corner') {
			panelHeight = Math.max(MIN_H, Math.min(resizeStart.h + dy, MAX_H));
		}
	}

	function endResize(): void {
		resizeAxis = null;
	}

	function togglePanel(): void {
		if (isOpen) {
			closePanel();
		} else {
			openPanel();
		}
	}

	async function openPanel(): Promise<void> {
		previousFocus = document.activeElement;
		isOpen = true;
		/* M6: Focus textarea after DOM update. */
		await tick();
		chatInputEl?.focus();
	}

	function closePanel(): void {
		isOpen = false;
		/* M6: Restore focus to whatever was focused before panel opened. */
		const el = previousFocus;
		previousFocus = null;
		if (el instanceof HTMLElement) {
			queueMicrotask(() => el.focus());
		}
	}

	function clearTarget(): void {
		viewer.setChatTarget(null);
	}

	async function sendMessage(): Promise<void> {
		const text = inputText.trim();
		if (!text || sending) return;

		const userMsg: ChatMessage = { role: 'user', text };
		messages = [...messages, userMsg];
		inputText = '';
		sending = true;

		try {
			const result = await chat({
				targetField: chatTarget?.target ?? null,
				message: text,
				payload: payload ?? {},
			});

			const assistantMsg: ChatMessage = {
				role: 'assistant',
				text: result.reply,
				suggestions: result.suggestedChanges,
			};
			messages = [...messages, assistantMsg];
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

	/** M5: Escape closes the chat panel. Capture phase + stopPropagation
	 *  prevents the viewer's window-level Escape handler from also firing. */
	$effect(() => {
		const el = panelEl;
		if (!el) return;

		function onEscape(event: KeyboardEvent): void {
			if (event.key === 'Escape') {
				event.preventDefault();
				event.stopPropagation();
				closePanel();
			}
		}
		el.addEventListener('keydown', onEscape, true);
		return () => el.removeEventListener('keydown', onEscape, true);
	});

	function applyChange(field: string, value: string): void {
		onApply?.(field, value);
	}
</script>

{#if isOpen}
	{#if isMobile}
		<button
			class="chat-backdrop"
			type="button"
			aria-label="Close chat"
			tabindex="-1"
			onclick={closePanel}
		>
		</button>
	{/if}
	<div
		class="panel"
		bind:this={panelEl}
		class:is-resizing={resizeAxis !== null}
		style:width={isMobile ? undefined : `${panelWidth}px`}
		style:height={isMobile ? undefined : `${panelHeight}px`}
	>
		<!-- resize handles -->
		<div
			class="resize-handle left"
			aria-hidden="true"
			onpointerdown={(e) => beginResize('left', e)}
			onpointermove={moveResize}
			onpointerup={endResize}
			onpointercancel={endResize}
		>
		</div>
		<div
			class="resize-handle top"
			aria-hidden="true"
			onpointerdown={(e) => beginResize('top', e)}
			onpointermove={moveResize}
			onpointerup={endResize}
			onpointercancel={endResize}
		>
		</div>
		<div
			class="resize-handle corner"
			aria-hidden="true"
			onpointerdown={(e) => beginResize('corner', e)}
			onpointermove={moveResize}
			onpointerup={endResize}
			onpointercancel={endResize}
		>
		</div>

		<header class="head">
			<div class="head-title">
				<svg class="head-icon" viewBox="0 0 20 20" fill="none">
					<path
						d="M10 2a7 7 0 0 0-7 7c0 1.8.7 3.4 1.8 4.6L3.5 17l3.6-1.2A7 7 0 1 0 10 2Z"
						fill="url(#cg)"
						stroke="url(#cg)"
						stroke-width=".6"
					/>
					<circle cx="7" cy="10" r="1" fill="#fff" />
					<circle cx="10" cy="10" r="1" fill="#fff" />
					<circle cx="13" cy="10" r="1" fill="#fff" />
					<defs>
						<linearGradient
							id="cg"
							x1="2"
							y1="3"
							x2="18"
							y2="17"
						><stop stop-color="var(--accent)" /><stop
								offset="1"
								stop-color="var(--secondary)"
							/></linearGradient>
					</defs>
				</svg>
				<span>AI Copilot</span>
			</div>
			<button
				class="icon-btn"
				type="button"
				onclick={closePanel}
				aria-label="Close chat"
			>
				<svg viewBox="0 0 16 16" fill="none" width="14" height="14">
					<path
						d="M4 4l8 8M12 4l-8 8"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
					/>
				</svg>
			</button>
		</header>

		{#if chatTarget}
			<div class="target-pill">
				<span class="target-dot"></span>
				<span class="target-label">{chatTarget.label}</span>
				<button
					class="icon-btn small"
					type="button"
					onclick={clearTarget}
					aria-label="Clear target"
				>
					<svg viewBox="0 0 16 16" fill="none" width="11" height="11">
						<path
							d="M4 4l8 8M12 4l-8 8"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
						/>
					</svg>
				</button>
			</div>
		{/if}

		<div class="messages">
			{#each messages as msg (msg)}
				<div class="bubble {msg.role}">
					{#if msg.role === 'assistant'}
						<svg
							class="bubble-avatar"
							viewBox="0 0 18 18"
							fill="none"
							width="16"
							height="16"
						>
							<circle cx="9" cy="9" r="9" fill="url(#ba)" />
							<path
								d="M6 9.5l2 2 4-4"
								stroke="#fff"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<defs>
								<linearGradient
									id="ba"
									x1="0"
									y1="0"
									x2="18"
									y2="18"
								><stop stop-color="var(--accent)" /><stop
										offset="1"
										stop-color="#1395ff"
									/></linearGradient>
							</defs>
						</svg>
					{/if}
					<p>{msg.text}</p>
				</div>
				{#if msg.suggestions?.length}
					<div class="suggestions">
						{#each msg.suggestions as suggestion (suggestion.field)}
							<div class="suggestion">
								<div class="suggestion-head">
									<strong>{suggestion.label}</strong>
								</div>
								<p class="suggestion-text">{suggestion.value}</p>
								<button
									class="apply-btn"
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
			{#if sending}
				<div class="bubble assistant">
					<svg
						class="bubble-avatar"
						viewBox="0 0 18 18"
						fill="none"
						width="16"
						height="16"
					>
						<circle cx="9" cy="9" r="9" fill="url(#ba2)" />
						<defs>
							<linearGradient
								id="ba2"
								x1="0"
								y1="0"
								x2="18"
								y2="18"
							><stop stop-color="var(--accent)" /><stop
									offset="1"
									stop-color="#1395ff"
								/></linearGradient>
						</defs>
					</svg>
					<div class="typing">
						<span></span><span></span><span></span>
					</div>
				</div>
			{/if}
		</div>

		<div class="input-row">
			<textarea
				class="chat-input"
				placeholder="Ask the AI to refine this slide…"
				bind:value={inputText}
				bind:this={chatInputEl}
				onkeydown={handleKeydown}
				disabled={sending}
				rows="2"
			></textarea>
			<button
				class="send-btn"
				type="button"
				onclick={sendMessage}
				disabled={sending || !inputText.trim()}
				aria-label="Send message"
			>
				<svg viewBox="0 0 20 20" fill="none" width="18" height="18">
					<path
						d="M3.5 10h9M17 10L3.5 3v5.5l6 1.5-6 1.5V17L17 10Z"
						fill="currentColor"
					/>
				</svg>
			</button>
		</div>
	</div>
{:else}
	<button
		class="launcher"
		type="button"
		onclick={togglePanel}
		aria-label="Open AI chat"
	>
		<svg viewBox="0 0 24 24" width="24" height="24">
			<path
				d="M12 3C7.03 3 3 6.58 3 11c0 2.42 1.33 4.58 3.4 6.03L5 21l4.2-2.08c.9.2 1.84.33 2.8.33 4.97 0 9-3.58 9-8s-4.03-8-9-8Z"
				fill="none"
				stroke="#fff"
				stroke-width="1.8"
				stroke-linejoin="round"
			/>
			<circle cx="8.5" cy="11" r="1.2" fill="#fff" />
			<circle cx="12" cy="11" r="1.2" fill="#fff" />
			<circle cx="15.5" cy="11" r="1.2" fill="#fff" />
		</svg>
	</button>
{/if}

<style>
	/* ── Backdrop (mobile tap-to-close) ── */

	.chat-backdrop {
		display: none;
	}

	/* ── Launcher ── */

	.launcher {
		position: absolute;
		right: 20px;
		bottom: 20px;
		width: 52px;
		height: 52px;
		border: none;
		background: linear-gradient(
			135deg,
			var(--accent),
			#1395ff 60%,
			var(--secondary)
		);
		border-radius: 50%;
		padding: 0;
		box-shadow:
			0 6px 20px rgba(0, 196, 204, 0.35),
			0 2px 6px rgba(11, 31, 77, 0.12);
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	@media (hover: hover) {
		.launcher:hover {
			transform: translateY(-2px) scale(1.05);
			box-shadow:
				0 10px 28px rgba(0, 196, 204, 0.4),
				0 2px 8px rgba(11, 31, 77, 0.15);
		}
	}

	/* ── Panel ── */

	.panel {
		position: absolute;
		right: 16px;
		bottom: 16px;
		max-width: calc(100vw - 32px);
		max-height: calc(100vh - 100px);
		background: var(--overlay-bg);
		backdrop-filter: blur(20px);
		border: 1px solid var(--card-border);
		border-radius: 20px;
		box-shadow: var(--shadow);
		padding: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	@supports (height: 100dvh) {
		.panel {
			max-height: calc(100dvh - 100px);
		}
	}

	.panel.is-resizing {
		user-select: none;
	}

	/* ── Resize handles ── */

	.resize-handle {
		position: absolute;
		z-index: 1;
	}

	.resize-handle.left {
		top: 12px;
		bottom: 12px;
		left: -4px;
		width: 8px;
		cursor: ew-resize;
	}

	.resize-handle.top {
		left: 12px;
		right: 12px;
		top: -4px;
		height: 8px;
		cursor: ns-resize;
	}

	.resize-handle.corner {
		top: -6px;
		left: -6px;
		width: 16px;
		height: 16px;
		cursor: nwse-resize;
	}

	/* ── Header ── */

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 16px 12px;
		border-bottom: 1px solid var(--card-border);
	}

	.head-title {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 700;
		font-size: 0.92rem;
		color: var(--primary);
	}

	.head-icon {
		width: 22px;
		height: 22px;
	}

	/* ── Icon buttons ── */

	.icon-btn {
		width: 28px;
		height: 28px;
		border-radius: 8px;
		background: var(--subtle-bg);
		border: none;
		color: var(--muted);
		padding: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease;
	}

	@media (hover: hover) {
		.icon-btn:hover {
			background: var(--scroll-thumb);
			color: var(--text);
			transform: none;
		}
	}

	.icon-btn.small {
		width: 20px;
		height: 20px;
		border-radius: 6px;
	}

	/* ── Target pill ── */

	.target-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin: 8px 16px 0;
		padding: 5px 8px 5px 10px;
		background: linear-gradient(
			135deg,
			rgba(0, 196, 204, 0.1),
			rgba(19, 149, 255, 0.08)
		);
		border: 1px solid rgba(0, 196, 204, 0.25);
		border-radius: 20px;
		width: fit-content;
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--accent);
	}

	.target-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--accent);
		flex-shrink: 0;
	}

	.target-label {
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* ── Messages ── */

	.messages {
		flex: 1;
		min-height: 80px;
		overflow-y: auto;
		padding: 12px 16px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.messages::-webkit-scrollbar {
		width: 4px;
	}

	.messages::-webkit-scrollbar-thumb {
		background: var(--scroll-thumb);
		border-radius: 4px;
	}

	.bubble {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		max-width: 92%;
		animation: fade-in 0.2s ease;
	}

	.bubble p {
		margin: 0;
		font-size: 0.83rem;
		line-height: 1.5;
		padding: 8px 12px;
		border-radius: 14px;
	}

	.bubble.user {
		align-self: flex-end;
		flex-direction: row-reverse;
	}

	.bubble.user p {
		background: var(--primary);
		color: var(--card);
		border-bottom-right-radius: 4px;
	}

	.bubble.assistant p {
		background: var(--subtle-bg);
		color: var(--text);
		border-bottom-left-radius: 4px;
	}

	.bubble-avatar {
		flex-shrink: 0;
		margin-top: 4px;
	}

	/* ── Typing indicator ── */

	.typing {
		display: flex;
		gap: 4px;
		padding: 10px 14px;
		background: var(--subtle-bg);
		border-radius: 14px;
		border-bottom-left-radius: 4px;
	}

	.typing span {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--muted);
		opacity: 0.4;
		animation: typing-dot 1.4s infinite ease-in-out;
	}

	.typing span:nth-child(2) {
		animation-delay: 0.2s;
	}

	.typing span:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes typing-dot {
		0%, 60%, 100% {
			opacity: 0.3;
			transform: translateY(0);
		}
		30% {
			opacity: 1;
			transform: translateY(-3px);
		}
	}

	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ── Suggestions ── */

	.suggestions {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding-left: 24px;
		animation: fade-in 0.2s ease;
	}

	.suggestion {
		border: 1px solid var(--card-border);
		background: var(--card-bg-subtle);
		border-radius: 12px;
		padding: 10px 12px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.suggestion-head strong {
		font-size: 0.78rem;
		color: var(--primary);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.suggestion-text {
		margin: 0;
		font-size: 0.82rem;
		color: var(--muted);
		line-height: 1.45;
		white-space: pre-wrap;
	}

	.apply-btn {
		align-self: flex-start;
		padding: 4px 12px;
		font-size: 0.75rem;
		font-weight: 700;
		border-radius: 8px;
		background: linear-gradient(135deg, var(--accent), #1395ff);
		color: #fff;
		border: none;
		cursor: pointer;
		transition: transform 0.15s ease, opacity 0.15s ease;
	}

	@media (hover: hover) {
		.apply-btn:hover {
			transform: translateY(-1px);
		}
	}

	/* ── Input row ── */

	.input-row {
		display: flex;
		align-items: flex-end;
		gap: 8px;
		padding: 10px 12px 12px;
		border-top: 1px solid var(--card-border);
		background: var(--card-bg-subtle);
	}

	.chat-input {
		flex: 1;
		min-height: 40px;
		max-height: 120px;
		resize: none;
		border: 1px solid var(--input-border);
		border-radius: 12px;
		padding: 9px 12px;
		font: inherit;
		font-size: 0.85rem;
		line-height: 1.45;
		background: var(--input-bg);
		color: var(--text);
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}

	.chat-input::placeholder {
		color: var(--muted);
		opacity: 0.6;
	}

	.chat-input:focus-visible {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--input-focus-shadow);
	}

	.send-btn {
		width: 40px;
		height: 40px;
		flex-shrink: 0;
		border-radius: 12px;
		border: none;
		background: linear-gradient(135deg, var(--accent), #1395ff);
		color: #fff;
		padding: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: transform 0.15s ease, opacity 0.15s ease;
	}

	@media (hover: hover) {
		.send-btn:hover {
			transform: translateY(-1px);
		}
	}

	.send-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
		transform: none;
	}

	/* H4: Meet 44px WCAG touch target minimum on tablets */
	@media (max-width: 980px) {
		.icon-btn {
			min-width: 44px;
			min-height: 44px;
		}

		.send-btn {
			min-width: 44px;
			min-height: 44px;
		}

		.apply-btn {
			min-height: 44px;
		}
	}

	/* ── Mobile ── */

	@media (max-width: 480px) {
		.chat-backdrop {
			display: block;
			position: fixed;
			inset: 0;
			border-radius: 0;
			background: rgba(0, 0, 0, 0.35);
			z-index: 0;
			border: none;
			padding: 0;
			cursor: default;
		}

		.panel {
			right: 8px;
			bottom: max(8px, env(safe-area-inset-bottom));
			width: calc(100vw - 16px);
			max-height: calc(100vh - 24px);
			border-radius: 16px;
			z-index: 1;
		}

		.resize-handle {
			display: none;
		}

		.icon-btn {
			width: 44px;
			height: 44px;
		}

		.icon-btn.small {
			width: 32px;
			height: 32px;
		}

		.send-btn {
			width: 44px;
			height: 44px;
		}

		.apply-btn {
			min-height: 44px;
			padding: 8px 16px;
		}
	}
</style>
