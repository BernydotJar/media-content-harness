# Audio Input Compatibility V16

## QA finding

Real-asset Playwright QA used an MP3 extracted from the user-provided FIRMES video. Studio said “Cargar canción” but accepted only MP4/MOV/WebM containers. The browser attempted the MP3 upload and the backend rejected `audio/mpeg`, so the UI never reached “Música lista”.

## V16 decision

Soundtrack upload accepts common audio files as well as the existing video containers:

- MP3 (`audio/mpeg`, `audio/mp3`)
- WAV (`audio/wav`, `audio/x-wav`)
- M4A (`audio/mp4`, `audio/x-m4a`)
- MP4 (`video/mp4`)
- MOV (`video/quicktime`)
- WebM (`video/webm`)

The browser `accept` list and user-facing helper copy match the backend contract.

## Security / integrity

MIME is not trusted by itself. Uploads must also match binary signatures:

- MP3: ID3 header or MPEG audio frame sync
- WAV: RIFF/WAVE
- M4A/MP4/MOV: ISO BMFF `ftyp`
- WebM: EBML magic

All formats remain capped at 40 MB, are inspected by FFprobe for an actual audio stream, stored by SHA-256, and retain the existing owner/admin/editor authorization boundary. Audio finishing, picture-lock verification, mastering QA, and release behavior are unchanged.
