import mimetypes
import os
import re

from django.http import FileResponse, Http404, HttpResponse, StreamingHttpResponse
from django.utils._os import safe_join
from django.utils.http import http_date
from django.views.static import was_modified_since

RANGE_RE = re.compile(r"bytes\s*=\s*(\d+)?-(\d+)?", re.IGNORECASE)


def _file_iterator(file_path, offset, length, chunk_size=8192):
    with open(file_path, "rb") as f:
        f.seek(offset)
        remaining = length
        while remaining > 0:
            chunk = f.read(min(chunk_size, remaining))
            if not chunk:
                break
            remaining -= len(chunk)
            yield chunk


def serve_ranged(request, path, document_root=None):
    """Dev-only stand-in for django.views.static.serve that supports HTTP
    Range requests, which django.http.FileResponse does not implement.
    Without this, <video> seeking is broken under `manage.py runserver`
    (production is unaffected — nginx serves /media/ with Range support natively).
    """
    fullpath = safe_join(document_root, path)
    if not os.path.exists(fullpath) or os.path.isdir(fullpath):
        raise Http404(f"'{path}' does not exist")

    statobj = os.stat(fullpath)
    if not was_modified_since(request.META.get("HTTP_IF_MODIFIED_SINCE"), statobj.st_mtime):
        return HttpResponse(status=304)

    content_type, encoding = mimetypes.guess_type(fullpath)
    content_type = content_type or "application/octet-stream"
    size = statobj.st_size

    range_match = RANGE_RE.match(request.META.get("HTTP_RANGE", ""))

    if range_match:
        start_str, end_str = range_match.groups()
        start = int(start_str) if start_str else 0
        end = int(end_str) if end_str else size - 1
        end = min(end, size - 1)
        if start > end or start >= size:
            response = HttpResponse(status=416)
            response["Content-Range"] = f"bytes */{size}"
            return response
        length = end - start + 1
        response = StreamingHttpResponse(
            _file_iterator(fullpath, start, length),
            status=206,
            content_type=content_type,
        )
        response["Content-Range"] = f"bytes {start}-{end}/{size}"
        response["Content-Length"] = str(length)
    else:
        response = FileResponse(open(fullpath, "rb"), content_type=content_type)
        response["Content-Length"] = str(size)

    response["Accept-Ranges"] = "bytes"
    response["Last-Modified"] = http_date(statobj.st_mtime)
    if encoding:
        response["Content-Encoding"] = encoding
    return response
