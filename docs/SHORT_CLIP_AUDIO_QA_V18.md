# Short-Clip Audio QA V18

## Why this increment exists

A real production acceptance test on 2026-09-23 exposed two related issues on a 4.8-second authorized FIRMES clip:

1. the first audio master measured **-15.2 LUFS** against a **-14 LUFS** target, exceeding the existing ±1 LU gate by 0.2 LU even though true peak and picture lock were correct;
2. after the technical QA failure, the Review UI displayed an older source-duration repair instruction instead of the active `LOUDNESS_QA_FAILED` blocker.

The same acceptance pass also showed that a user could select a non-Monday date in Free Mode and learn the Monday-only rule only after a server-side 400 response.

## V18 behavior

### Bounded loudness correction

Audio Finishing keeps the existing first-pass mastering chain. If the measured master misses the integrated-loudness target by more than 1 LU, but the required correction is bounded to at most ±3 dB, Media Factory performs exactly one corrective audio pass:

- measured gain delta only;
- `alimiter` with `level=false` when the contract enables limiting;
- 48 kHz stereo AAC output;
- copied video stream;
- fresh picture-stream SHA verification;
- fresh loudness, true-peak and A/V duration QA.

The QA thresholds are **not relaxed**. The corrected master must still pass the original gates.

The real 4.8-second acceptance artifact produced:

```text
Integrated loudness  -14.0 LUFS
True peak            -1.4 dBTP
Sample rate          48000 Hz
Channels             2
Duration             4.8 s
Picture stream       unchanged
Correction applied   +1.2 dB
```

A portable synthetic 4.8-second regression fixture also requires the bounded correction path and verifies picture-lock equality.

### Retry the same technical master

When a production is blocked in `TECHNICAL_QA` by one of:

- `LOUDNESS_QA_FAILED`
- `TRUE_PEAK_QA_FAILED`
- `AV_SYNC_QA_FAILED`
- `AUDIO_QA_UNAVAILABLE`

an authenticated editor can choose **Reintentar master de audio**.

This retry:

- preserves the exact picture lock;
- preserves the exact `AudioFinishingContract` and soundtrack asset;
- does not increment creative repair revision;
- does not consume paid-generation budget;
- does not restart provider production;
- requeues only `TECHNICAL_QA` on the same job.

### Blocker UX

The primary blocker card now derives its message from the active blocker. Stale `repair_instructions` are not shown for audio-QA failures.

For an audio-QA blocker the user sees:

```text
El audio necesita un último ajuste

El master no alcanzó el nivel técnico esperado.
Podemos volver a procesar el mismo audio sin cambiar el video.

[ Reintentar master de audio ]
```

### Week-date UX

Free Mode and guided planning still store a Monday `week_of`, but the date picker now normalizes any chosen date to the Monday of that week immediately. The UI also explains this behavior, preventing a server-side validation error from becoming a normal user interaction.

## Acceptance findings that were not defects

The Q200 weekly usage card was initially not observed on `/dashboard` during a fast post-navigation check. A five-second hydrated check confirmed the card is present on Dashboard and Create. No dashboard code change was required.
