#!/usr/bin/env python3
"""Visual and Mobile SEO Analysis for Ketsuin website."""

from playwright.sync_api import sync_playwright
import json
import os

URL = "https://ketsuin.clothpath.com/"
OUT_DIR = os.path.dirname(os.path.abspath(__file__))

VIEWPORTS = {
    "desktop_1920x1080": {"width": 1920, "height": 1080},
    "laptop_1366x768": {"width": 1366, "height": 768},
    "tablet_768x1024": {"width": 768, "height": 1024},
    "mobile_375x812": {"width": 375, "height": 812},
}


def analyze_page(page):
    """Extract SEO and accessibility metadata from the page."""
    data = {}

    # Viewport meta tag
    data["viewport_meta"] = page.evaluate("""
        () => {
            const meta = document.querySelector('meta[name="viewport"]');
            return meta ? meta.getAttribute('content') : null;
        }
    """)

    # Title
    data["title"] = page.title()

    # Meta description
    data["meta_description"] = page.evaluate("""
        () => {
            const meta = document.querySelector('meta[name="description"]');
            return meta ? meta.getAttribute('content') : null;
        }
    """)

    # H1 tags
    data["h1_texts"] = page.evaluate("""
        () => Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim())
    """)

    # All headings
    data["headings"] = page.evaluate("""
        () => {
            const headings = [];
            document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
                headings.push({ tag: h.tagName, text: h.textContent.trim().substring(0, 100) });
            });
            return headings;
        }
    """)

    # Lang attribute
    data["html_lang"] = page.evaluate("""
        () => document.documentElement.getAttribute('lang')
    """)

    # Canonical URL
    data["canonical"] = page.evaluate("""
        () => {
            const link = document.querySelector('link[rel="canonical"]');
            return link ? link.getAttribute('href') : null;
        }
    """)

    # OG tags
    data["og_tags"] = page.evaluate("""
        () => {
            const tags = {};
            document.querySelectorAll('meta[property^="og:"]').forEach(m => {
                tags[m.getAttribute('property')] = m.getAttribute('content');
            });
            return tags;
        }
    """)

    # Images without alt
    data["images_without_alt"] = page.evaluate("""
        () => {
            const imgs = document.querySelectorAll('img');
            let noAlt = 0;
            imgs.forEach(img => {
                if (!img.getAttribute('alt') && img.getAttribute('alt') !== '') noAlt++;
            });
            return { total: imgs.length, without_alt: noAlt };
        }
    """)

    # Links
    data["links_info"] = page.evaluate("""
        () => {
            const links = document.querySelectorAll('a');
            let noText = 0;
            let total = links.length;
            links.forEach(a => {
                const text = a.textContent.trim();
                const ariaLabel = a.getAttribute('aria-label');
                const img = a.querySelector('img[alt]');
                if (!text && !ariaLabel && !img) noText++;
            });
            return { total, without_text: noText };
        }
    """)

    # Check for horizontal scroll (mobile)
    data["body_dimensions"] = page.evaluate("""
        () => ({
            scrollWidth: document.body.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            hasHorizontalScroll: document.body.scrollWidth > document.documentElement.clientWidth
        })
    """)

    # Font sizes analysis
    data["font_analysis"] = page.evaluate("""
        () => {
            const elements = document.querySelectorAll('p, span, a, li, td, label, button, h1, h2, h3, h4, h5, h6');
            const sizes = {};
            let tooSmall = 0;
            elements.forEach(el => {
                const style = window.getComputedStyle(el);
                const size = parseFloat(style.fontSize);
                const key = size + 'px';
                sizes[key] = (sizes[key] || 0) + 1;
                if (size < 12 && el.textContent.trim().length > 0) tooSmall++;
            });
            return { size_distribution: sizes, elements_below_12px: tooSmall };
        }
    """)

    # Touch target analysis (interactive elements)
    data["touch_targets"] = page.evaluate("""
        () => {
            const interactives = document.querySelectorAll('a, button, input, select, textarea, [role="button"], [onclick]');
            let tooSmall = 0;
            let total = 0;
            const smalls = [];
            interactives.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.width === 0 && rect.height === 0) return;
                total++;
                if (rect.width < 44 || rect.height < 44) {
                    tooSmall++;
                    const tag = el.tagName.toLowerCase();
                    const text = (el.textContent || '').trim().substring(0, 40);
                    smalls.push({ tag, text, width: Math.round(rect.width), height: Math.round(rect.height) });
                }
            });
            return { total_interactive: total, below_44px: tooSmall, small_examples: smalls.slice(0, 10) };
        }
    """)

    # CTA above the fold
    data["above_fold_cta"] = page.evaluate("""
        () => {
            const buttons = document.querySelectorAll('button, a[href], [role="button"], input[type="submit"]');
            const visible = [];
            buttons.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.width > 0 && rect.height > 0) {
                    visible.push({
                        tag: el.tagName,
                        text: (el.textContent || '').trim().substring(0, 60),
                        href: el.getAttribute('href') || '',
                        y: Math.round(rect.top)
                    });
                }
            });
            return visible;
        }
    """)

    # SPA detection
    data["spa_detection"] = page.evaluate("""
        () => {
            const scripts = document.querySelectorAll('script[src]');
            const srcs = Array.from(scripts).map(s => s.getAttribute('src'));
            const frameworks = {
                react: srcs.some(s => s && s.includes('react')),
                vue: srcs.some(s => s && s.includes('vue')),
                angular: srcs.some(s => s && s.includes('angular')),
                next: srcs.some(s => s && s.includes('next')),
                nuxt: srcs.some(s => s && s.includes('nuxt')),
            };
            // Check for root div typical of SPAs
            const rootDiv = document.getElementById('root') || document.getElementById('app') || document.getElementById('__next');
            return { script_sources: srcs.slice(0, 15), frameworks, has_root_div: !!rootDiv, root_id: rootDiv ? rootDiv.id : null };
        }
    """)

    # Structured data
    data["structured_data"] = page.evaluate("""
        () => {
            const ldJsons = document.querySelectorAll('script[type="application/ld+json"]');
            return Array.from(ldJsons).map(s => s.textContent.substring(0, 500));
        }
    """)

    # CSS/JS resource count
    data["resources"] = page.evaluate("""
        () => ({
            stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
            scripts: document.querySelectorAll('script[src]').length,
            inline_styles: document.querySelectorAll('style').length,
        })
    """)

    return data


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()

        all_results = {}

        for name, viewport in VIEWPORTS.items():
            print(f"\n--- Capturing {name} ---")
            context = browser.new_context(
                viewport=viewport,
                device_scale_factor=2 if "mobile" in name else 1,
            )
            page = context.new_page()
            page.goto(URL, wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(2000)  # Extra wait for rendering

            # Screenshot
            screenshot_path = os.path.join(OUT_DIR, f"{name}.png")
            page.screenshot(path=screenshot_path, full_page=False)
            print(f"  Saved: {screenshot_path}")

            # Full page screenshot for desktop and mobile
            if name in ("desktop_1920x1080", "mobile_375x812"):
                full_path = os.path.join(OUT_DIR, f"{name}_full.png")
                page.screenshot(path=full_path, full_page=True)
                print(f"  Full page: {full_path}")

            # Run analysis on mobile viewport (most relevant for mobile SEO)
            if name == "mobile_375x812":
                print("  Running mobile analysis...")
                all_results["mobile_analysis"] = analyze_page(page)

            if name == "desktop_1920x1080":
                print("  Running desktop analysis...")
                all_results["desktop_analysis"] = analyze_page(page)

            context.close()

        browser.close()

        # Save analysis results
        results_path = os.path.join(OUT_DIR, "analysis_results.json")
        with open(results_path, "w") as f:
            json.dump(all_results, f, indent=2, ensure_ascii=False)
        print(f"\nAnalysis saved to: {results_path}")

        # Print summary
        print("\n" + "=" * 60)
        print("ANALYSIS SUMMARY")
        print("=" * 60)

        for key, data in all_results.items():
            print(f"\n--- {key} ---")
            print(f"  Title: {data.get('title')}")
            print(f"  HTML lang: {data.get('html_lang')}")
            print(f"  Viewport meta: {data.get('viewport_meta')}")
            print(f"  Meta description: {data.get('meta_description', 'N/A')[:100]}")
            print(f"  H1 tags: {data.get('h1_texts')}")
            print(f"  Headings count: {len(data.get('headings', []))}")
            print(f"  Canonical: {data.get('canonical')}")
            print(f"  OG tags: {data.get('og_tags')}")
            print(f"  Images: {data.get('images_without_alt')}")
            print(f"  Links: {data.get('links_info')}")
            print(f"  Body scroll: {data.get('body_dimensions')}")
            print(f"  Font sizes: {data.get('font_analysis', {}).get('size_distribution')}")
            print(f"  Elements <12px: {data.get('font_analysis', {}).get('elements_below_12px')}")
            print(f"  Touch targets: {data.get('touch_targets', {}).get('total_interactive')} total, {data.get('touch_targets', {}).get('below_44px')} below 44px")
            print(f"  Small touch targets: {data.get('touch_targets', {}).get('small_examples', [])[:5]}")
            print(f"  Above-fold CTAs: {data.get('above_fold_cta')}")
            print(f"  SPA detection: {data.get('spa_detection')}")
            print(f"  Structured data: {data.get('structured_data')}")
            print(f"  Resources: {data.get('resources')}")


if __name__ == "__main__":
    main()
