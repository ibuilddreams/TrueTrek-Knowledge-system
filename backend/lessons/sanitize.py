import nh3

# Tags/attributes the rich text editor (frontend/src/components/ui/RichTextEditor.jsx)
# can actually produce. Keep this list in sync with the DOMPurify config in
# frontend/src/components/features/portal/course-detail/RichTextLessonViewer.jsx —
# the two allowlists are independent and won't warn each other on drift.
ALLOWED_TAGS = {
    "p", "h1", "h2", "h3",
    "strong", "em", "u", "s",
    "ul", "ol", "li",
    "a", "blockquote", "code", "pre", "hr", "br",
    "table", "thead", "tbody", "tr", "th", "td",
}
ALLOWED_ATTRIBUTES = {
    "a": {"href"},
    "td": {"colspan", "rowspan"},
    "th": {"colspan", "rowspan"},
}
ALLOWED_URL_SCHEMES = {"http", "https", "mailto"}


def sanitize_lesson_html(html):
    """Strip any tag/attribute/URL-scheme a rich text lesson shouldn't contain."""
    return nh3.clean(
        html or "",
        tags=ALLOWED_TAGS,
        clean_content_tags={"script", "style"},
        attributes=ALLOWED_ATTRIBUTES,
        url_schemes=ALLOWED_URL_SCHEMES,
        link_rel="noopener noreferrer nofollow",
    )
