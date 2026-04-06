from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class Faculty(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    order_index = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'faculties'
        ordering = ['order_index', 'name']
        verbose_name_plural = 'Faculties'

    def __str__(self):
        return self.name


class Programme(models.Model):
    faculty = models.ForeignKey(
        Faculty, on_delete=models.CASCADE, related_name='programmes'
    )
    name = models.CharField(max_length=255)
    order_index = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'programmes'
        ordering = ['order_index', 'name']

    def __str__(self):
        return self.name


class Course(models.Model):
    programme = models.ForeignKey(
        Programme, on_delete=models.CASCADE, related_name='courses'
    )
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=20, unique=True)
    order_index = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'courses'
        ordering = ['order_index', 'code']

    def __str__(self):
        return f'[{self.code}] {self.name}'



class Tag(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'tags'

    def __str__(self):
        return self.name


class Resource(models.Model):
    TYPE_PAST_EXAM = 'past_exam'
    TYPE_NOTES = 'notes'
    TYPE_VIDEO = 'video'
    TYPE_IMAGE = 'image'
    TYPE_TEXTBOOK = 'textbook'
    RESOURCE_TYPE_CHOICES = [
        (TYPE_PAST_EXAM, 'Past Exam'),
        (TYPE_NOTES, 'Notes'),
        (TYPE_VIDEO, 'Video'),
        (TYPE_IMAGE, 'Image'),
        (TYPE_TEXTBOOK, 'Textbook'),
    ]
    STATUS_ACTIVE = 'active'
    STATUS_REMOVED = 'removed'
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_REMOVED, 'Removed'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPE_CHOICES)
    file_url = models.FileField(upload_to='resources/', null=True, blank=True)
    video_link = models.URLField(null=True, blank=True)
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name='resources'
    )

    uploader = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='uploaded_resources'
    )
    upload_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_ACTIVE)

    # Cached counters — incremented in application logic, never computed on read
    view_count = models.PositiveIntegerField(default=0)
    download_count = models.PositiveIntegerField(default=0)

    # Denormalized rating fields — updated by background job after any rating change
    average_rating = models.FloatField(default=0.0)
    rating_count = models.PositiveIntegerField(default=0)

    # Ranking and feed fields
    cached_score = models.FloatField(default=0.0)
    score_updated_at = models.DateTimeField(null=True, blank=True)
    last_engagement_at = models.DateTimeField(null=True, blank=True)

    tags = models.ManyToManyField(Tag, through='ResourceTag', related_name='resources', blank=True)

    class Meta:
        db_table = 'resources'
        indexes = [
            models.Index(fields=['course', 'cached_score']),
            models.Index(fields=['course', 'upload_date']),
            models.Index(fields=['cached_score']),
            models.Index(fields=['upload_date']),
            models.Index(fields=['last_engagement_at']),
            models.Index(fields=['status']),
        ]
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(file_url__isnull=False, video_link__isnull=True) |
                    models.Q(file_url__isnull=True, video_link__isnull=False)
                ),
                name='resource_exactly_one_source'
            )
        ]

    def __str__(self):
        return self.title


class ResourceTag(models.Model):
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        db_table = 'resource_tags'
        unique_together = ('resource', 'tag')


class FileMetadata(models.Model):
    resource = models.OneToOneField(
        Resource, on_delete=models.CASCADE, related_name='file_metadata'
    )
    file_size = models.PositiveIntegerField()
    file_type = models.CharField(max_length=100)
    original_filename = models.CharField(max_length=255)

    class Meta:
        db_table = 'file_metadata'

    def __str__(self):
        return f'Metadata for {self.resource.title}'


class Rating(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ratings'
    )
    resource = models.ForeignKey(
        Resource, on_delete=models.CASCADE, related_name='ratings'
    )
    value = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ratings'
        unique_together = ('user', 'resource')

    def __str__(self):
        return f'{self.user.email} rated {self.resource.title}: {self.value}'


class Review(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews'
    )
    resource = models.ForeignKey(
        Resource, on_delete=models.CASCADE, related_name='reviews'
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'reviews'

    def __str__(self):
        return f'{self.user.email} reviewed {self.resource.title}'


class Engagement(models.Model):
    ACTION_VIEW = 'view'
    ACTION_DOWNLOAD = 'download'
    ACTION_CHOICES = [
        (ACTION_VIEW, 'View'),
        (ACTION_DOWNLOAD, 'Download'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='engagements'
    )
    resource = models.ForeignKey(
        Resource, on_delete=models.CASCADE, related_name='engagements'
    )
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'engagements'
        indexes = [
            models.Index(fields=['resource', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        user_str = self.user.email if self.user else 'Anonymous'
        return f'{user_str} {self.action} {self.resource.title}'


class Report(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_RESOLVED = 'resolved'
    STATUS_DISMISSED = 'dismissed'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_RESOLVED, 'Resolved'),
        (STATUS_DISMISSED, 'Dismissed'),
    ]

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='filed_reports'
    )
    resource = models.ForeignKey(
        Resource, on_delete=models.CASCADE, related_name='reports'
    )
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_PENDING)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='resolved_reports'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'reports'

    def __str__(self):
        return f'Report on {self.resource.title} ({self.status})'


class Bookmark(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookmarks'
    )
    resource = models.ForeignKey(
        Resource, on_delete=models.CASCADE, related_name='bookmarks'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bookmarks'
        unique_together = ('user', 'resource')

    def __str__(self):
        return f'{self.user.email} bookmarked {self.resource.title}'


class RankingWeight(models.Model):
    weight_name = models.CharField(max_length=100, unique=True)
    value = models.FloatField()
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='weight_updates'
    )

    class Meta:
        db_table = 'ranking_weights'

    def __str__(self):
        return f'{self.weight_name} = {self.value}'


class AuditLog(models.Model):
    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='audit_logs'
    )
    action = models.CharField(max_length=100)
    target_type = models.CharField(max_length=100)
    target_id = models.PositiveIntegerField()
    details = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        indexes = [
            models.Index(fields=['target_type', 'target_id']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        return f'{self.action} on {self.target_type} {self.target_id}'
