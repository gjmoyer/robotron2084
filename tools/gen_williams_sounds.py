#!/usr/bin/env python3
"""Generate Robotron 2084 arcade sounds from documented Williams algorithms.

VARI / Sound1 is the cycle-accurate reconstruction published by Chris Lomont:
https://www.lomont.org/software/misc/robotron/

GWAVE, FNOISE, LFSR, and SCREAM follow the public engine descriptions
(parameter tables + loop structure), not a dump of the sound ROM.
Game-side command numbers come from the released Williams assembly
(LASSND, RBSND, SAVSND, PDSND, …).
"""
from __future__ import annotations

import math
import struct
import wave
from pathlib import Path

CPU = 894750
OUT_RATE = 22050
OUT_DIR = Path("/Users/greg/robotron/assets/sounds")


def u8(n: int) -> int:
    return n & 0xFF


def i8(n: int) -> int:
    n &= 0xFF
    return n - 256 if n >= 128 else n


def downsample(samples: list[int], src_rate: int = CPU, dst_rate: int = OUT_RATE) -> list[int]:
    if not samples:
        return []
    n = max(1, int(round(len(samples) * dst_rate / src_rate)))
    out = [0] * n
    scale = len(samples) / n
    for i in range(n):
        out[i] = samples[min(len(samples) - 1, int(i * scale))]
    return out


def to_s16(samples_u8: list[int]) -> list[int]:
    return [(s - 128) * 256 for s in samples_u8]


def write_wav(name: str, samples_u8: list[int], src_rate: int = CPU) -> None:
    pcm = to_s16(downsample(samples_u8, src_rate))
    # fade last 8ms to avoid click
    fade = int(OUT_RATE * 0.008)
    for i in range(1, min(fade, len(pcm)) + 1):
        pcm[-i] = int(pcm[-i] * (i - 1) / fade)
    path = OUT_DIR / name
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(OUT_RATE)
        w.writeframes(struct.pack("<" + "h" * len(pcm), *[max(-32767, min(32767, s)) for s in pcm]))
    print(f"{name:18} {len(pcm)/OUT_RATE:6.3f}s  {path.stat().st_size:7d}b")


# ---------------------------------------------------------------------------
# VARI / Sound1 — Lomont, ROM 0xF503–0xF54F
# ---------------------------------------------------------------------------
def sound1(b1, b2, b3, b4, b5, b6, b7, u1, max_samples=5_000_000) -> list[int]:
    b1, b2, b3, b4, b5, b6, b7 = (x & 0xFF for x in (b1, b2, b3, b4, b5, b6, b7))
    u1 &= 0xFFFF
    wave: list[int] = []
    sound = 0

    def dup(d: int) -> None:
        if d <= 0:
            return
        wave.extend([sound] * d)

    dup(8)
    sound = b7
    while len(wave) < max_samples:
        dup(14)
        c1 = b1
        c2 = b2
        while len(wave) < max_samples:
            dup(4)
            count = u1
            while True:
                dup(9)
                sound = u8(~sound)
                t1 = c1 if c1 != 0 else 256
                dup(min(count, t1) * 14 - 6)
                if count <= t1:
                    break
                dup(12)
                count -= t1
                sound = u8(~sound)
                t2 = c2 if c2 != 0 else 256
                dup(min(count, t2) * 14 - 3)
                if count <= t2:
                    break
                dup(10)
                count -= t2
            dup(15)
            if sound < 128:
                dup(2)
                sound = u8(~sound)
            dup(27)
            c1 = u8(c1 + b3)
            c2 = u8(c2 + b4)
            if c2 == b5:
                break
        dup(7)
        if b6 == 0:
            break
        dup(11)
        b1 = u8(b1 + b6)
        if b1 == 0:
            break
    return wave[:max_samples]


# Lomont's five in-game VARI parameter sets (= SAW, FOSHIT, QUASAR, CABSHK, CSCALE)
VARI = {
    "saw": (0x40, 0x01, 0x00, 0x10, 0xE1, 0xFF, 0xFF, 0x0080),
    "foshit": (0x28, 0x01, 0x00, 0x08, 0x81, 0xFF, 0xFF, 0x0200),
    "quasar": (0x28, 0x81, 0x00, 0xFC, 0x01, 0xFC, 0xFF, 0x0200),
    "cabshk": (0xFF, 0x01, 0x00, 0x18, 0x41, 0x00, 0xFF, 0x0480),
    "cscale": (0x00, 0xFF, 0x08, 0xFF, 0x68, 0x00, 0xFF, 0x0480),
}


def vari_sp1_sequence() -> list[int]:
    """WVSND: command $0E (SP1 / CABSHK) fired 29 times. Pitch walks via LOPER."""
    out: list[int] = []
    loper = 0xFF
    for _ in range(29):
        chunk = sound1(loper, 0x01, 0x00, 0x18, 0x41, 0x00, 0xFF, 0x0480, max_samples=CPU // 12)
        out.extend(chunk)
        loper = u8(loper - 8)
        if loper < 0x18:
            loper = 0x18
    return out


# ---------------------------------------------------------------------------
# GWAVE
# ---------------------------------------------------------------------------
def lut_square(n: int, lo=0x18, hi=0xE8) -> list[int]:
    return [hi] * (n // 2) + [lo] * (n - n // 2)


def lut_sine(n: int, amp=0x70) -> list[int]:
    return [u8(128 + int(amp * math.sin(2 * math.pi * i / n))) for i in range(n)]


def lut_harm(n: int) -> list[int]:
    return [
        u8(128 + int(0x50 * math.sin(2 * math.pi * i / n) + 0x28 * math.sin(4 * math.pi * i / n)))
        for i in range(n)
    ]


GSQ22 = lut_square(16)
GSSQ2 = lut_square(8)
GS2 = lut_sine(8)
GS1 = lut_sine(16)
GS72 = lut_sine(72)
GS12 = lut_harm(16)

HBDSND = [1, 1, 2, 2, 4, 4, 8, 8, 0x10, 0x10, 0x18, 0x20, 0x28, 0x30, 0x38, 0x40, 0x50, 0x60, 0x70, 0x80, 0x90, 0xA0]
SPNSND = [0x01, 0x01, 0x02, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0C]
BONSND = [0xA0, 0x98, 0x90, 0x88, 0x80, 0x78, 0x70, 0x68, 0x60, 0x58, 0x50, 0x44, 0x40]
YUKSND = [0x20, 0x18, 0x10, 0x0C, 0x08, 0x06, 0x08, 0x0C, 0x10, 0x0C, 0x08, 0x05, 0x04, 0x05, 0x08, 0x10, 0x18, 0x28]
ED13FP = [0x08, 0x08, 0x10, 0x10, 0x18, 0x20, 0x30, 0x40, 0x28, 0x14, 0x0A, 0x06]


def gwave(wave: list[int], pattern: list[int], echoes=1, gccnt=1, gecdec=2, gdfinc=0, fofset=0) -> list[int]:
    orig = wave[:]
    tab = wave[:]
    out: list[int] = []
    offset = fofset
    for echo in range(max(1, echoes)):
        for p in pattern:
            gper = max(1, u8(p + offset))
            dwell = 36 + 4 * gper
            for _ in range(max(1, gccnt)):
                for s in tab:
                    out.extend([s] * dwell)
        if echo + 1 < echoes:
            dec = max(1, gecdec)
            for i in range(len(tab)):
                tab[i] = u8(tab[i] - ((orig[i] >> 4) * dec))
            offset = u8(offset + i8(gdfinc))
    return out


# ---------------------------------------------------------------------------
# LFSR + FNOISE + SCREAM
# ---------------------------------------------------------------------------
class Lfsr:
    def __init__(self, seed=0x3C3C):
        self.hi = (seed >> 8) & 0xFF
        self.lo = seed & 0xFF

    def clock(self) -> int:
        a = self.lo
        a = a >> 1
        a = a >> 1
        a = a >> 1
        a = u8(a ^ self.lo)
        carry = a & 1
        self.hi = ((carry << 7) | (self.hi >> 1)) & 0xFF
        lo_in = self.hi & 1
        self.lo = ((lo_in << 7) | (self.lo >> 1)) & 0xFF
        return carry

    def word(self) -> int:
        return ((self.hi << 8) | self.lo) & 0xFFFF


def lfsr_noise(start_period: int, dfreq: int, steps: int, cycnt: int, mode="amp") -> list[int]:
    rng = Lfsr()
    out: list[int] = []
    period = start_period
    namp = 0xC0
    for _ in range(steps):
        dwell = max(8, period) * 12
        for _c in range(max(1, cycnt)):
            bit = rng.clock()
            if mode == "toggle":
                dac = 0xFF if bit else 0x00
            else:
                dac = namp if bit else 0x00
            out.extend([dac] * dwell)
        period = max(4, period + dfreq)
        namp = max(0, namp - 3)
    return out


def fnoise_cannon(duration_s=0.45) -> list[int]:
    rng = Lfsr(0xA55A)
    out: list[int] = []
    dac = 0x80
    fmax = 0xFF
    slope = 0x40
    target = rng.word() & 0xFF
    sampc = 40
    ticks = int(CPU * duration_s / 80)
    for t in range(ticks):
        if dac < target:
            dac = min(target, dac + max(1, slope))
        elif dac > target:
            dac = max(target, dac - max(1, slope))
        if t % sampc == 0:
            rng.clock()
            target = rng.word() & 0xFF
        if t % 30 == 0:
            fmax = max(8, fmax - (fmax >> 3))
            slope = max(1, (slope & (rng.hi or 1)) % max(2, fmax))
        out.extend([dac] * 80)
    return out


def scream() -> list[int]:
    freq = [0x80, 0x00, 0x00, 0x00]
    timer = [0, 0, 0, 0]
    out: list[int] = []
    dwell = 48
    alive = True
    guard = 0
    while alive and guard < 200000:
        guard += 1
        for _ in range(256):
            val = 0
            amp = 0x80
            for i in range(4):
                if freq[i] == 0:
                    amp >>= 1
                    continue
                prev = timer[i]
                timer[i] = u8(timer[i] + freq[i])
                if (prev ^ timer[i]) & 0x80:
                    val += amp
                amp >>= 1
            out.extend([min(255, val)] * dwell)
        alive = False
        for i in range(4):
            if freq[i]:
                freq[i] -= 1
                alive = True
                if freq[i] == 0x37 and i + 1 < 4 and freq[i + 1] == 0:
                    freq[i + 1] = 0x41
    return out


def organ_ninth() -> list[int]:
    """Popcount organ, Beethoven 9th motif (wave-start signature)."""
    # (mask, delay_nops, duration_ticks) — delay smaller = higher pitch.
    # All pitched notes share mask 0x22 (bits 1+5): bit0 in the old 0x11
    # notes toggled every count and aliased to a ~2.1kHz beep a full octave
    # above the ~0.9kHz body. Pitch contour now comes from delay alone.
    # DAC is centered on 128 (was pop<<5 = 0/32/64, i.e. full-scale DC);
    # the rest note is digital silence.
    notes = [
        (0x22, 18, 18),
        (0x22, 18, 18),
        (0x22, 18, 18),
        (0x22, 28, 48),
        (0x00, 20, 8),
        (0x22, 26, 18),
        (0x22, 26, 18),
        (0x22, 26, 18),
        (0x22, 20, 48),
    ]
    out: list[int] = []
    counter = 0
    for mask, delay, dur in notes:
        sample_cy = 70 + delay * 2
        for _ in range(dur * 40):
            if mask == 0:
                dac = 128
            else:
                pop = bin(counter & mask).count("1")
                dac = u8(128 + (pop - 1) * 32)
            out.extend([dac] * sample_cy)
            counter = u8(counter + 1)
    return out


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # VARI (Lomont) — keep the five canonical renders plus game-used cuts
    for name, params in VARI.items():
        write_wav(f"vari_{name}.wav", sound1(*params))

    # cmd $01 LASSND — full HBDV; rapid fire restarts it so you hear the zip
    write_wav("laser.wav", gwave(GSQ22, HBDSND, echoes=8, gccnt=1, gecdec=2))

    # cmd $14 TURBO then $17 CANNON — RBSND robot hit
    write_wav("turbo.wav", lfsr_noise(0x10, 1, 90, 2, mode="amp"))
    write_wav("cannon.wav", fnoise_cannon(0.42))

    # cmd $0D SAVSND — ED17 rising spinner
    write_wav("rescue.wav", gwave(GS1, SPNSND * 4, echoes=3, gccnt=2, gecdec=3, gdfinc=0xFF))

    # cmd $11 LITE — PDSND first phrase
    write_wav("lite.wav", lfsr_noise(0xC0, -3, 140, 3, mode="toggle"))

    # cmd $28 ST1SND — GDYUKV / YUKSND family-start jingle
    write_wav("start.wav", gwave(GS72, YUKSND, echoes=3, gccnt=2, gecdec=2, gdfinc=0xFF))

    # cmd $0E WVSND ×29 — SP1 / CABSHK walk
    write_wav("waveend.wav", vari_sp1_sequence())

    # cmd $1E extra man — FOSHIT (VARI)
    write_wav("extralife.wav", sound1(*VARI["foshit"]))

    # cmd $0C coin / UI — short ED12-ish
    write_wav("ui.wav", gwave(GS2, ED13FP, echoes=3, gccnt=2, gecdec=2))

    # cmd $1A human death — SCREAM
    write_wav("scream.wav", scream())

    # cmd $15 appear / respawn
    write_wav("appear.wav", lfsr_noise(0x18, 4, 80, 2, mode="amp"))

    # cmd $1B organ 9th (documented wave-start signature)
    write_wav("ninth.wav", organ_ninth())

    # --- gap fills: distinct voices for previously-shared slots ---
    # cmd $06 HKHSND — GWAVE HBEV hulk thud (was ui.wav placeholder)
    write_wav("hulk.wav", gwave(GS2, BONSND, echoes=2, gccnt=2, gecdec=3))
    # GRUNT footstep tick — short low LFSR tap, throttled game-side
    write_wav("gruntstep.wav", lfsr_noise(0x50, 0, 12, 1, mode="amp"))
    # SPHEROID materialize shimmer (wave-start spawn, was silent/appear)
    write_wav("spheroidspawn.wav", gwave(GS1, SPNSND * 2, echoes=2, gccnt=1, gecdec=2))
    # QUARK materialize — lower twin of spheroid shimmer
    write_wav("quarkspawn.wav", gwave(GS2, SPNSND * 2, echoes=2, gccnt=1, gecdec=2, gdfinc=0x08))
    # TANK fire — deeper toggle-noise than LITE brain shot
    write_wav("tankfire.wav", lfsr_noise(0x80, -2, 60, 2, mode="toggle"))
    # TANK shell bounce — short square blip
    write_wav("bounce.wav", gwave(GSQ22, [0x08, 0x10], echoes=1, gccnt=2, gecdec=2))
    # TANK explode — longer cannon than grunt cannon
    write_wav("tankboom.wav", fnoise_cannon(0.6))
    # BRAIN cruise-missile launch — rising LFSR whistle
    write_wav("brainstart.wav", lfsr_noise(0x30, 3, 70, 2, mode="amp"))
    # HUMAN-to-PROG start warble
    write_wav("progstart.wav", gwave(GS12, ED13FP, echoes=2, gccnt=2, gecdec=2))
    # PROG transformation complete — rising twin
    write_wav("progdone.wav", gwave(GS12, BONSND[::-1], echoes=2, gccnt=2, gecdec=2))
    # power-on self-test sweep
    write_wav("startup.wav", gwave(GS72, YUKSND[:9], echoes=2, gccnt=2, gecdec=2))
    # high-score table topper jingle
    write_wav("hiscore.wav", gwave(GS1, SPNSND * 6, echoes=4, gccnt=1, gecdec=2, gdfinc=0xFE))

    # background tension drone (BG1-style filtered noise), several brightnesses
    for i, start in enumerate((0xA0, 0x70, 0x48, 0x28)):
        write_wav(f"bg{i}.wav", lfsr_noise(start, 0, 200, 4, mode="amp"))

    print("done")


if __name__ == "__main__":
    main()
