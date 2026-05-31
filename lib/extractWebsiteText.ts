import * as cheerio from "cheerio";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-GB,en;q=0.9",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
};

const CONTENT_CANDIDATE_SELECTORS = [
  "main",
  "article",
  '[role="main"]',
  "#content",
  "#main-content",
  ".content",
  ".page-content",
  ".post-content",
  ".entry-content",
  ".article-content",
  ".article-body",
  ".prose",
  ".rich-text",
  ".documentation",
  "body",
];

const CONTENT_TEXT_SELECTORS =
  "h1, h2, h3, h4, h5, h6, p, li, blockquote, pre, code, td, th";

const NOISE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "svg",
  "canvas",
  "iframe",
  "nav",
  "footer",
  "header",
  "aside",
  "form",
  "button",
  "input",
  "select",
  "textarea",
  "dialog",
  "template",
  '[aria-hidden="true"]',
  "[hidden]",
  ".sr-only",
  ".visually-hidden",
].join(", ");

const BOILERPLATE_HINTS =
  /(cookie|consent|breadcrumb|sidebar|newsletter|subscribe|share|social|footer|header|nav|menu|search|pagination|related|promo|advert|banner|popup|modal|comment|login|signup)/i;

const LOW_SIGNAL_LINE_REGEX =
  /^(0\+?|menu|accept|decline|sign up|book your table|contact us|quick link|previous|next)$/i;

type ExtractWebsiteTextResult = {
  sourceUrl: string;
  pageTitle: string | null;
  text: string;
  sections: Array<{
    title: string;
    content: string;
  }>;
};

type CheerioNode = {
  tagName?: string;
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function dedupeLines(lines: string[]) {
  const deduped: string[] = [];

  for (const line of lines) {
    if (!line) {
      continue;
    }

    if (deduped[deduped.length - 1] !== line) {
      deduped.push(line);
    }
  }

  return deduped;
}

function shouldKeepStructuredLine({
  line,
  tagName,
}: {
  line: string;
  tagName?: string;
}) {
  if (!line) {
    return false;
  }

  if (LOW_SIGNAL_LINE_REGEX.test(line)) {
    return false;
  }

  if (/^[\d\W]+$/.test(line)) {
    return false;
  }

  if (tagName && /^h[1-6]$/i.test(tagName)) {
    return line.length >= 3;
  }

  return line.length >= 5;
}

function removeBoilerplateElements($: cheerio.CheerioAPI) {
  $(NOISE_SELECTORS).remove();

  $("*").each((_, element) => {
    const node = $(element);
    const id = node.attr("id") || "";
    const className = node.attr("class") || "";
    const role = node.attr("role") || "";
    const ariaLabel = node.attr("aria-label") || "";
    const combined = `${id} ${className} ${role} ${ariaLabel}`;

    if (combined && BOILERPLATE_HINTS.test(combined)) {
      node.remove();
    }
  });
}

function scoreCandidate($: cheerio.CheerioAPI, selector: string) {
  const candidates = $(selector).toArray();

  return candidates
    .map((candidate) => {
      const node = $(candidate);
      const text = normalizeWhitespace(node.text());
      const paragraphCount = node.find("p").length;
      const headingCount = node.find("h1, h2, h3").length;
      const linkTextLength = normalizeWhitespace(node.find("a").text()).length;
      const linkDensity = text.length ? linkTextLength / text.length : 1;

      let score = text.length;
      score += paragraphCount * 250;
      score += headingCount * 150;
      score -= Math.round(linkDensity * 1200);

      return {
        node,
        score,
        textLength: text.length,
      };
    })
    .filter((candidate) => candidate.textLength >= 200)
    .sort((left, right) => right.score - left.score)[0];
}

function getBestContentNode($: cheerio.CheerioAPI) {
  for (const selector of CONTENT_CANDIDATE_SELECTORS) {
    const bestCandidate = scoreCandidate($, selector);

    if (bestCandidate) {
      return bestCandidate.node;
    }
  }

  return $("body");
}

function isHeadingElement(element?: CheerioNode | null) {
  return Boolean(element && /^(h[1-6])$/i.test(element.tagName || ""));
}

function isContainerCandidate({
  node,
  contentRoot,
}: {
  node: cheerio.Cheerio<any>;
  contentRoot: cheerio.Cheerio<any>;
}) {
  if (!node.length) {
    return false;
  }

  const element = node.get(0);

  if (!element || isHeadingElement(element)) {
    return false;
  }

  if (contentRoot.get(0) === element) {
    return false;
  }

  const children = node.children().toArray();

  if (children.length < 2 || children.length > 12) {
    return false;
  }

  const hasHeadingChild = children.some((child) => isHeadingElement(child));
  const hasNonHeadingChild = children.some((child) => !isHeadingElement(child));

  if (!hasHeadingChild || !hasNonHeadingChild) {
    return false;
  }

  const textLength = normalizeWhitespace(node.text()).length;

  return textLength >= 30 && textLength <= 4000;
}

function findNearestSectionContainer({
  heading,
  contentRoot,
}: {
  heading: cheerio.Cheerio<any>;
  contentRoot: cheerio.Cheerio<any>;
}) {
  let current = heading.parent();

  while (current.length) {
    if (isContainerCandidate({ node: current, contentRoot })) {
      return current;
    }

    if (current.get(0) === contentRoot.get(0)) {
      break;
    }

    current = current.parent();
  }

  return null;
}

function extractStructuredText(
  $: cheerio.CheerioAPI,
  contentRoot: cheerio.Cheerio<any>,
) {
  const lines = contentRoot
    .find(CONTENT_TEXT_SELECTORS)
    .toArray()
    .map((element) => {
      const tagName = element.tagName?.toLowerCase();
      const line = normalizeWhitespace($(element).text());

      return {
        line,
        tagName,
      };
    })
    .filter(({ line, tagName }) => shouldKeepStructuredLine({ line, tagName }))
    .map(({ line }) => line);

  const dedupedLines = dedupeLines(lines);

  if (dedupedLines.length > 0) {
    return dedupedLines.join("\n\n");
  }

  return normalizeWhitespace(contentRoot.text());
}

function extractStructuredSections(
  $: cheerio.CheerioAPI,
  contentRoot: cheerio.Cheerio<any>,
) {
  const sections: Array<{ title: string; content: string }> = [];
  const seenContainers = new Set<unknown>();

  contentRoot.find("h1, h2, h3, h4, h5, h6").each((_, element) => {
    const heading = $(element);
    const title = normalizeWhitespace(heading.text());

    if (!shouldKeepStructuredLine({ line: title, tagName: element.tagName })) {
      return;
    }

    const container = findNearestSectionContainer({
      heading,
      contentRoot,
    });

    if (container?.length) {
      const containerNode = container.get(0);

      if (!containerNode || seenContainers.has(containerNode)) {
        return;
      }

      seenContainers.add(containerNode);

      const content = extractStructuredText($, container);

      if (!content || content === title) {
        return;
      }

      sections.push({ title, content });
      return;
    }

    const collectedLines = [title];
    let sibling = heading.next();

    while (sibling.length) {
      const siblingNode = sibling.get(0);

      if (isHeadingElement(siblingNode)) {
        break;
      }

      const siblingText = extractStructuredText($, sibling);

      if (siblingText) {
        collectedLines.push(siblingText);
      }

      sibling = sibling.next();
    }

    const content = dedupeLines(collectedLines).join("\n\n");

    if (content && content !== title) {
      sections.push({ title, content });
    }
  });

  return sections;
}

function getPageTitle($: cheerio.CheerioAPI) {
  const candidates = [
    $('meta[property="og:title"]').attr("content"),
    $('meta[name="twitter:title"]').attr("content"),
    $("h1").first().text(),
    $("title").text(),
  ];

  for (const candidate of candidates) {
    const title = normalizeWhitespace(candidate || "");

    if (title) {
      return title;
    }
  }

  return null;
}

function looksLikeClientRenderedShell($: cheerio.CheerioAPI) {
  const bodyText = normalizeWhitespace($("body").text());
  const appRootCount = $(
    "#app, #root, #__next, #rw_customer_portal, [data-reactroot]",
  ).length;
  const moduleScriptCount = $('script[type="module"]').length;
  const refinedConfigCount = $(
    'script[type="application/vnd.refined.config+json"]',
  ).length;
  const headingCount = $("h1, h2, h3, h4, h5, h6").length;
  const paragraphCount = $("p").length;

  return Boolean(
    (appRootCount > 0 || refinedConfigCount > 0 || moduleScriptCount > 0) &&
    bodyText.length < 300 &&
    headingCount === 0 &&
    paragraphCount === 0,
  );
}

export async function extractWebsiteText({
  url,
}: {
  url: string;
}): Promise<ExtractWebsiteTextResult> {
  const response = await fetch(url, {
    headers: BROWSER_HEADERS,
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch website content (${response.status})`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  removeBoilerplateElements($);

  const contentRoot = getBestContentNode($);
  let text = extractStructuredText($, contentRoot);
  const sections = extractStructuredSections($, contentRoot);

  if (text.length < 300) {
    text = normalizeWhitespace($("body").text());
  }

  if (text.length < 300) {
    if (looksLikeClientRenderedShell($)) {
      throw new Error(
        "This URL appears to load its article content client-side after JavaScript runs, so the importer cannot read it from the raw HTML response.",
      );
    }

    throw new Error(
      "Could not extract enough meaningful page content from the URL",
    );
  }

  return {
    sourceUrl: response.url || url,
    pageTitle: getPageTitle($),
    text,
    sections,
  };
}
