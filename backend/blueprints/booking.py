###########################################################################
#                                                                         #
# tullingedk/booking                                                      #
# Copyright (C) 2018 - 2020, Vilhelm Prytz, <vilhelm@prytznet.se>, et al. #
#                                                                         #
# Licensed under the terms of the GNU GPL-3.0 license, see LICENSE.       #
# https://github.com/tullingedk/booking                                   #
#                                                                         #
###########################################################################

from collections import Counter

from flask import session, abort, Blueprint, request, send_file
from sqlalchemy.exc import IntegrityError

from decorators.auth import google_logged_in, user_registered, is_admin
from validation import (
    is_integer,
    normalize_email,
    name_validation,
    school_class_validation,
    boolean_validation,
)
from models import db, Booking, User, ConsoleBooking, Admin
from base import base_req
from swish import generate_swish_qr

booking_blueprint = Blueprint("booking", __name__, template_folder="../templates")

NUM_SEATS = 55
NUM_CONSOLE_SEATS = 20
SEAT_TYPE_LABELS = {
    "standard": "Datorplats",
    "console": "Konsol- eller bradspelsplats",
}


def get_booking_model(seat_type):
    if seat_type == "standard":
        return Booking, NUM_SEATS

    if seat_type == "console":
        return ConsoleBooking, NUM_CONSOLE_SEATS

    abort(400, "Invalid seat_type")


def current_user_is_admin():
    return Admin.query.filter_by(email=session["google_email"]).first() is not None


def seat_type_label(seat_type):
    return SEAT_TYPE_LABELS.get(seat_type, seat_type)


def booking_status(booking, can_view_private):
    if not can_view_private:
        return "hidden"

    return "paid" if booking.paid else "unpaid"


def serialize_booking(
    booking,
    seat_type,
    current_email,
    is_admin_user,
    picture_lookup,
):
    can_view_private = is_admin_user or booking.email == current_email
    can_view_admin_fields = is_admin_user

    return {
        "seat": booking.seat,
        "name": booking.name if can_view_private else "Upptagen",
        "school_class": booking.school_class if can_view_private else "",
        "email": booking.email if can_view_admin_fields else None,
        "paid": booking.paid if can_view_private else None,
        "picture_url": picture_lookup.get(booking.email, "") if can_view_private else "",
        "time_created": str(booking.time_created) if can_view_private else None,
        "time_updated": str(booking.time_updated) if can_view_private else None,
        "seat_type": seat_type,
        "seat_type_label": seat_type_label(seat_type),
        "status": booking_status(booking, can_view_private),
        "is_owner": booking.email == current_email,
        "can_view_private": can_view_private,
        "can_view_admin_fields": can_view_admin_fields,
    }


def require_json_object():
    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        abort(400, "Request body must be a JSON object")

    return payload


def booking_sort_key(booking):
    return booking.time_updated or booking.time_created


def build_picture_lookup(standard_bookings, console_bookings):
    emails = {booking.email for booking in standard_bookings + console_bookings}

    if len(emails) == 0:
        return {}

    users = User.query.filter(User.email.in_(emails)).all()
    return {user.email: user.google_picture_url or "" for user in users}


def build_capacity_summary(bookings, total):
    booked = len(bookings)
    paid = sum(1 for booking in bookings if booking.paid)
    unpaid = booked - paid
    available = total - booked

    return {
        "total": total,
        "booked": booked,
        "available": available,
        "paid": paid,
        "unpaid": unpaid,
        "occupancy_rate": round((booked / total) * 100, 1) if total > 0 else 0,
        "payment_completion_rate": round((paid / booked) * 100, 1) if booked > 0 else 0,
    }


def serialize_my_booking(booking, seat_type):
    return {
        "seat": booking.seat,
        "seat_type": seat_type,
        "seat_type_label": seat_type_label(seat_type),
        "name": booking.name,
        "school_class": booking.school_class,
        "email": booking.email,
        "paid": booking.paid,
        "status": "paid" if booking.paid else "unpaid",
        "time_created": str(booking.time_created),
        "time_updated": str(booking.time_updated) if booking.time_updated else None,
    }


def serialize_admin_booking(booking, seat_type, picture_lookup):
    return {
        "seat": booking.seat,
        "seat_type": seat_type,
        "seat_type_label": seat_type_label(seat_type),
        "name": booking.name,
        "email": booking.email,
        "school_class": booking.school_class,
        "paid": booking.paid,
        "status": "paid" if booking.paid else "unpaid",
        "picture_url": picture_lookup.get(booking.email, ""),
        "time_created": str(booking.time_created),
        "time_updated": str(booking.time_updated) if booking.time_updated else None,
    }


def build_admin_insights(standard_bookings, console_bookings, picture_lookup):
    combined = [("standard", booking) for booking in standard_bookings] + [
        ("console", booking) for booking in console_bookings
    ]

    unpaid_bookings = [
        serialize_admin_booking(booking, seat_type, picture_lookup)
        for seat_type, booking in sorted(
            (item for item in combined if not item[1].paid),
            key=lambda item: booking_sort_key(item[1]),
        )
    ]

    recent_activity = [
        serialize_admin_booking(booking, seat_type, picture_lookup)
        for seat_type, booking in sorted(
            combined,
            key=lambda item: booking_sort_key(item[1]),
            reverse=True,
        )[:8]
    ]

    class_breakdown = [
        {"school_class": school_class, "count": count}
        for school_class, count in Counter(
            booking.school_class for _, booking in combined
        ).most_common()
    ]

    return {
        "unpaid_bookings": unpaid_bookings,
        "recent_activity": recent_activity,
        "class_breakdown": class_breakdown,
        "unique_classes": len(class_breakdown),
    }


@booking_blueprint.route("/bookings")
@google_logged_in
@user_registered
def bookings():
    standard_bookings = Booking.query.all()
    console_bookings = ConsoleBooking.query.all()
    is_admin_user = current_user_is_admin()
    current_email = session["google_email"]
    picture_lookup = build_picture_lookup(standard_bookings, console_bookings)
    my_bookings = []

    for seat_type, booking_list in (
        ("standard", standard_bookings),
        ("console", console_bookings),
    ):
        user_booking = next(
            (booking for booking in booking_list if booking.email == current_email),
            None,
        )

        if user_booking:
            my_bookings.append(serialize_my_booking(user_booking, seat_type))

    summary = {
        "standard": build_capacity_summary(standard_bookings, NUM_SEATS),
        "console": build_capacity_summary(console_bookings, NUM_CONSOLE_SEATS),
    }
    summary["overall"] = build_capacity_summary(
        standard_bookings + console_bookings,
        NUM_SEATS + NUM_CONSOLE_SEATS,
    )

    return base_req(
        response={
            "bookings": [
                serialize_booking(
                    booking,
                    seat_type="standard",
                    current_email=current_email,
                    is_admin_user=is_admin_user,
                    picture_lookup=picture_lookup,
                )
                for booking in standard_bookings
            ],
            "console_bookings": [
                serialize_booking(
                    booking,
                    seat_type="console",
                    current_email=current_email,
                    is_admin_user=is_admin_user,
                    picture_lookup=picture_lookup,
                )
                for booking in console_bookings
            ],
            "num_seats": NUM_SEATS,
            "num_console_seats": NUM_CONSOLE_SEATS,
            "summary": summary,
            "my_bookings": my_bookings,
            "admin_insights": build_admin_insights(
                standard_bookings,
                console_bookings,
                picture_lookup,
            )
            if is_admin_user
            else None,
        }
    )


@booking_blueprint.route("/<id>", methods=["PUT", "DELETE"])
@google_logged_in
@user_registered
@is_admin
def modify(id):
    if not is_integer(id):
        abort(400, "Booking id must be integer")

    payload = require_json_object()
    seat_type = payload["seat_type"] if "seat_type" in payload else None
    model, seat_max = get_booking_model(seat_type)
    booking = model.query.get(int(id))

    if not booking:
        abort(404, "Booking does not exist")

    if request.method == "DELETE":
        db.session.delete(booking)

        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            abort(400, "Unable to delete booking")

        return base_req()

    allowed_fields = {"paid", "seat", "name", "email", "school_class", "seat_type"}
    unknown_fields = set(payload.keys()) - allowed_fields

    if unknown_fields:
        abort(400, f"Unknown fields in request: {', '.join(sorted(unknown_fields))}")

    if len(set(payload.keys()) - {"seat_type"}) == 0:
        abort(400, "No editable fields provided")

    if "paid" in payload:
        booking.paid = boolean_validation(payload["paid"], vanity="paid")

    if "name" in payload:
        booking.name = name_validation(payload["name"])

    if "email" in payload:
        normalized_email = normalize_email(payload["email"])
        existing_email_booking = model.query.filter_by(email=normalized_email).first()

        if existing_email_booking and existing_email_booking.seat != booking.seat:
            abort(400, "Email already has a booking for this seat type")

        booking.email = normalized_email

    if "school_class" in payload:
        booking.school_class = school_class_validation(payload["school_class"])

    if "seat" in payload:
        seat = payload["seat"]

        if not is_integer(seat):
            abort(400, "Seat must be integer")

        seat = int(seat)

        if seat < 1 or seat > seat_max:
            abort(400, f"Seat must be in range 1 - {seat_max}")

        existing_seat_booking = model.query.get(seat)

        if existing_seat_booking and existing_seat_booking.seat != booking.seat:
            abort(400, "Seat already booked.")

        booking.seat = seat

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        abort(400, "Booking update conflicts with an existing booking")

    return base_req()


@booking_blueprint.route("/available")
@google_logged_in
@user_registered
def available():
    return base_req(
        response={
            "available_seats": [
                i for i in range(1, NUM_SEATS + 1) if not Booking.query.get(i)
            ],
            "available_console_seats": [
                i
                for i in range(1, NUM_CONSOLE_SEATS + 1)
                if not ConsoleBooking.query.get(i)
            ],
        }
    )


@booking_blueprint.route("/book", methods=["POST"])
@google_logged_in
@user_registered
def book():
    payload = require_json_object()

    if "seat" not in payload:
        abort(400, "Missing key seat")

    if "seat_type" not in payload:
        abort(400, "Missing key seat_type")

    seat = payload["seat"]
    seat_type = payload["seat_type"]
    model, seat_max = get_booking_model(seat_type)

    if not is_integer(seat):
        abort(400, "Seat must be integer")

    seat = int(seat)

    if seat < 1 or seat > seat_max:
        abort(400, f"Seat must be in range 1 - {seat_max}")

    if model.query.get(seat):
        abort(400, "Seat already booked.")

    if model.query.filter_by(email=session["google_email"]).first():
        abort(
            400,
            "You have already booked a seat. Contact administrator for help with cancellation or seat movement.",
        )

    user = User.query.filter_by(email=session["google_email"]).one()

    booking = model(
        seat=seat,
        name=session["google_name"],
        email=session["google_email"],
        school_class=user.school_class,
        paid=False,
    )

    db.session.add(booking)

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        abort(400, "Seat already booked.")

    return base_req()


@booking_blueprint.route("/swish/<seat_type>/<id>")
@google_logged_in
@user_registered
def swish(seat_type, id):
    if not is_integer(id):
        abort(400, "Id must be integer")

    model, _ = get_booking_model(seat_type)
    booking = model.query.get(int(id))

    if not booking:
        abort(404, "Booking does not exist")

    if not current_user_is_admin() and booking.email != session["google_email"]:
        abort(403, "You are not allowed to view payment details for this booking")

    buf = generate_swish_qr(
        booking.name,
        booking.school_class,
        booking.seat,
        0 if seat_type == "standard" else 1,
    )
    return send_file(buf, mimetype="image/png")
