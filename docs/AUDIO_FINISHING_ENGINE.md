# Audio Finishing Engine V12

## Purpose

Media Factory V12 converts reviewed creative intent about music, voice balance, an approved outro fragment, mastering, and exact A/V synchronization into a deterministic audio-finishing recipe. It does not replace the picture renderer and it does not let a model invent an edit directly.

The core invariant is **picture lock**: audio finishing may create a new MP4 container and audio stream, but the compressed video stream must remain byte-identical. The engine calculates a SHA-256 over the copied video stream before and after finishing and fails closed if the values differ.

## Product flow

```text
Reviewed video
   |
   +--> upload authorized soundtrack
   |
   +--> AudioFinishingContract
           |
           +--> voice/source audio preservation
           +--> soundtrack start + level
           +--> sidechain ducking
           +--> explicit approved outro IN/OUT
           +--> echo / short reverb tail
           +--> gentle compression / limiting
           +--> EBU R128 loudness target
           +--> exact duration lock
   |
   v
FFmpeg deterministic execution
   |
   v
TechnicalAudioQA
   +--> full decode
   +--> 48 kHz stereo
   +--> integrated LUFS
   +--> loudness range
   +--> true peak
   +--> audio/video duration delta
   +--> picture-stream SHA-256 equality
   |
   v
fresh artifact SHA -> CRITIC -> INDEPENDENT_VERIFIER -> RELEASE
```

Only `TECHNICAL_QA` and downstream work are invalidated. The already reviewed `PROVIDER_PRODUCTION` picture lock stays intact.

## Contract

Schema: `audio-finishing.v1`

```yaml
audio_finishing:
  preserve_original_intro:
    enabled: true
    from_seconds: 0

  soundtrack:
    asset_id: audio_<sha256>
    start_seconds: 0
    gain_db: -8

  voice:
    preserve: true
    delay_ms: 0

  mix:
    voice_priority: true
    duck_under_voice: true
    duck_threshold: 0.05
    duck_ratio: 8

  outro:
    enabled: true
    source_in_seconds: 18.42
    source_out_seconds: 19.31
    approved_phrase: "Firmes Firmes"
    tail_ms: 900
    echo: true
    reverb: true
    gain_db: 0

  master:
    integrated_lufs: -14
    true_peak_max_dbtp: -1.5
    compressor: gentle
    limiter: true

  sync:
    lock_to_video_duration: true
```

### Explicit outro authority

The engine deliberately does **not** accept a semantic marker such as `marker: "firmes_firmes"` and does not search a song for a lyric on its own. A human or an upstream analysis tool may propose candidate timecodes, but production requires explicit approved `source_in_seconds` and `source_out_seconds`. The approved phrase is stored as human-readable evidence; the timecodes are the execution authority.

## Asset and authorization model

- The soundtrack is uploaded into the same authenticated job and stored by SHA-256 under private durable media storage.
- Upload is limited to editor/admin/owner roles for the job tenant.
- Reviewers may review the resulting artifact but cannot mutate the audio master.
- Media is bounded to 40 MB and inspected before it can be referenced by a contract.
- The contract binds the soundtrack asset id, soundtrack SHA, picture-lock SHA, and output SHA.
- Re-running finishing against an existing audio-finished job starts again from the original picture lock rather than transcoding the prior master repeatedly.

## Deterministic DSP implementation

The current V12 engine uses FFmpeg filters and stream-copy video:

- picture/source audio -> 48 kHz, pad/trim to exact picture duration;
- soundtrack -> explicit start, gain, 48 kHz, pad/trim;
- optional `sidechaincompress` to duck music beneath original voice/source audio;
- optional approved outro fragment -> trim by exact IN/OUT -> echo + short reflection tail -> place at the end of the master;
- gentle compressor and limiter when enabled;
- EBU R128 `loudnorm` target;
- final stereo AAC 256 kbps, 48 kHz;
- `-c:v copy` for the picture stream;
- exact `-t` and final audio trim to the picture duration.

## Technical QA

A finished master must satisfy all of the following before it can return to Critic:

| Check | V12 rule |
|---|---|
| Decode | entire output decodes successfully |
| Picture lock | input and output video-stream SHA-256 must match exactly |
| Audio sample rate | 48,000 Hz |
| Channels | stereo |
| Integrated loudness | within ±1 LU of contract target |
| True peak | no more than 0.25 dB above contract ceiling after encode |
| A/V duration | maximum audio/video delta <= 40 ms when duration lock is enabled |
| Artifact integrity | finished file SHA-256 is bound to the job and review candidate |

## Golden reference: FIRMES Hero V1

The manual studio workflow that motivated V12 is retained outside source control as a reference artifact:

`/shared-auth/development/firmes_hero_song_only_intro00_polished_final_exact.mp4`

Verified reference measurements:

```text
duration:              19.750 s
video duration:        19.750 s
audio duration:        19.750 s
audio:                 AAC stereo / 48 kHz
integrated loudness:   -13.5 LUFS
loudness range:         1.7 LU
true peak:             -1.9 dBFS
full decode:           PASS
video-stream SHA-256:  adfd2ccbeb01b2f059a0871b7830d9f88af053b3e548f403618cc327f24e3bac
```

This artifact is **evidence, not a template binary committed to the repository**. V12 uses its measurable characteristics to define a useful social-master quality envelope without copying its exact waveform.

## Intent-to-recipe evidence

The product may record transformations such as:

```text
Human intent
  "mantén intro 00:00"
  "prioriza la voz"
  "termina con Firmes Firmes con eco"
      |
      v
Structured decision
  soundtrack.start_seconds = 0
  mix.duck_under_voice = true
  outro.source_in_seconds = approved IN
  outro.source_out_seconds = approved OUT
  outro.echo = true
  outro.reverb = true
      |
      v
Deterministic FFmpeg execution + measurable QA
```

The AI/Director may help translate language into a proposed contract. The deterministic engine owns media execution; Technical QA owns measurable correctness; humans retain authority over the selected source fragment and creative approval.
