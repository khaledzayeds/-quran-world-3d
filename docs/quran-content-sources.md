# Quran content and audio integration research

## Text: Tanzil
- Official: https://tanzil.net/download/
- License: https://tanzil.net/docs/Text_License
- Uthmani text version 1.1; copy verbatim, do not modify text; credit Tanzil Project and link to source; retain full copyright notice in substantial copies.
- Before publishing full Mushaf: import authoritative data, verify all 114 surahs / 6236 ayahs, preserve verse boundaries and diacritics, and visually test Arabic Quran fonts.

## Quran Foundation (Quran.com)
- Documentation: https://api-docs.quran.com/docs/sdk/javascript/verses/
- Audio API: https://api-docs.quran.com/docs/sdk/javascript/audio/
- FAQ and streaming terms: https://api-docs.quran.com/docs/tutorials/faq/
- Current Content API requires server-side credentials; use Cloudflare Workers/Pages Functions for proxy; NEVER put secrets in Vite client variables.
- Streaming Quran Foundation-hosted audio is permitted subject to Developer Terms, credit provider and reciter, do not rehost, and downloaded files may be retained no longer than one week per their FAQ.
- QuranicAudio is part of Quran Foundation; EveryAyah and MP3Quran are independent and require separate permissions review.

## Implementation gates
1. Replace manually entered demo verses with immutable verified source data before public launch.
2. Keep text separate from 3D scene; semantic selectable Arabic text in accessible reader.
3. Build backend proxy for licensed audio API, then choose reciter and support play/pause/seek.
4. Check audio recording-specific rights and attribution; do not assume all recitations are public domain.
5. Mobile UI should function without WebGL, and reduced motion should be honored.
