#!/usr/bin/env python3
"""给所有页面生成 favicon 链接与 og / twitter 预览卡片。

跑法：

    python scripts/update_social_meta.py                      # 相对路径
    python scripts/update_social_meta.py https://example.com  # 绝对路径

**为什么需要 base URL**：微信、Slack、LinkedIn 这类客户端抓预览图时，大多不解析
相对路径的 og:image。站点还没有域名时先写相对路径（无害，但部分客户端不显示图），
等域名定下来，把域名作为参数跑一次，所有 og:image / twitter:image 会改成绝对地址。

脚本可重复运行：每次先清掉上一次生成的块再重写，不会叠加。
页面的描述取自各自的 proj-subtitle；首页、简历、摄影页在下面的表里单独指定。
"""
import glob
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NAME = "Zhao Zirui"

# 这三页没有 proj-subtitle，也没有合适的首图，单独指定
OVERRIDE_IMG = {
    "index.html": "images/og-home.jpg",
    "resume.html": "images/og-home.jpg",
    "photography.html": "images/projects/photot/DSC_1455.webp",
}

OVERRIDE_DESC = {
    "resume.html": ("Resume of Zhao Zirui - Unity Interaction Engineer at VITURE. "
                    "AR glasses interaction, XR research (CHI EA 2026, IEEE VR 2026), "
                    "and an architecture background."),
    "photography.html": ("Photography by Zhao Zirui - light, structure and presence, "
                         "the same concerns that run through the XR work."),
}

BLOCK_START = "  <!-- social preview (generated) -->\n"
BLOCK_END = "  <!-- /social preview -->\n"


def text_of(html, pattern):
    m = re.search(pattern, html, re.S)
    if not m:
        return None
    return re.sub(r"\s+", " ", re.sub(r"<[^>]*>", " ", m.group(1))).strip() or None


def pick_image(html, page):
    if page in OVERRIDE_IMG:
        return OVERRIDE_IMG[page]
    for pat in (r'<div class="side-cover-box">\s*<img[^>]*src="([^"]+)"',
                r'<img class="shot-img"[^>]*src="([^"]+)"',
                r'<video class="shot-img"[^>]*poster="([^"]+)"',
                r'<img[^>]*src="([^"]+)"[^>]*class="project-image"'):
        m = re.search(pat, html)
        if m:
            src = m.group(1)
            return src[3:] if src.startswith("../") else src
    return "images/og-home.jpg"


def head_links(up):
    return ('  <link rel="icon" type="image/svg+xml" href="%simages/favicon.svg" />\n'
            '  <link rel="icon" type="image/png" sizes="32x32" href="%simages/favicon-32.png" />\n'
            '  <link rel="apple-touch-icon" href="%simages/apple-touch-icon.png" />\n'
            % (up, up, up))


def esc(s):
    return s.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;")


def main(site_base=""):
    os.chdir(ROOT)
    pages = ["index.html", "resume.html", "photography.html"] + sorted(glob.glob("projects/*.html"))
    done = 0

    for page in pages:
        page = page.replace("\\", "/")   # glob 在 Windows 返回反斜杠，depth 会判错
        if not os.path.exists(page):
            continue
        html = io.open(page, encoding="utf-8").read()
        up = "../" if page.startswith("projects/") else ""

        # 幂等：先清掉上一次生成的内容
        html = re.sub(re.escape(BLOCK_START) + r".*?" + re.escape(BLOCK_END), "", html, flags=re.S)
        html = re.sub(r'\s*<link rel="(?:icon|apple-touch-icon)"[^>]*/?>', "", html)

        title = text_of(html, r"<title[^>]*>(.*?)</title>") or NAME
        og_title = title if ("Zirui" in title or "Zhao" in title) else "%s | %s" % (title, NAME)

        desc = (OVERRIDE_DESC.get(page)
                or text_of(html, r'<p class="proj-subtitle"[^>]*>(.*?)</p>')
                or text_of(html, r'<meta name="description"\s*\n?\s*content="([^"]*)"')
                or text_of(html, r'<p class="portfolio-subtitle"[^>]*>(.*?)</p>')
                or "Portfolio of %s." % NAME)
        if len(desc) > 200:
            desc = desc[:197].rstrip() + "..."

        img = pick_image(html, page)
        img_url = (site_base.rstrip("/") + "/" + img) if site_base else (up + img)

        block = (BLOCK_START
                 + '  <meta property="og:type" content="website" />\n'
                 + '  <meta property="og:site_name" content="%s" />\n' % esc(NAME)
                 + '  <meta property="og:title" content="%s" />\n' % esc(og_title)
                 + '  <meta property="og:description" content="%s" />\n' % esc(desc)
                 + '  <meta property="og:image" content="%s" />\n' % esc(img_url)
                 + '  <meta name="twitter:card" content="summary_large_image" />\n'
                 + '  <meta name="twitter:title" content="%s" />\n' % esc(og_title)
                 + '  <meta name="twitter:description" content="%s" />\n' % esc(desc)
                 + '  <meta name="twitter:image" content="%s" />\n' % esc(img_url)
                 + BLOCK_END)

        if not re.search(r'<meta name="description"', html):
            block = '  <meta name="description" content="%s" />\n' % esc(desc) + block

        m = re.search(r"</head>", html)
        if not m:
            raise SystemExit("没有 </head>: " + page)
        html = html[:m.start()] + head_links(up) + block + html[m.start():]

        io.open(page, "w", encoding="utf-8").write(html)
        done += 1
        print("%-46s %s" % (page, img))

    print("\n%d 个页面已更新（base=%s）" % (done, site_base or "相对路径"))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "")
