"""Import every model here so Base.metadata knows all tables (used by Alembic and tests)."""
from app.models.appointment import Appointment, AppointmentStatus, AvailabilitySlot
from app.models.assessment import Assessment, AssessmentType
from app.models.checkin import AnswerType, CheckinAnswer, CheckinMetric, CheckinQuestion
from app.models.chat import AlertSource, AlertStatus, ChatMessage, ChatSender, CrisisAlert, RiskLevel
from app.models.resource import Resource, ResourceType
from app.models.user import CounsellorProfile, StudentProfile, User, UserRole
from app.models.wellbeing import WellbeingEntry
