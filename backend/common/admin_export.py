"""CSV export for the Django admin.

`ExportCsvMixin` gives a model four ways out, so an admin can take rows out of
the portal without a shell:

* an **Export** link on every row of the changelist — one course, one user,
  whichever row they are looking at;
* an **Export CSV** button on an object's own page, for the record already open;
* the same button on the changelist, for the whole list;
* an **Export selected ... to CSV** action, for a hand-picked few.

All four write the same columns in the same order, so a file holding one course
and a file holding the catalog can be opened, compared or stacked together.

Three things about it are deliberate. A single-row export carries the header row
too, because a lone line of values is unreadable a week later. The changelist
button exports exactly what the changelist in front of the admin is showing —
the same search, the same filters, the same ordering, and every page of it
rather than the one on screen — because somebody who narrowed a list to one
cohort and then got the whole table back would not find out until the file was
already open. And rows are streamed straight out of a server-side cursor instead
of being assembled in memory, so a table that has outgrown a page still exports
in one request.

Attach it to a `ModelAdmin` and list the columns:

    class ThingAdmin(ExportCsvMixin, admin.ModelAdmin):
        export_fields = (
            ("ID", "id"),
            ("Owner", "owner__email"),      # `__` walks relations
            ("Status", "get_status_display"),
            ("Tags", "export_tags"),        # a method on the admin
        )

An accessor is a callable, the name of a method on the admin (called with the
row), or a dotted-by-`__` path walked on the row itself — the same resolution
order `list_display` uses, so name admin helpers distinctly (`export_*`) rather
than after the field they render.
"""

import csv
import re
from datetime import date, datetime, time
from decimal import Decimal

from django.contrib import admin, messages
from django.contrib.admin.options import IncorrectLookupParameters
from django.contrib.admin.utils import quote, unquote
from django.core.exceptions import ObjectDoesNotExist, PermissionDenied
from django.db.models import Manager, QuerySet
from django.http import Http404, HttpResponseRedirect, StreamingHttpResponse
from django.urls import path, reverse
from django.utils import timezone
from django.utils.html import format_html
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _

# A cell that opens with one of these is a formula to Excel and Google Sheets,
# so a line somebody typed into their own profile could execute when an admin
# opens the export. Text starting with one is prefixed with an apostrophe, which
# is what tells a spreadsheet to read the cell as text.
ALWAYS_GUARDED_PREFIXES = ("=", "@", "\t", "\r")

# `+` and `-` are formula openers too, but in this data they are nearly always a
# phone number or a negative number, and an apostrophe in front of every one of
# those is a wart in every export. A cell that opens with a sign and then holds
# nothing but digits and phone punctuation can neither name a function nor open
# a DDE channel — both need letters — so it is left alone, and anything else
# after a sign is guarded like the rest.
SIGNED_NUMBER = re.compile(r"^[+-][\d\s().-]*$")

# Types that can never carry a formula, and whose rendering must stay literal.
LITERAL_TYPES = (bool, int, float, Decimal, datetime, date, time)

MULTI_VALUE_SEPARATOR = " | "
DATETIME_FORMAT = "%Y-%m-%d %H:%M:%S"
EMPTY = ""


class _EchoBuffer:
    """A file-like object that hands each written row straight back.

    `csv.writer` wants somewhere to write; giving it this turns `writerow` into
    "format one row and return it", which is what lets the response stream.
    """

    def write(self, value):
        return value


def render_value(value):
    """Return the spreadsheet rendering of a model value, without escaping."""
    if value is None:
        return EMPTY
    if isinstance(value, bool):
        return "Yes" if value else "No"
    if isinstance(value, datetime):
        if timezone.is_aware(value):
            value = timezone.localtime(value)
        return value.strftime(DATETIME_FORMAT)
    if isinstance(value, (date, time)):
        return value.isoformat()
    if isinstance(value, (int, float, Decimal)):
        return str(value)
    if isinstance(value, Manager):
        value = value.all()
    if isinstance(value, (QuerySet, list, tuple, set)):
        return MULTI_VALUE_SEPARATOR.join(render_value(item) for item in value)
    return str(value)


def reads_as_a_formula(text):
    if text.startswith(ALWAYS_GUARDED_PREFIXES):
        return True
    if text.startswith(("+", "-")):
        return SIGNED_NUMBER.match(text) is None
    return False


def format_cell(value):
    """Render a value and defuse it if a spreadsheet would read it as a formula."""
    text = render_value(value)
    # Numbers and dates render to something a spreadsheet can only read as a
    # number or a date, and must stay literal so the column stays sortable.
    if isinstance(value, LITERAL_TYPES):
        return text
    return f"'{text}" if reads_as_a_formula(text) else text


def resolve_value(model_admin, obj, accessor):
    """Read one column off a row, in `list_display`'s resolution order."""
    if callable(accessor):
        return accessor(obj)

    handler = getattr(model_admin, accessor, None)
    if callable(handler):
        return handler(obj)

    value = obj
    for part in accessor.split("__"):
        if value is None:
            return None
        try:
            value = getattr(value, part)
        except ObjectDoesNotExist:
            # A reverse one-to-one with no row behind it (a user who never got
            # a profile) is an empty cell, not a failed export.
            return None
        if callable(value):
            value = value()
    return value


def _csv_lines(headers, rows):
    writer = csv.writer(_EchoBuffer())
    # Excel reads a CSV in the system codepage unless the file opens with a
    # byte-order mark, which mangles every non-ASCII name in the export.
    yield "\ufeff" + writer.writerow(headers)
    for row in rows:
        yield writer.writerow(row)


class ExportCsvMixin:
    """Adds per-row, per-object, whole-list and selection CSV exports."""

    change_list_template = "admin/export_change_list.html"
    change_form_template = "admin/export_change_form.html"
    actions = ["export_selected_csv"]

    #: ((header, accessor), ...) — defaults to `list_display` when left empty.
    export_fields = ()
    #: Leading half of the downloaded filename; defaults to the model's name.
    export_filename_prefix = ""
    #: Rows fetched per round trip while streaming.
    export_chunk_size = 500

    # -- configuration hooks ---------------------------------------------

    def get_export_fields(self, request):
        if self.export_fields:
            return list(self.export_fields)
        return [
            (str(name).replace("_", " ").strip().capitalize(), name)
            for name in self.get_list_display(request)
            # The row's own export link is a button, not a column of data.
            if name != "export_csv_link"
        ]

    def get_export_queryset(self, request, queryset):
        """Hook for the joins an export needs but a changelist page does not."""
        return queryset

    def get_export_object_label(self, obj):
        """The part of a single row's filename that says which row it is."""
        return str(obj)

    def get_export_filename(self, request, obj=None):
        prefix = self.export_filename_prefix or slugify(self.opts.verbose_name_plural)
        stamp = timezone.localtime().strftime("%Y%m%d-%H%M%S")
        if obj is None:
            return f"{prefix}-{stamp}.csv"
        # One row is filed under what it is, not only under when it was taken,
        # so a folder of single exports can be read without opening any of them.
        label = slugify(self.get_export_object_label(obj))[:60] or str(obj.pk)
        return f"{prefix}-{label}-{stamp}.csv"

    # -- wiring ------------------------------------------------------------

    def _admin_url(self, suffix, args=None):
        return reverse(
            f"admin:{self.opts.app_label}_{self.opts.model_name}_{suffix}",
            args=args,
            current_app=self.admin_site.name,
        )

    def get_urls(self):
        info = f"{self.opts.app_label}_{self.opts.model_name}"
        # Ahead of the stock URLs: the catch-all `<path:object_id>/` would
        # otherwise swallow both of these and go looking for a row whose primary
        # key is "export-csv".
        return [
            path(
                "export-csv/",
                self.admin_site.admin_view(self.export_csv_view),
                name=f"{info}_export_csv",
            ),
            path(
                "<path:object_id>/export-csv/",
                self.admin_site.admin_view(self.export_object_csv_view),
                name=f"{info}_export_object_csv",
            ),
            *super().get_urls(),
        ]

    def get_list_display(self, request):
        list_display = list(super().get_list_display(request))
        if "export_csv_link" not in list_display:
            list_display.append("export_csv_link")
        return list_display

    # The column header is left blank on purpose: a column of buttons that each
    # say "Export" needs no heading saying "Export" above them, and the format
    # belongs on the button's tooltip rather than in its label.
    @admin.display(description="")
    def export_csv_link(self, obj):
        return format_html(
            '<a class="button" href="{}" title="{}">{}</a>',
            self._admin_url("export_object_csv", args=[quote(obj.pk)]),
            _("Export this %(name)s to CSV") % {"name": self.opts.verbose_name},
            _("Export"),
        )

    def changelist_view(self, request, extra_context=None):
        export_url = self._admin_url("export_csv")
        query = request.GET.urlencode()
        return super().changelist_view(
            request,
            {
                **(extra_context or {}),
                # Carrying the changelist's own query string over is what makes
                # the button export the list the admin is looking at.
                "export_csv_url": f"{export_url}?{query}" if query else export_url,
            },
        )

    def change_view(self, request, object_id, form_url="", extra_context=None):
        return super().change_view(
            request,
            object_id,
            form_url,
            {
                **(extra_context or {}),
                "export_csv_url": self._admin_url(
                    "export_object_csv", args=[quote(unquote(object_id))]
                ),
            },
        )

    # -- the ways in -------------------------------------------------------

    def export_object_csv_view(self, request, object_id):
        obj = self.get_object(request, unquote(object_id))
        if obj is None:
            raise Http404(
                f"No {self.opts.verbose_name} with the key {object_id!r} exists."
            )
        if not self.has_view_permission(request, obj):
            raise PermissionDenied

        # Back through the admin's own queryset rather than straight off the
        # manager, so an admin whose list is scoped exports from the same scope.
        queryset = self.get_queryset(request).filter(pk=obj.pk)
        return self.export_to_csv(
            request, queryset, filename=self.get_export_filename(request, obj)
        )

    def export_csv_view(self, request):
        if not self.has_view_permission(request):
            raise PermissionDenied

        try:
            changelist = self.get_changelist_instance(request)
        except IncorrectLookupParameters:
            self.message_user(
                request,
                _("Nothing was exported: those filters could not be read."),
                messages.ERROR,
            )
            return HttpResponseRedirect(self._admin_url("changelist"))

        return self.export_to_csv(request, changelist.get_queryset(request))

    @admin.action(
        description=_("Export selected %(verbose_name_plural)s to CSV"),
        permissions=["view"],
    )
    def export_selected_csv(self, request, queryset):
        return self.export_to_csv(request, queryset)

    # -- the export itself -------------------------------------------------

    def export_to_csv(self, request, queryset, filename=None):
        fields = self.get_export_fields(request)
        headers = [str(header) for header, _accessor in fields]
        accessors = [accessor for _header, accessor in fields]
        queryset = self.get_export_queryset(request, queryset)

        rows = (
            [format_cell(resolve_value(self, obj, accessor)) for accessor in accessors]
            for obj in queryset.iterator(chunk_size=self.export_chunk_size)
        )

        response = StreamingHttpResponse(
            _csv_lines(headers, rows), content_type="text/csv; charset=utf-8"
        )
        response["Content-Disposition"] = (
            f'attachment; filename="{filename or self.get_export_filename(request)}"'
        )
        return response
