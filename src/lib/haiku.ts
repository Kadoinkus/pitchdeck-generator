export interface Haiku {
	lines: [string, string, string];
	lang: 'nl' | 'en';
	author?: string;
}

export const haikus: readonly Haiku[] = [
	// ── Dutch ────────────────────────────────────────
	{ lines: ['Ach oude vijver', 'een kikker springt erin', 'geluid van water'], lang: 'nl', author: 'Matsuo Bashō' },
	{ lines: ['Lentebries waait', 'de wilg kijkt omlaag naar', 'haar spiegelbeeld'], lang: 'nl' },
	{ lines: ['Bladeren vallen', 'de aarde ademt diep in', 'winter slaapt al bij'], lang: 'nl' },
	{ lines: ['Door zomerregens', 'zijn de kraanvogelpoten', 'korter geworden'], lang: 'nl', author: 'Matsuo Bashō' },
	{
		lines: ['Een slak kruipt langzaam', 'over de rand van de maan', 'stille lentenacht'],
		lang: 'nl',
		author: 'Kobayashi Issa',
	},
	{ lines: ['Het druppelen van', 'een waterkraan beklemtoont', 'de stilte in huis'], lang: 'nl' },
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
	{ lines: ['Ochtenddauw glanst op', 'spinnenwebben in het gras', 'de zon komt kijken'], lang: 'nl' },
	{ lines: ['Na de plechtigheid', 'tientallen handen schudden', 'geen naam onthouden'], lang: 'nl' },
	{ lines: ['Boven het graf van', 'haar grootmoeder buiten bidt', 'een leeuwerik zacht'], lang: 'nl' },

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
