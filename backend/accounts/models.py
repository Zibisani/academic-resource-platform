from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    ROLE_STUDENT = 'student'
    ROLE_ADMIN = 'admin'
    ROLE_CHOICES = [
        (ROLE_STUDENT, 'Student'),
        (ROLE_ADMIN, 'Admin'),
    ]
    STATUS_ACTIVE = 'active'
    STATUS_DISABLED = 'disabled'
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_DISABLED, 'Disabled'),
    ]

    username = None
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=ROLE_STUDENT)
    is_email_verified = models.BooleanField(default=False)
    is_verified_contributor = models.BooleanField(default=False)
    faculty = models.ForeignKey(
        'resources.Faculty',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='students'
    )
    programme = models.ForeignKey(
        'resources.Programme',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='students'
    )
    courses = models.ManyToManyField(
        'resources.Course',
        blank=True,
        related_name='students'
    )
    year_of_study = models.PositiveSmallIntegerField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_ACTIVE)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    objects = UserManager()

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.email
