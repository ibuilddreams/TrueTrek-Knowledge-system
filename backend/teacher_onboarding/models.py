from django.conf import settings
from django.db import models

from common.models import BaseModel


class TeacherOnboarding(BaseModel):
    """One teacher's application to teach on the platform, reviewed by an admin.

    **A row existing is what makes an account need vetting.** Teachers an admin
    created directly (`users.CreateTeacherSerializer`), invited
    (`users.invitations`) or seeded have no row and are treated as already
    vouched for, which is why adding this feature can't lock anybody who was
    already teaching out of their own courses. `users.SignupSerializer` creates
    the row for a teacher who signed themselves up, so the public form can
    never be a way round the review.

    The submitted details are stored here rather than written straight onto
    `instructors.InstructorProfile` / `users.UserProfile`, even though several
    of them have a home there, because an application is a *snapshot an admin
    judged*: a teacher editing their public profile a month later must not
    rewrite the thing that was approved. `services.apply_to_profiles` copies
    the approved values across once, at approval, so the public profile starts
    out filled in.
    """

    class ApplicationStatus(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SUBMITTED = "SUBMITTED", "Submitted"
        UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
        CHANGES_REQUESTED = "CHANGES_REQUESTED", "Changes Requested"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    class Step(models.TextChoices):
        PROFILE = "PROFILE", "Profile"
        EXPERTISE = "EXPERTISE", "Expertise"
        CREDENTIALS = "CREDENTIALS", "Credentials"
        VIDEO = "VIDEO", "Intro Video"
        REVIEW = "REVIEW", "Review & Submit"

    class Qualification(models.TextChoices):
        HIGH_SCHOOL = "HIGH_SCHOOL", "High School Diploma"
        ASSOCIATE = "ASSOCIATE", "Associate Degree"
        BACHELORS = "BACHELORS", "Bachelor's Degree"
        MASTERS = "MASTERS", "Master's Degree"
        DOCTORATE = "DOCTORATE", "Doctorate"
        PROFESSIONAL = "PROFESSIONAL", "Professional Qualification"
        OTHER = "OTHER", "Other"

    #: Statuses in which the teacher still owns the application and may edit it.
    EDITABLE_STATUSES = (ApplicationStatus.DRAFT, ApplicationStatus.CHANGES_REQUESTED)
    #: Statuses that are sitting in the admin's queue.
    QUEUED_STATUSES = (ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW)

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="teacher_onboarding",
        limit_choices_to={"role": "TEACHER"},
    )
    status = models.CharField(
        max_length=20, choices=ApplicationStatus.choices, default=ApplicationStatus.DRAFT
    )
    # Where the teacher had got to in the wizard, so closing the browser and
    # signing in again resumes rather than restarts — the same reason
    # `onboarding.OnboardingProgress.step` exists for students.
    step = models.CharField(max_length=20, choices=Step.choices, default=Step.PROFILE)

    # --- Step 1: professional profile ---
    headline = models.CharField(max_length=120, blank=True)
    bio = models.TextField(blank=True)
    highest_qualification = models.CharField(
        max_length=20, choices=Qualification.choices, blank=True
    )
    years_of_experience = models.PositiveSmallIntegerField(null=True, blank=True)
    linkedin_url = models.URLField(blank=True)
    portfolio_url = models.URLField(blank=True)

    # --- Step 2: expertise ---
    # ["Algebra", "Public speaking", ...] — a plain list for the same reason
    # `instructors.InstructorProfile.skills` is one: nothing queries into it.
    expertise = models.JSONField(default=list, blank=True)
    teaching_statement = models.TextField(blank=True)

    # --- Step 4: intro video (step 3 is the credentials below) ---
    # Either an upload or a link to one already hosted somewhere. Both are kept
    # so a teacher who pastes a YouTube link isn't made to re-upload the file,
    # and `services.intro_video_display_url` picks whichever is set.
    intro_video = models.FileField(
        upload_to="teacher_onboarding/videos/%Y/%m/", blank=True, null=True
    )
    intro_video_name = models.CharField(max_length=255, blank=True)
    intro_video_size = models.PositiveIntegerField(null=True, blank=True)
    intro_video_url = models.URLField(blank=True)

    # --- Review ---
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_teacher_onboardings",
        limit_choices_to={"role": "ADMIN"},
    )
    # Shown to the teacher verbatim, so it is written for them to read — it is
    # the whole of what "changes requested" or "rejected" means to them.
    review_notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-submitted_at", "-created_at"]
        indexes = [models.Index(fields=["status", "-submitted_at"])]

    def __str__(self):
        return f"Teacher onboarding of {self.user} ({self.status})"

    @property
    def is_approved(self):
        return self.status == self.ApplicationStatus.APPROVED

    @property
    def is_editable(self):
        return self.status in self.EDITABLE_STATUSES

    @property
    def is_awaiting_review(self):
        return self.status in self.QUEUED_STATUSES


class TeacherCredential(BaseModel):
    """One qualification document attached to an application — a degree
    certificate, a teaching licence, a CPD certificate.

    The file is the point, so there is no "credential with no document": the
    row and the upload are created together and deleting the row is how a
    teacher removes the document.
    """

    class CredentialType(models.TextChoices):
        DEGREE = "DEGREE", "Degree"
        CERTIFICATION = "CERTIFICATION", "Certification"
        LICENSE = "LICENSE", "Teaching Licence"
        AWARD = "AWARD", "Award"
        OTHER = "OTHER", "Other"

    onboarding = models.ForeignKey(
        TeacherOnboarding, on_delete=models.CASCADE, related_name="credentials"
    )
    credential_type = models.CharField(
        max_length=20, choices=CredentialType.choices, default=CredentialType.DEGREE
    )
    title = models.CharField(max_length=200)
    institution = models.CharField(max_length=200, blank=True)
    year_awarded = models.PositiveSmallIntegerField(null=True, blank=True)
    document = models.FileField(upload_to="teacher_onboarding/credentials/%Y/%m/")
    original_name = models.CharField(max_length=255, blank=True)
    file_size = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.get_credential_type_display()}: {self.title}"
