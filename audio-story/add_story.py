#!/usr/bin/env python3
"""Thêm (hoặc cập nhật) một truyện từ audioaz.com vào danh sách.

    python3 audio-story/add_story.py https://audioaz.com/vi/audiobook/<slug>

Ghi ra:
    audio-story/stories/<slug>.json   danh sách tập của truyện
    audio-story/covers/<slug>.webp    ảnh bìa
    audio-story/stories.json          danh sách truyện (thêm mới hoặc cập nhật)
"""
import html
import json
import os
import re
import sys
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
UA = {"User-Agent": "Mozilla/5.0"}


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def short_name(title, book_title, order):
    """'Phàm Nhân Tu Tiên - Tập 12' -> 'Tập 12'; giữ tên chương nếu có."""
    t = title.strip()
    if " - " in t:
        head, rest = t.split(" - ", 1)
        if book_title.split(" - ")[0].lower() in head.lower():
            t = rest.strip()
    return t or f"Tập {order}"


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    url = sys.argv[1].split("?")[0].rstrip("/")
    slug = url.rsplit("/", 1)[-1]
    page = get(url).decode("utf-8")

    book = None
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', page, re.S):
        try:
            d = json.loads(block)
        except ValueError:
            continue
        if d.get("@type") == "Audiobook":
            book = d
    if not book:
        sys.exit("Không tìm thấy thông tin truyện trên trang.")

    s = page.replace('\\"', '"')
    found = re.findall(r'\{"id":\d+,"title":"([^"]*)","order":(\d+),"audio_url":"([^"]*)"', s)
    tracks = {}
    for title, order, audio in found:
        o = int(order)
        tracks[o] = {"t": short_name(title, book["name"], o), "u": audio}
    if not tracks:
        sys.exit("Không tìm thấy file audio nào trên trang.")
    tracks = [tracks[o] for o in sorted(tracks)]

    cover = None
    if book.get("image"):
        os.makedirs(os.path.join(HERE, "covers"), exist_ok=True)
        cover = f"covers/{slug}.webp"
        with open(os.path.join(HERE, cover), "wb") as f:
            f.write(get(book["image"]))

    author = (book.get("author") or {}).get("name") or ""
    reader = (book.get("readBy") or {}).get("name") or ""
    story = {
        "id": slug,
        "title": book["name"],
        "author": author,
        "reader": reader if reader != author else "",
        "description": html.unescape(book.get("description") or ""),
        "cover": cover,
        "source": url,
        "tracks": tracks,
    }
    os.makedirs(os.path.join(HERE, "stories"), exist_ok=True)
    with open(os.path.join(HERE, "stories", slug + ".json"), "w", encoding="utf-8") as f:
        json.dump(story, f, ensure_ascii=False, separators=(",", ":"))

    idx_path = os.path.join(HERE, "stories.json")
    try:
        with open(idx_path, encoding="utf-8") as f:
            idx = json.load(f)
    except FileNotFoundError:
        idx = []
    entry = {"id": slug, "title": story["title"], "author": author,
             "cover": cover, "count": len(tracks)}
    idx = [e for e in idx if e["id"] != slug] + [entry]
    with open(idx_path, "w", encoding="utf-8") as f:
        json.dump(idx, f, ensure_ascii=False, indent=1)

    print(f"{story['title']} — {len(tracks)} tập → stories/{slug}.json")


if __name__ == "__main__":
    main()
