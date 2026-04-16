###########################################################################
#                                                                         #
# tullingedk/booking                                                      #
# Copyright (C) 2018 - 2020, Vilhelm Prytz, <vilhelm@prytznet.se>, et al. #
#                                                                         #
# Licensed under the terms of the GNU GPL-3.0 license, see LICENSE.       #
# https://github.com/tullingedk/booking                                   #
#                                                                         #
###########################################################################

from flask import Blueprint, request, abort
from sqlalchemy.exc import IntegrityError

from dataclasses import asdict

from decorators.auth import google_logged_in, user_registered, is_admin
from models import db, Admin, User, Booking, ConsoleBooking
from base import base_req
from validation import normalize_email, school_class_validation

admin_blueprint = Blueprint("admin", __name__, template_folder="../templates")


def get_json_payload():
    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        abort(400, "Request body must be a JSON object")

    return payload


@admin_blueprint.route("/admin", methods=["POST", "GET", "DELETE"])
@google_logged_in
@user_registered
@is_admin
def admin():
    if request.method == "GET":
        return base_req(response=[asdict(admin) for admin in Admin.query.all()])

    payload = get_json_payload()

    if "email" not in payload:
        abort(400, "Missing key email")

    email = normalize_email(payload["email"])

    if request.method == "POST":
        if Admin.query.filter_by(email=email).first():
            abort(400, "Admin already exists")

        admin = Admin(email=email)

        db.session.add(admin)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            abort(400, "Unable to create admin")

        return base_req()

    if request.method == "DELETE":
        admin = Admin.query.filter_by(email=email).first()

        if not admin:
            abort(404, "Admin with specified email does not exist")

        db.session.delete(admin)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            abort(400, "Unable to delete admin")

        return base_req()


@admin_blueprint.route("/user", methods=["POST", "GET", "DELETE"])
@google_logged_in
@user_registered
@is_admin
def user():
    if request.method == "GET":
        return base_req(response=[asdict(user) for user in User.query.all()])

    payload = get_json_payload()

    if "email" not in payload:
        abort(400, "Missing key email")

    email = normalize_email(payload["email"])

    if request.method == "POST":
        if "school_class" not in payload:
            abort(400, "Missing key school_class")

        school_class = school_class_validation(payload["school_class"])

        if User.query.filter_by(email=email).first():
            abort(400, "User already registered.")

        user = User(email=email, school_class=school_class)

        db.session.add(user)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            abort(400, "Unable to create user")

        return base_req(
            message="user registered",
            response={
                "email": email,
                "school_class": school_class,
            },
        )

    if request.method == "DELETE":
        user = User.query.filter_by(email=email).first()

        if not user:
            abort(404, "User with specified email does not exist")

        if Admin.query.filter_by(email=email).first():
            abort(400, "Remove admin access before deleting this user")

        if Booking.query.filter_by(email=email).first() or ConsoleBooking.query.filter_by(
            email=email
        ).first():
            abort(400, "Cannot delete user with active bookings")

        db.session.delete(user)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            abort(400, "Unable to delete user")

        return base_req()

    abort(501, f"{request.method} on this method not yet supported")
