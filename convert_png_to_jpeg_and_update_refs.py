# convert_png_to_jpeg_and_update_refs.py
import argparse
from pathlib import Path
from PIL import Image
import re

TEXT_EXTS = {".html", ".md", ".css", ".js", ".jsx", ".ts", ".tsx"}
IMG_EXT = ".png"

def has_alpha(img: Image.Image) -> bool:
    return (img.mode in ("RGBA", "LA")) or (img.mode == "P" and "transparency" in img.info)

def to_jpeg(img: Image.Image, bg_color=(255, 255, 255)) -> Image.Image:
    """PNG(투명 포함) → JPEG용 RGB 이미지로 변환"""
    if img.mode in ("P", "L"):
        img = img.convert("RGBA")
    if has_alpha(img):
        bg = Image.new("RGB", img.size, bg_color)
        bg.paste(img, mask=img.getchannel("A"))
        return bg
    return img.convert("RGB")

def find_text_files(root: Path):
    for p in root.rglob("*"):
        if p.is_file() and p.suffix.lower() in TEXT_EXTS:
            yield p

def find_png_files(root: Path, skip_keywords):
    for p in root.rglob(f"*{IMG_EXT}"):
        if not p.is_file():
            continue
        name_lower = p.name.lower()
        if any(k in name_lower for k in skip_keywords):
            continue
        yield p

def update_references_in_file(file_path: Path, mapping: dict, dry_run: bool):
    text = file_path.read_text(encoding="utf-8", errors="ignore")
    original = text
    # 안전하게 파일명 단위로만 치환 (경로/쿼리 스트링 포함 케이스도 대응)
    for png_path, jpg_path in mapping.items():
        png_name = png_path.name
        jpg_name = jpg_path.name
        # 정확히 파일명 또는 파일명 뒤에 ?query 같은게 붙은 경우 교체
        # ex) "/img/foo.png", "foo.png", "foo.png?ver=1" → "foo.jpg" 유지(쿼리는 그대로)
        text = re.sub(rf"(?<![\w-]){re.escape(png_name)}(\?[^\"'\s)]*)?",
                      lambda m: jpg_name + (m.group(1) or ""),
                      text)
    changed = (text != original)
    if changed and not dry_run:
        file_path.write_text(text, encoding="utf-8")
    return changed

def main():
    ap = argparse.ArgumentParser(description="Convert PNG to JPEG and update references.")
    ap.add_argument("--root", default=".", help="작업 루트 디렉토리 (기본값: .)")
    ap.add_argument("--quality", type=int, default=85, help="JPEG 품질 (기본 85)")
    ap.add_argument("--delete-png", action="store_true", help="변환 후 원본 PNG 삭제")
    ap.add_argument("--skip", default="", help="파일명에 포함되면 변환을 건너뛸 키워드들(쉼표구분). 예: logo,icon")
    ap.add_argument("--dry-run", action="store_true", help="실제 파일 수정 없이 변경사항만 출력")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    skip_keywords = [s.strip().lower() for s in args.skip.split(",") if s.strip()]
    dry_run = args.dry_run

    print(f"[INFO] root={root}")
    if skip_keywords:
        print(f"[INFO] skip keywords={skip_keywords}")
    if dry_run:
        print("[INFO] DRY-RUN 모드: 실제로 파일을 수정/삭제하지 않습니다.")

    # 1) PNG → JPEG 변환
    mapping = {}  # {png_path: jpg_path}
    converted, skipped = 0, 0
    for png_path in find_png_files(root, skip_keywords):
        jpg_path = png_path.with_suffix(".jpg")
        try:
            with Image.open(png_path) as im:
                im_jpg = to_jpeg(im)
                if dry_run:
                    print(f"[DRY] Convert: {png_path} -> {jpg_path}")
                else:
                    im_jpg.save(jpg_path, "JPEG", quality=args.quality, optimize=True, progressive=True)
                    print(f"[OK ] Convert: {png_path} -> {jpg_path}")
                mapping[png_path] = jpg_path
                converted += 1
        except Exception as e:
            print(f"[SKIP] {png_path} (오류: {e})")
            skipped += 1

    print(f"[INFO] 변환 완료: {converted}개, 건너뜀: {skipped}개")

    # 2) 참조 파일(.html/.md/.css/.js 등) 일괄 치환
    changed_files = 0
    if mapping:
        for tf in find_text_files(root):
            changed = update_references_in_file(tf, mapping, dry_run)
            if changed:
                changed_files += 1
                print(f"[UPD ] ref updated: {tf}")
    print(f"[INFO] 참조 업데이트된 파일 수: {changed_files}")

    # 3) PNG 삭제
    if mapping and args.delete_png:
        for png_path in mapping:
            if dry_run:
                print(f"[DRY] Delete: {png_path}")
            else:
                try:
                    png_path.unlink()
                    print(f"[DEL] {png_path}")
                except Exception as e:
                    print(f"[ERR] 삭제 실패: {png_path} ({e})")

    print("[DONE] 전체 작업 완료.")

if __name__ == "__main__":
    main()
