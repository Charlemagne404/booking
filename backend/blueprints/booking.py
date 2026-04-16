###########################################################################
#                                                                         #
# tullingedk/booking                                                      #
# Copyright (C) 2018 - 2020, Vilhelm Prytz, <vilhelm@prytznet.se>, et al. #
#                                                                         #
# Licensed under the terms of the GNU GPL-3.0 license, see LICENSE.       #
# https://github.com/tullingedk/booking                                   #
#                                                                         #
###########################################################################

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


def get_booking_model(seat_type):
    if seat_type == "standard":
        return Booking, NUM_SEATS

    if seat_type == "console":
        return ConsoleBooking, NUM_CONSOLE_SEATS

    abort(400, "Invalid seat_type")


def current_user_is_admin():
    return Admin.query.filter_by(email=session["google_email"]).first() is not None


def booking_picture_url(email):
    user = User.query.filter_by(email=email).first()
    return user.google_picture_url if user and user.google_picture_url else ""


def serialize_booking(booking, can_view_private, can_view_admin_fields):
    return {
        "seat": booking.seat,
        "name": booking.name if can_view_private else "Upptagen",
        "school_class": booking.school_class if can_view_private else "",
        "email": booking.email if can_view_admin_fields else None,
        "paid": booking.paid if can_view_private else None,
        "picture_url": booking_picture_url(booking.email) if can_view_private else "",
        "time_created": str(booking.time_created) if can_view_private else None,
        "time_updated": str(booking.time_updated) if can_view_private else None,
    }


def require_json_object():
    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        abort(400, "Request body must be a JSON object")

    return payload


@booking_blueprint.route("/bookings")
@google_logged_in
@user_registered
def bookings():
    standard_bookings = Booking.query.all()
    console_bookings = ConsoleBooking.query.all()
    is_admin_user = current_user_is_admin()
    current_email = session["google_email"]

    return base_req(
        response={
            "bookings": [
                serialize_booking(
                    booking,
                    can_view_private=is_admin_user or booking.email == current_email,
                    can_view_admin_fields=is_admin_user,
                )
                for booking in standard_bookings
            ],
            "console_bookings": [
                serialize_booking(
                    booking,
                    can_view_private=is_admin_user or booking.email == current_email,
                    can_view_admin_fields=is_admin_user,
                )
                for booking in console_bookings
            ],
            "num_seats": NUM_SEATS,
            "num_console_seats": NUM_CONSOLE_SEATS,
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
