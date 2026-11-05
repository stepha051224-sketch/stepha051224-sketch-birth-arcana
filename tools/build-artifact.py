"""index.html에서 페이지 본문만 꺼내 dist/byeol-seogo.html 로 저장 (claude.ai Artifact 게시용)."""
import pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
src = (root / "index.html").read_text(encoding="utf-8")
body = re.search(r"<!--PAGE-START-->(.*)<!--PAGE-END-->", src, re.S).group(1).strip()
(root / "dist").mkdir(exist_ok=True)
(root / "dist" / "byeol-seogo.html").write_text(body + "\n", encoding="utf-8")
print("dist/byeol-seogo.html")
