"""initial schema: all tables

Revision ID: 0001
Revises:
Create Date: 2026-11-19
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# PostgreSQL enum types (create_table creates them automatically on upgrade)
user_role = sa.Enum("student", "counsellor", "admin", name="user_role")
assessment_type = sa.Enum("PHQ9", "GAD7", name="assessment_type")
chat_sender = sa.Enum("student", "bot", name="chat_sender")
risk_level = sa.Enum("none", "high", name="risk_level")
alert_source = sa.Enum("chat", "assessment", name="alert_source")
alert_status = sa.Enum("open", "seen", "closed", name="alert_status")
resource_type = sa.Enum(
    "breathing", "sleep", "article", "video", "counselling", "activity", name="resource_type"
)
appointment_status = sa.Enum(
    "requested", "confirmed", "cancelled", "completed", name="appointment_status"
)


def _id_created_at():
    """id + created_at columns that every table has."""
    return [
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    ]


def upgrade() -> None:
    op.create_table(
        "users",
        *_id_created_at(),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(150), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "student_profiles",
        *_id_created_at(),
        sa.Column(
            "user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False, unique=True,
        ),
        sa.Column("enrollment_no", sa.String(50), nullable=False),
        sa.Column("department", sa.String(100), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("consent_given", sa.Boolean(), server_default="false", nullable=False),
    )

    op.create_table(
        "counsellor_profiles",
        *_id_created_at(),
        sa.Column(
            "user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False, unique=True,
        ),
        sa.Column("qualification", sa.String(150), nullable=False),
        sa.Column("specialization", sa.String(150), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
    )

    op.create_table(
        "wellbeing_entries",
        *_id_created_at(),
        sa.Column(
            "student_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("entry_date", sa.Date(), nullable=False),
        sa.Column("mood", sa.Integer(), nullable=False),
        sa.Column("stress", sa.Integer(), nullable=False),
        sa.Column("sleep_hours", sa.Float(), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.UniqueConstraint("student_id", "entry_date", name="uq_wellbeing_student_date"),
        sa.CheckConstraint("mood BETWEEN 1 AND 5", name="ck_wellbeing_mood_range"),
        sa.CheckConstraint("stress BETWEEN 1 AND 5", name="ck_wellbeing_stress_range"),
        sa.CheckConstraint("sleep_hours BETWEEN 0 AND 24", name="ck_wellbeing_sleep_range"),
    )
    op.create_index("ix_wellbeing_entries_student_id", "wellbeing_entries", ["student_id"])

    op.create_table(
        "assessments",
        *_id_created_at(),
        sa.Column(
            "student_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("type", assessment_type, nullable=False),
        sa.Column("answers", sa.JSON(), nullable=False),
        sa.Column("total_score", sa.Integer(), nullable=False),
        sa.Column("severity_band", sa.String(30), nullable=False),
    )
    op.create_index("ix_assessments_student_id", "assessments", ["student_id"])

    op.create_table(
        "chat_messages",
        *_id_created_at(),
        sa.Column(
            "student_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("sender", chat_sender, nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("sentiment", sa.String(20), nullable=True),
        sa.Column("emotion", sa.String(30), nullable=True),
        sa.Column("risk_level", risk_level, server_default="none", nullable=False),
    )
    op.create_index("ix_chat_messages_student_id", "chat_messages", ["student_id"])

    op.create_table(
        "crisis_alerts",
        *_id_created_at(),
        sa.Column(
            "student_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column(
            "message_id", sa.Integer(), sa.ForeignKey("chat_messages.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("source", alert_source, nullable=False),
        sa.Column("matched_rule", sa.String(100), nullable=False),
        sa.Column("status", alert_status, server_default="open", nullable=False),
        sa.Column(
            "handled_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
        ),
    )
    op.create_index("ix_crisis_alerts_student_id", "crisis_alerts", ["student_id"])

    op.create_table(
        "resources",
        *_id_created_at(),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("type", resource_type, nullable=False),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("url", sa.String(500), nullable=True),
        sa.Column("tags", postgresql.ARRAY(sa.String()), server_default="{}", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
    )

    op.create_table(
        "availability_slots",
        *_id_created_at(),
        sa.Column(
            "counsellor_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_booked", sa.Boolean(), server_default="false", nullable=False),
    )
    op.create_index("ix_availability_slots_counsellor_id", "availability_slots", ["counsellor_id"])

    op.create_table(
        "appointments",
        *_id_created_at(),
        sa.Column(
            "student_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column(
            "counsellor_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "slot_id", sa.Integer(), sa.ForeignKey("availability_slots.id", ondelete="CASCADE"),
            nullable=False, unique=True,
        ),
        sa.Column("status", appointment_status, server_default="requested", nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("counsellor_notes", sa.Text(), nullable=True),
    )
    op.create_index("ix_appointments_student_id", "appointments", ["student_id"])
    op.create_index("ix_appointments_counsellor_id", "appointments", ["counsellor_id"])


def downgrade() -> None:
    # Drop in reverse order of foreign-key dependencies
    for table in [
        "appointments", "availability_slots", "resources", "crisis_alerts", "chat_messages",
        "assessments", "wellbeing_entries", "counsellor_profiles", "student_profiles", "users",
    ]:
        op.drop_table(table)  # also drops that table's indexes
    # Enum types are not dropped with their tables, so drop them explicitly
    for enum_type in [
        appointment_status, resource_type, alert_status, alert_source,
        risk_level, chat_sender, assessment_type, user_role,
    ]:
        enum_type.drop(op.get_bind(), checkfirst=True)
