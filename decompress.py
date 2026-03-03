#!/usr/bin/env python3
"""
Decode Mewgenics cats from an SQLite .sav file (SQLite DB).

Core behavior:
- Reads cats.data blobs
- Decompresses each blob: [LE32 uncompressed_size] + [raw LZ4 block bytes]
- Extracts:
  - name (UTF-16LE, LE64 length prefix) at offset 12 in decompressed cat payload (typical)
  - a token near the stat block (e.g., male288, female57, robotom, spidercat5)
  - base stats (STR,DEX,CON,INT,SPD,CHA,LCK) as 7x 32-bit ints after a double
    - tries both little-endian and big-endian and chooses the plausible one

Added: --inspect <key>
- Writes cat_<key>_decompressed.bin
- Writes cat_<key>_inspect.json with token candidates, string lists, etc.
"""

import argparse
import csv
import json
import os
import re
import sqlite3
import struct
from dataclasses import dataclass
from typing import List, Optional, Dict, Any, Tuple


# -------------------------
# LZ4 raw block decompressor
# -------------------------
def lz4_block_decompress(src: bytes, uncompressed_size: int) -> bytes:
    """
    Decompress a raw LZ4 block (no frame header).
    Save blobs store: [LE32 uncompressed_size] + [raw lz4 block bytes]
    """
    i = 0
    out = bytearray()
    src_len = len(src)

    while i < src_len:
        token = src[i]
        i += 1

        # literal length
        lit_len = token >> 4
        if lit_len == 15:
            while i < src_len:
                b = src[i]
                i += 1
                lit_len += b
                if b != 255:
                    break

        # literals
        if i + lit_len > src_len:
            raise ValueError("Truncated LZ4 literals")
        out += src[i : i + lit_len]
        i += lit_len

        if len(out) == uncompressed_size:
            break

        # offset
        if i + 2 > src_len:
            raise ValueError("Truncated LZ4 offset")
        offset = src[i] | (src[i + 1] << 8)
        i += 2
        if offset == 0 or offset > len(out):
            raise ValueError(f"Invalid LZ4 offset {offset} at outlen {len(out)}")

        # match length
        match_len = token & 0x0F
        if match_len == 15:
            while i < src_len:
                b = src[i]
                i += 1
                match_len += b
                if b != 255:
                    break
        match_len += 4

        # copy match (may overlap)
        start = len(out) - offset
        for _ in range(match_len):
            out.append(out[start])
            start += 1
            if len(out) == uncompressed_size:
                break

        if len(out) == uncompressed_size:
            break

        if len(out) > uncompressed_size:
            out = out[:uncompressed_size]
            break

    if len(out) != uncompressed_size:
        raise ValueError(f"Decompressed size mismatch: got {len(out)} expected {uncompressed_size}")
    return bytes(out)


def decompress_cat_blob(blob: bytes) -> bytes:
    if len(blob) < 8:
        raise ValueError("Blob too small")
    usize = struct.unpack_from("<I", blob, 0)[0]
    return lz4_block_decompress(blob[4:], usize)


# -------------------------
# Helpers to read strings
# -------------------------
def read_u64_le(buf: bytes, off: int) -> int:
    return struct.unpack_from("<Q", buf, off)[0]


def try_read_utf16le_lenpref(buf: bytes, off: int) -> Optional[Tuple[str, int]]:
    """
    Try: [LE64 char_len] [UTF-16LE chars (char_len*2 bytes)]
    Returns (string, new_offset) or None if not plausible.
    """
    if off + 8 > len(buf):
        return None
    n = read_u64_le(buf, off)
    if n > 10_000:
        return None
    start = off + 8
    end = start + n * 2
    if end > len(buf):
        return None
    try:
        s = buf[start:end].decode("utf-16le", errors="strict")
    except UnicodeDecodeError:
        return None
    return s, end


def iter_lenpref_ascii(buf: bytes, min_len=3, max_len=128):
    """
    Iterate occurrences of [LE64 len][ASCII bytes].
    """
    for off in range(0, len(buf) - 8):
        n = read_u64_le(buf, off)
        if n < min_len or n > max_len:
            continue
        start = off + 8
        end = start + n
        if end > len(buf):
            continue
        raw = buf[start:end]
        if all(32 <= b < 127 for b in raw):
            yield off, raw.decode("ascii")


def extract_all_utf16_lenpref(buf: bytes, max_len_chars: int = 120) -> List[Dict[str, Any]]:
    """
    Scan for UTF-16LE len-pref strings [LE64 chars][UTF-16LE data].
    Returns list of {offset, length_chars, value}.
    """
    out: List[Dict[str, Any]] = []
    for off in range(0, len(buf) - 8):
        t = try_read_utf16le_lenpref(buf, off)
        if not t:
            continue
        s, end = t
        if 0 < len(s) <= max_len_chars:
            out.append({"offset": off, "length_chars": len(s), "value": s})
    # de-dupe by (offset, value)
    seen = set()
    uniq = []
    for item in out:
        k = (item["offset"], item["value"])
        if k in seen:
            continue
        seen.add(k)
        uniq.append(item)
    return uniq


def extract_all_ascii_lenpref(buf: bytes, min_len=3, max_len=128) -> List[Dict[str, Any]]:
    """
    Returns list of {offset, length, value} for [LE64 len][ASCII bytes].
    """
    out = []
    for off, s in iter_lenpref_ascii(buf, min_len=min_len, max_len=max_len):
        out.append({"offset": off, "length": len(s), "value": s})
    return out


# -------------------------
# Token + stats heuristics
# -------------------------
STAT_NAMES = ["STR", "DEX", "CON", "INT", "SPD", "CHA", "LCK"]

_letters = set(b"abcdefghijklmnopqrstuvwxyz")
_digits = set(b"0123456789")


def scan_tokens_alpha_optional_digits(
    buf: bytes, min_letters: int = 3, max_letters: int = 14, max_digits: int = 3
) -> List[Tuple[int, int, str]]:
    """
    Scan the entire decompressed blob for runs of:
      letters{min..max} then optional digits{0..max_digits}
    and return (start, end, token_str).

    This intentionally does NOT require word boundaries, because many tokens
    are followed by binary bytes that break \\b regexes.
    """
    out: List[Tuple[int, int, str]] = []
    n = len(buf)
    i = 0
    while i < n:
        if buf[i] in _letters:
            j = i
            while j < n and buf[j] in _letters and (j - i) < max_letters:
                j += 1
            if (j - i) < min_letters:
                i += 1
                continue

            k = j
            dcount = 0
            while k < n and buf[k] in _digits and dcount < max_digits:
                k += 1
                dcount += 1

            token = buf[i:k].decode("ascii", errors="ignore")
            out.append((i, k, token))
            i = k
        else:
            i += 1
    return out


def score_stats(vals: List[int]) -> int:
    """
    Score candidate stat arrays. You observed base stats cap at 7.
    """
    if all(0 <= v <= 7 for v in vals):
        return 100
    if all(0 <= v <= 20 for v in vals):
        return 50
    if any(v >= 1_000_000 for v in vals):
        return -100
    return 0


def extract_stats_after_token(dec: bytes, token_end: int, endian: str) -> Optional[List[int]]:
    """
    token_end points right after token bytes.
    We expect: <double> then 7 x <u32>
    """
    if token_end + 8 + 7 * 4 > len(dec):
        return None
    fmt = "<I" if endian == "le" else ">I"
    base = token_end + 8
    return [struct.unpack_from(fmt, dec, base + 4 * i)[0] for i in range(7)]


def find_best_token_and_stats(dec: bytes) -> Tuple[str, Dict[str, int], str, int]:
    """
    Find best token candidate that is followed by <double> + 7 ints.
    Try both endian modes and choose the plausible one.
    Returns: (token, stats_dict, endian_used, token_offset)
    """
    best = None  # (score, token, vals, endian, token_offset)

    for start, end, token in scan_tokens_alpha_optional_digits(dec):
        if end + 8 + 7 * 4 > len(dec):
            continue

        for endian in ("le", "be"):
            vals = extract_stats_after_token(dec, end, endian)
            if vals is None:
                continue
            sc = score_stats(vals)
            if best is None or sc > best[0]:
                best = (sc, token, vals, endian, start)
                if sc >= 100:
                    break

        if best and best[0] >= 100:
            break

    if best is None or best[0] < 0:
        raise ValueError("No plausible token+stats found")

    sc, token, vals, endian, token_off = best
    stats = {STAT_NAMES[i]: vals[i] for i in range(7)}
    return token, stats, endian, token_off


def split_token(token: str) -> Tuple[str, str]:
    """
    Split e.g. 'male288' -> ('male','288'), 'robotom' -> ('robotom','')
    """
    m = re.match(r"^([a-z]+)(\d{1,3})?$", token)
    if not m:
        return token, ""
    return m.group(1) or token, m.group(2) or ""


# -------------------------
# Cat parsing
# -------------------------
@dataclass
class CatDecoded:
    key: int
    name: str
    token: str
    token_kind: str
    token_id: str
    stats_endian: str
    stats: Dict[str, int]
    abilities: List[str]


def parse_cat(dec: bytes, key: int, include_abilities: bool) -> CatDecoded:
    # Name is typically at offset 12 in decompressed cat payloads
    name_tup = try_read_utf16le_lenpref(dec, 12)
    if not name_tup:
        raise ValueError("Could not parse name at expected offset 12")
    name, _ = name_tup

    token, stats, endian, _tok_off = find_best_token_and_stats(dec)
    token_kind, token_id = split_token(token)

    abilities: List[str] = []
    if include_abilities:
        # Find "DefaultMove" as an anchor and grab a chunk following it
        for off, s in iter_lenpref_ascii(dec, min_len=4, max_len=40):
            if s == "DefaultMove":
                cursor = off
                grabbed = 0
                while grabbed < 30 and cursor + 8 <= len(dec):
                    n = read_u64_le(dec, cursor)
                    cursor += 8
                    if n > 200 or cursor + n > len(dec):
                        break
                    raw = dec[cursor : cursor + n]
                    cursor += n
                    if not all(32 <= b < 127 for b in raw):
                        break
                    abilities.append(raw.decode("ascii"))
                    grabbed += 1
                break

    return CatDecoded(
        key=key,
        name=name,
        token=token,
        token_kind=token_kind,
        token_id=token_id,
        stats_endian=endian,
        stats=stats,
        abilities=abilities,
    )


# -------------------------
# Inspect mode
# -------------------------
def build_inspect_report(dec: bytes, key: int) -> Dict[str, Any]:
    report: Dict[str, Any] = {
        "cat_key": key,
        "decompressed_length": len(dec),
        "name_guess": None,
        "best_choice": None,
        "token_candidates": [],
        "utf16_lenpref_strings": [],
        "ascii_lenpref_strings": [],
    }

    # name guess at offset 12 (typical)
    t = try_read_utf16le_lenpref(dec, 12)
    if t:
        report["name_guess"] = t[0]

    # best choice
    try:
        token, stats, endian, token_off = find_best_token_and_stats(dec)
        report["best_choice"] = {
            "token": token,
            "token_offset": token_off,
            "stats_endian": endian,
            "stats": stats,
        }
    except Exception as e:
        report["best_choice_error"] = str(e)

    # candidates: every token + candidate stats in both endian modes (if possible)
    for start, end, token in scan_tokens_alpha_optional_digits(dec):
        cand: Dict[str, Any] = {
            "token": token,
            "token_offset": start,
            "token_end": end,
            "candidate": {}
        }

        for endian in ("le", "be"):
            vals = extract_stats_after_token(dec, end, endian)
            if vals is None:
                continue
            cand["candidate"][endian] = {
                "score": score_stats(vals),
                "vals": vals,
                "stats": {STAT_NAMES[i]: vals[i] for i in range(7)},
            }

        # only keep tokens that have at least one parseable candidate stat block
        if cand["candidate"]:
            report["token_candidates"].append(cand)

    # strings
    report["utf16_lenpref_strings"] = extract_all_utf16_lenpref(dec, max_len_chars=120)
    report["ascii_lenpref_strings"] = extract_all_ascii_lenpref(dec, min_len=3, max_len=128)

    return report


def write_inspect_outputs(outdir: str, key: int, dec: bytes, report: Dict[str, Any]) -> None:
    os.makedirs(outdir, exist_ok=True)
    bin_path = os.path.join(outdir, f"cat_{key}_decompressed.bin")
    json_path = os.path.join(outdir, f"cat_{key}_inspect.json")

    with open(bin_path, "wb") as f:
        f.write(dec)

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"Wrote: {bin_path}")
    print(f"Wrote: {json_path}")


# -------------------------
# Output (normal mode)
# -------------------------
def export_csv(path: str, rows: List[Dict[str, Any]], headers: List[str]) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=headers, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow({h: r.get(h, "") for h in headers})


def print_tsv(rows: List[Dict[str, Any]], headers: List[str]) -> None:
    print("\t".join(headers))
    for r in rows:
        print("\t".join(str(r.get(h, "")) for h in headers))


def read_cats_table(db_path: str) -> List[Tuple[int, bytes]]:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    rows = cur.execute("SELECT key, data FROM cats ORDER BY key").fetchall()
    conn.close()
    return rows


def main():
    ap = argparse.ArgumentParser(description="Decode Mewgenics cats from SQLite .sav")
    ap.add_argument("db", help="Path to .sav (SQLite) file")
    ap.add_argument("--csv", dest="csv_path", help="Write output to CSV at this path")
    ap.add_argument("--abilities", action="store_true", help="Include abilities preview column (slower)")
    ap.add_argument("--inspect", type=int, help="Inspect a single cat by key; writes .bin + .json")
    ap.add_argument("--outdir", default=".", help="Output directory for --inspect artifacts (default: .)")
    args = ap.parse_args()

    rows = read_cats_table(args.db)

    # Inspect mode: only one cat, dump artifacts
    if args.inspect is not None:
        target_key = args.inspect
        blob = None
        for k, b in rows:
            if k == target_key:
                blob = b
                break
        if blob is None:
            raise SystemExit(f"Cat key {target_key} not found in cats table.")

        dec = decompress_cat_blob(blob)
        report = build_inspect_report(dec, target_key)
        write_inspect_outputs(args.outdir, target_key, dec, report)
        return

    # Normal mode: decode all cats
    out_rows: List[Dict[str, Any]] = []
    for key, blob in rows:
        try:
            dec = decompress_cat_blob(blob)
            cat = parse_cat(dec, key, include_abilities=args.abilities)

            row: Dict[str, Any] = {
                "key": cat.key,
                "name": cat.name,
                "token": cat.token,               # raw token
                "token_kind": cat.token_kind,     # letters part
                "token_id": cat.token_id,         # digits part
                "stats_endian": cat.stats_endian, # le or be (auto-selected)
                **cat.stats,
                "abilities_preview": ", ".join(cat.abilities) if args.abilities else "",
                "error": "",
            }
            out_rows.append(row)

        except Exception as e:
            out_rows.append(
                {
                    "key": key,
                    "name": "",
                    "token": "",
                    "token_kind": "",
                    "token_id": "",
                    "stats_endian": "",
                    **{k: "" for k in STAT_NAMES},
                    "abilities_preview": "",
                    "error": str(e),
                }
            )

    headers = ["key", "name", "token", "token_kind", "token_id", "stats_endian", *STAT_NAMES]
    if args.abilities:
        headers.append("abilities_preview")
    headers.append("error")

    if args.csv_path:
        export_csv(args.csv_path, out_rows, headers)
        print(f"Wrote CSV: {args.csv_path}")
    else:
        print_tsv(out_rows, headers)


if __name__ == "__main__":
    main()