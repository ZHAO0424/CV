#!/usr/bin/env python3
"""站点一致性体检。

跑法（仓库任意位置皆可）：

    python scripts/audit_site.py

检查项：
  1. lang.js 里重复定义的 key —— 后者会静默覆盖前者
  2. 同一个 data-i18n key 在不同页面挂着不同英文 —— 切中文时必有一边被错误覆盖
  3. 内容相同但被当作两张图挂载的图片
  4. 缺 alt 的 <img>
  5. 漏引 lang.js / interactions.js 的页面
  6. 首页卡片分类与筛选栏是否对得上
  7. 断链（相对路径的图片、视频、样式、脚本、页面）

无问题时退出码 0，有问题时退出码 1，可直接挂进 CI 或 pre-commit。
"""
import hashlib
import io
import os
import re
import sys
import glob
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def pages():
    out = ["index.html", "resume.html", "photography.html"]
    out += sorted(p.replace("\\", "/") for p in glob.glob("projects/*.html"))
    return [p for p in out if os.path.exists(p)]


def read(p):
    return io.open(p, encoding="utf-8").read()


def zh_block():
    src = read("lang.js")
    m = re.search(r"const zhTranslations\s*=\s*\{(.*?)\n\};", src, re.S)
    if not m:
        raise SystemExit("lang.js: 找不到 zhTranslations")
    return m.group(1)


def check_duplicate_keys(problems):
    keys = re.findall(r"^\s{2}([A-Za-z_][A-Za-z0-9_]*)\s*:", zh_block(), re.M)
    for k in sorted({k for k in keys if keys.count(k) > 1}):
        problems.append(("lang.js 重复 key", "%s（出现 %d 次）" % (k, keys.count(k))))


def check_key_collisions(problems):
    """同一个 key 配了不同英文原文 —— 中文只有一份，必然有一边是错的。"""
    en = defaultdict(set)
    where = defaultdict(set)
    for p in pages():
        for m in re.finditer(r'data-i18n="([^"]+)"[^>]*>(.*?)</', read(p), re.S):
            txt = re.sub(r"\s+", " ", re.sub(r"<[^>]*>", "", m.group(2))).strip()
            if txt:
                en[m.group(1)].add(txt)
                where[m.group(1)].add(p)
    for k, vals in sorted(en.items()):
        if len(vals) > 1:
            problems.append(("同 key 不同英文", "%s -> %s  [%s]" % (
                k, " / ".join(sorted(v[:45] for v in vals)), ", ".join(sorted(where[k])))))


def referenced_files():
    refs = set()
    for p in pages():
        base = os.path.dirname(p)
        for m in re.findall(r'(?:src|poster)="([^"]+)"', read(p)):
            refs.add(os.path.normpath(os.path.join(base, m)).replace("\\", "/"))
    return refs


def check_duplicate_images(problems):
    refs = referenced_files()
    digest = defaultdict(list)
    for root, _, files in os.walk("images"):
        if "_originals" in root:
            continue
        for f in files:
            if not f.lower().endswith((".webp", ".png", ".jpg", ".jpeg")):
                continue
            fp = os.path.join(root, f)
            if os.path.getsize(fp) > 20 * 1024 * 1024:   # 大文件跳过，体检不值这个时间
                continue
            digest[hashlib.md5(io.open(fp, "rb").read()).hexdigest()].append(
                fp.replace("\\", "/"))
    for fs in digest.values():
        same = [f for f in fs if f in refs]
        if len(same) > 1:
            problems.append(("重复图片（内容相同）", " = ".join(same)))


def check_alt_and_scripts(problems):
    for p in pages():
        h = read(p)
        for m in re.finditer(r"<img(?![^>]*\balt=)[^>]*>", h):
            problems.append(("img 缺 alt", "%s: %s" % (p, m.group(0)[:70])))
        for need in ("lang.js", "interactions.js"):
            if need not in h:
                problems.append(("漏引脚本", "%s 少 %s" % (p, need)))


def check_categories(problems):
    h = read("index.html")
    cards = re.findall(r'class="project-card reveal" data-category="([a-z]+)"', h)
    total = len(re.findall(r'class="project-card', h))
    for f in re.findall(r'data-filter="([a-z]+)"', h):
        if f != "all" and f not in cards:
            problems.append(("空筛选分类", f))
    if len(cards) != total:
        problems.append(("卡片漏分类", "%d/%d 张卡片带 data-category" % (len(cards), total)))


def check_links(problems):
    ext = re.compile(r"\.(webp|png|jpg|jpeg|svg|mp4|css|js|html|ico)$", re.I)
    for p in pages():
        base = os.path.dirname(p)
        h = read(p)
        for attr in ("src", "href", "poster", "content"):
            for v in re.findall(attr + r'="([^"]+)"', h):
                if v.startswith(("http", "mailto:", "#", "data:")) or "?" in v:
                    continue
                if not ext.search(v):
                    continue
                if not os.path.exists(os.path.normpath(os.path.join(base, v))):
                    problems.append(("断链", "%s -> %s" % (p, v)))


def main():
    os.chdir(ROOT)
    problems = []
    check_duplicate_keys(problems)
    check_key_collisions(problems)
    check_duplicate_images(problems)
    check_alt_and_scripts(problems)
    check_categories(problems)
    check_links(problems)

    if not problems:
        print("没发现问题")
        return 0
    print("发现 %d 项：\n" % len(problems))
    for kind, detail in problems:
        print("  [%s] %s" % (kind, detail))
    return 1


if __name__ == "__main__":
    sys.exit(main())
