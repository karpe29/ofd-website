"""Download Instagram post images for homepage social section."""
import subprocess
import urllib.request
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parents[1] / "assets" / "images" / "insta"

POSTS = [
    ("insta1.jpg", "DPYyt3fkzf7", "p"),
    ("instagram_02.jpg", "DKmxcM1z0An", "p"),
    ("instagram_03.jpg", "DXEqcuVE1Z8", "p"),
    ("instagram_04.jpg", "DXcDZvVE8Mi", "p"),
    ("instagram_05.jpg", "DRCrMwBE8hd", "reel"),
    ("instagram_06.jpg", "DXUOxw5jLIO", "p"),
]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
}


def media_url(shortcode: str, kind: str) -> str:
    path = "reel" if kind == "reel" else "p"
    return f"https://www.instagram.com/{path}/{shortcode}/media/?size=l"


def reel_thumbnail_via_ytdlp(shortcode: str) -> str | None:
    url = f"https://www.instagram.com/reel/{shortcode}/"
    cmd = ["python", "-m", "yt_dlp", "--no-warnings", "--print", "%(thumbnail)s", url]
    result = subprocess.run(cmd, capture_output=True, text=True, check=False)
    thumb = (result.stdout or "").strip()
    return thumb if thumb.startswith("http") else None


def download(image_url: str, dest: Path) -> None:
    req = urllib.request.Request(image_url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read()
    dest.write_bytes(data)
    print(f"  saved {dest.name} ({len(data)} bytes)")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for filename, shortcode, kind in POSTS:
        dest = OUT_DIR / filename
        print(f"Processing {filename}...")
        if kind == "reel":
            thumb = reel_thumbnail_via_ytdlp(shortcode)
            if thumb:
                download(thumb, dest)
                continue
        download(media_url(shortcode, kind), dest)


if __name__ == "__main__":
    main()
