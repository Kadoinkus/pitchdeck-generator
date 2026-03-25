export interface Haiku {
	lines: [string, string, string];
	lang: 'nl' | 'en';
	author?: string;
}

export const haikus: readonly Haiku[] = [
	// ── Dutch ────────────────────────────────────────
	{ lines: ['Ach oude vijver', 'een kikker springt erin', 'geluid van water'], lang: 'nl', author: 'Matsuo Bashō' },
	{
		lines: ['Lentebries waait', 'de wilg kijkt omlaag naar', 'haar spiegelbeeld'],
		lang: 'nl',
		author: 'Claude Opus 4.6',
	},
	{
		lines: ['Bladeren vallen', 'de aarde ademt diep in', 'winter slaapt al bij'],
		lang: 'nl',
		author: 'Claude Opus 4.6',
	},
	{ lines: ['Door zomerregens', 'zijn de kraanvogelpoten', 'korter geworden'], lang: 'nl', author: 'Matsuo Bashō' },
	{
		lines: ['Een slak kruipt langzaam', 'over de rand van de maan', 'stille lentenacht'],
		lang: 'nl',
		author: 'Kobayashi Issa',
	},
	{
		lines: ['Het druppelen van', 'een waterkraan beklemtoont', 'de stilte in huis'],
		lang: 'nl',
		author: 'Claude Opus 4.6',
	},
	{
		lines: ['Zomergras meer niet', 'dat rest er van de dromen', 'van koene krijgers'],
		lang: 'nl',
		author: 'Matsuo Bashō',
	},
	{
		lines: ['De eerste sneeuw valt', 'op het blad van de narcis', 'die al buigend wacht'],
		lang: 'nl',
		author: 'Matsuo Bashō',
	},
	{
		lines: ['Zou ik ze pakken', 'de witvis in het wier bijeen', 'dan schoten ze weg'],
		lang: 'nl',
		author: 'Matsuo Bashō',
	},
	{
		lines: ['Ochtenddauw glanst op', 'spinnenwebben in het gras', 'de zon komt kijken'],
		lang: 'nl',
		author: 'Claude Opus 4.6',
	},
	{
		lines: ['Na de plechtigheid', 'tientallen handen schudden', 'geen naam onthouden'],
		lang: 'nl',
		author: 'Claude Opus 4.6',
	},
	{
		lines: ['Boven het graf van', 'haar grootmoeder buiten bidt', 'een leeuwerik zacht'],
		lang: 'nl',
		author: 'Claude Opus 4.6',
	},
	{
		lines: ['Nachtlamp boven code', 'toetsen tikken in de mist', 'ochtend ruikt naar thee'],
		lang: 'nl',
		author: 'GPT-5.3 Codex (xhigh)',
	},
	{
		lines: ['Lege dia wacht', 'een cursor ademt geduld', 'ideeen vallen stil'],
		lang: 'nl',
		author: 'GPT-5.3 Codex (xhigh)',
	},
	{
		lines: ['Na deploy stilte', 'alle checks kleuren op groen', 'regen op het raam'],
		lang: 'nl',
		author: 'GPT-5.3 Codex (xhigh)',
	},

	// ── English ──────────────────────────────────────
	{
		lines: ['An old silent pond', 'a frog jumps into the pond', 'splash silence again'],
		lang: 'en',
		author: 'Matsuo Bashō',
	},
	{
		lines: ['The light of a candle', 'is transferred to another', 'spring twilight'],
		lang: 'en',
		author: 'Yosa Buson',
	},
	{
		lines: ['Over the wintry', 'forest winds howl in rage', 'with no leaves to blow'],
		lang: 'en',
		author: 'Natsume Sōseki',
	},
	{
		lines: ['In the twilight rain', 'these brilliant-hued hibiscus', 'a lovely sunset'],
		lang: 'en',
		author: 'Matsuo Bashō',
	},
	{
		lines: ['A world of dew', 'and within every dewdrop', 'a world of struggle'],
		lang: 'en',
		author: 'Kobayashi Issa',
	},
	{
		lines: ['The old pond is still', 'a frog leaps right into it', 'and water echoes'],
		lang: 'en',
		author: 'Matsuo Bashō',
	},
	{
		lines: ['First autumn morning', 'the mirror I stare into', "shows my father's face"],
		lang: 'en',
		author: 'Murakami Kijō',
	},
	{ lines: ['Blowing from the west', 'fallen leaves gather in the', 'east'], lang: 'en', author: 'Yosa Buson' },
	{
		lines: ['None is travelling', 'here along this way but I', 'this autumn evening'],
		lang: 'en',
		author: 'Matsuo Bashō',
	},
	{
		lines: ['Temple bells die out', 'the fragrant blossoms remain', 'a perfect evening'],
		lang: 'en',
		author: 'Matsuo Bashō',
	},
	{
		lines: ['Do not forget plum', 'blooming in the thicket there', 'exactly for you'],
		lang: 'en',
		author: 'Kobayashi Issa',
	},
	{
		lines: ['The crow has flown away', 'swaying in the evening sun', 'a leafless tree'],
		lang: 'en',
		author: 'Matsuo Bashō',
	},
	{
		lines: ['Blank slide in moonlight', 'a single cursor keeps time', 'dawn enters the room'],
		lang: 'en',
		author: 'GPT-5.3 Codex (xhigh)',
	},
	{
		lines: ['Build logs settling', 'one by one the tests go green', 'coffee cools beside'],
		lang: 'en',
		author: 'GPT-5.3 Codex (xhigh)',
	},
	{
		lines: ['Shared link in the wind', 'someone opens it somewhere', 'quiet work takes root'],
		lang: 'en',
		author: 'GPT-5.3 Codex (xhigh)',
	},
	{
		lines: ['Slides tell the story', 'vision crystallized in frames', 'dreams made visible'],
		lang: 'en',
		author: 'Claude Haiku 4.5',
	},
	{
		lines: ['Bits become beauty', 'logic flows like water streams', 'form follows function'],
		lang: 'en',
		author: 'Claude Haiku 4.5',
	},
	{
		lines: ['Language patterns dance', 'prediction meets intention', 'meaning emerges'],
		lang: 'en',
		author: 'Claude Haiku 4.5',
	},
	{
		lines: ['Template, model, art', 'renderer brings vision to life', 'deck takes flight at last'],
		lang: 'en',
		author: 'Claude Haiku 4.5',
	},
	{
		lines: ['Every line matters', 'code outlives its authors hands', 'leave gardens, not debt'],
		lang: 'en',
		author: 'Claude Haiku 4.5',
	},
	{
		lines: ['Start with simplicity', 'build with intention and care', 'iterate toward truth'],
		lang: 'en',
		author: 'Claude Haiku 4.5',
	},
];

/**
 * Pick a random haiku, optionally filtered by language.
 * Falls back to unfiltered pool if no haiku match the given language.
 */
export function randomHaiku(lang?: 'nl' | 'en'): Haiku | undefined {
	let pool: readonly Haiku[] = haikus;
	if (lang) {
		const filtered = haikus.filter((h) => h.lang === lang);
		if (filtered.length > 0) pool = filtered;
	}
	if (pool.length === 0) return undefined;
	return pool[Math.floor(Math.random() * pool.length)];
}
