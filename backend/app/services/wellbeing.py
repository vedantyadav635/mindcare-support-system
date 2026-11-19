"""Trend data for the wellbeing charts. Uses only mood, stress and sleep_hours of wellbeing_entries."""
from datetime import date, timedelta

from sqlalchemy import Date, cast, func, select
from sqlalchemy.orm import Session

from app.models import WellbeingEntry as E


def _round(value) -> float | None:
    # SQL AVG returns a Decimal (or None when there is no data)
    return round(float(value), 2) if value is not None else None


def get_trends(db: Session, student_id: int, period: str) -> dict:
    today = date.today()
    days = 7 if period == "week" else 30
    start = today - timedelta(days=days - 1)
    # Every query is limited to this student and this period
    filters = (E.student_id == student_id, E.entry_date.between(start, today))

    if period == "week":
        # One point per day; days without an entry get nulls so the chart shows a gap
        rows = db.execute(select(E.entry_date, E.mood, E.stress, E.sleep_hours).where(*filters)).all()
        by_date = {row.entry_date: row for row in rows}
        points = []
        for i in range(days):
            day = start + timedelta(days=i)
            row = by_date.get(day)
            points.append({
                "date": day,
                "mood": row.mood if row else None,
                "stress": row.stress if row else None,
                "sleep_hours": row.sleep_hours if row else None,
            })
    else:
        # One point per week (weeks start on Monday). AVG skips NULLs, so missing metrics don't count.
        week_start = cast(func.date_trunc("week", E.entry_date), Date).label("week_start")
        rows = db.execute(
            select(
                week_start,
                func.avg(E.mood).label("avg_mood"),
                func.avg(E.stress).label("avg_stress"),
                func.avg(E.sleep_hours).label("avg_sleep"),
            )
            .where(*filters)
            .group_by(week_start)
            .order_by(week_start)
        ).all()
        points = [
            {
                "week_start": row.week_start,
                "avg_mood": _round(row.avg_mood),
                "avg_stress": _round(row.avg_stress),
                "avg_sleep": _round(row.avg_sleep),
            }
            for row in rows
        ]

    summary = db.execute(
        select(
            func.avg(E.mood), func.avg(E.stress), func.avg(E.sleep_hours), func.count(E.id)
        ).where(*filters)
    ).one()

    return {
        "period": period,
        "points": points,
        "summary": {
            "avg_mood": _round(summary[0]),
            "avg_stress": _round(summary[1]),
            "avg_sleep": _round(summary[2]),
            "entries_count": summary[3],
            "streak_days": get_streak(db, student_id, today),
        },
    }


def get_streak(db: Session, student_id: int, today: date) -> int:
    """Number of consecutive days with a check-in, ending today.
    If today's check-in isn't done yet, count from yesterday so the streak isn't shown as broken."""
    # ponytail: loads all of the student's entry dates; fine for years of daily check-ins
    dates = set(db.scalars(select(E.entry_date).where(E.student_id == student_id, E.entry_date <= today)))
    day = today if today in dates else today - timedelta(days=1)
    streak = 0
    while day in dates:
        streak += 1
        day -= timedelta(days=1)
    return streak
