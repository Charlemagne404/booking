###########################################################################
#                                                                         #
# tullingedk/booking                                                      #
# Copyright (C) 2018 - 2020, Vilhelm Prytz, <vilhelm@prytznet.se>, et al. #
#                                                                         #
# Licensed under the terms of the GNU GPL-3.0 license, see LICENSE.       #
# https://github.com/tullingedk/booking                                   #
#                                                                         #
###########################################################################

from flask import abort
from string import printable
import re

ILLEGAL_CHARACTERS = ["<", ">", ";", "&", "|", "`", "$", "(", ")", "{", "}", "[", "]"]
ALLOWED_CHARACTERS = list(printable) + ["å", "ä", "ö", "Å", "Ä", "Ö"]

# Email validation regex (RFC 5322 simplified)
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')


def is_integer(i):
    try:
        int(i)
    except Exception:
        return False
    return True


def input_validation(i):
    if not isinstance(i, str):
        abort(400, "Input variable must be a string.")

    if any(x in i for x in ["\n", "\r", "\t"]):
        abort(400, "Input variable contains illegal whitespace.")

    if any(x in i for x in ILLEGAL_CHARACTERS):
        abort(
            400, "Input variable contains illegal characters (stick to the alphabet)."
        )

    if any(x not in ALLOWED_CHARACTERS for x in i):
        abort(
            400,
            "Input variable contains non-allowed characters (stick to the alphabet).",
        )

    return True


def length_validation(i, min, max, vanity=None):
    if len(i) < min:
        abort(
            400, f"{vanity} needs to be at least {min} characters long"
        ) if vanity else abort(400, f"Data too short (minimum {min})")

    if len(i) > max:
        abort(
            400, f"{vanity} cannot be longer than {max} characters"
        ) if vanity else abort(400, f"Data too long (max {max})")

    return True


def email_validation(email):
    """Validate email format"""
    if not email or not isinstance(email, str):
        abort(400, "Email must be a valid string")
    
    if len(email) > 500:
        abort(400, "Email address is too long (max 500 characters)")
    
    if not EMAIL_REGEX.match(email):
        abort(400, "Invalid email format. Please provide a valid email address.")
    
    return True


def normalize_email(email):
    """Normalize and validate email addresses before storing them."""
    if not isinstance(email, str):
        abort(400, "Email must be a valid string")

    normalized = email.strip().lower()
    email_validation(normalized)
    return normalized


def name_validation(name):
    """Validate booking name fields."""
    if not isinstance(name, str):
        abort(400, "Name must be a valid string")

    normalized = name.strip()

    if input_validation(normalized) and length_validation(
        normalized, 1, 255, vanity="Name"
    ):
        return normalized


def school_class_validation(school_class):
    """Validate and normalize school class fields."""
    if not isinstance(school_class, str):
        abort(400, "School class must be a valid string")

    normalized = school_class.strip().upper()

    if input_validation(normalized) and length_validation(
        normalized, 4, 6, vanity="School class"
    ):
        return normalized


def boolean_validation(value, vanity="Value"):
    """Require a strict JSON boolean."""
    if not isinstance(value, bool):
        abort(400, f"{vanity} must be boolean")

    return value
