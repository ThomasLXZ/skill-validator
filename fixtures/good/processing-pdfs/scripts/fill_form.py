#!/usr/bin/env python3
"""Fill a PDF form: fill_form.py input.pdf fields.json output.pdf"""
import json
import sys
from pypdf import PdfReader, PdfWriter


def main() -> int:
    if len(sys.argv) != 4:
        print("Usage: fill_form.py input.pdf fields.json output.pdf")
        return 1
    reader = PdfReader(sys.argv[1])
    writer = PdfWriter()
    writer.append(reader)
    with open(sys.argv[2]) as f:
        fields = json.load(f)
    for page in writer.pages:
        writer.update_page_form_field_values(page, fields)
    with open(sys.argv[3], "wb") as out:
        writer.write(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
