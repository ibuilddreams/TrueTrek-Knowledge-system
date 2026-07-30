import csv
import io

from openpyxl import Workbook, load_workbook


ALLOWED_EXTENSIONS = {".csv", ".xlsx"}
MAX_UPLOAD_SIZE_MB = 5


class ImportFileError(Exception):
    pass


def get_file_extension(filename):
    if not filename or "." not in filename:
        return ""
    return f".{filename.rsplit('.', 1)[-1].lower()}"


def validate_upload_file(uploaded_file):
    if uploaded_file is None:
        raise ImportFileError("A file is required.")

    extension = get_file_extension(uploaded_file.name)
    if extension not in ALLOWED_EXTENSIONS:
        raise ImportFileError("Only CSV and XLSX files are supported.")

    size = getattr(uploaded_file, "size", None)
    if size is not None and size > MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise ImportFileError(f"File size must not exceed {MAX_UPLOAD_SIZE_MB}MB.")

    return extension


def _normalize_header(value):
    return " ".join(str(value or "").strip().split())


def _row_to_dict(headers, values):
    row = {}
    for index, header in enumerate(headers):
        raw = values[index] if index < len(values) else ""
        if raw is None:
            raw = ""
        row[header] = str(raw).strip()
    return row


def parse_tabular_file(uploaded_file, required_headers):
    extension = validate_upload_file(uploaded_file)
    required = [_normalize_header(header) for header in required_headers]

    if extension == ".csv":
        rows = _parse_csv(uploaded_file, required)
    else:
        rows = _parse_xlsx(uploaded_file, required)

    if not rows:
        raise ImportFileError("The file has no data rows.")

    return rows


def _parse_csv(uploaded_file, required_headers):
    uploaded_file.seek(0)
    raw = uploaded_file.read()
    if isinstance(raw, bytes):
        text = raw.decode("utf-8-sig")
    else:
        text = str(raw)

    reader = csv.reader(io.StringIO(text))
    try:
        header_row = next(reader)
    except StopIteration as exc:
        raise ImportFileError("The file is empty.") from exc

    headers = [_normalize_header(cell) for cell in header_row]
    _validate_headers(headers, required_headers)

    rows = []
    for index, values in enumerate(reader, start=2):
        if not any(str(value or "").strip() for value in values):
            continue
        rows.append({"row_number": index, "data": _row_to_dict(headers, values)})
    return rows


def _parse_xlsx(uploaded_file, required_headers):
    uploaded_file.seek(0)
    workbook = load_workbook(uploaded_file, read_only=True, data_only=True)
    sheet = workbook.active
    iterator = sheet.iter_rows(values_only=True)

    try:
        header_row = next(iterator)
    except StopIteration as exc:
        raise ImportFileError("The file is empty.") from exc

    headers = [_normalize_header(cell) for cell in header_row]
    _validate_headers(headers, required_headers)

    rows = []
    for index, values in enumerate(iterator, start=2):
        values = list(values or [])
        if not any(value is not None and str(value).strip() for value in values):
            continue
        rows.append({"row_number": index, "data": _row_to_dict(headers, values)})
    return rows


def _validate_headers(headers, required_headers):
    missing = [header for header in required_headers if header not in headers]
    if missing:
        raise ImportFileError(
            f"Missing required column(s): {', '.join(missing)}. "
            f"Expected headers: {', '.join(required_headers)}."
        )


def build_sample_workbook(headers, sample_rows):
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Template"
    sheet.append(headers)
    for row in sample_rows:
        sheet.append([row.get(header, "") for header in headers])
    buffer = io.BytesIO()
    workbook.save(buffer)
    buffer.seek(0)
    return buffer


def build_sample_csv(headers, sample_rows):
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=headers)
    writer.writeheader()
    for row in sample_rows:
        writer.writerow({header: row.get(header, "") for header in headers})
    return io.BytesIO(buffer.getvalue().encode("utf-8-sig"))
