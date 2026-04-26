from rest_framework import serializers
from django.contrib.auth import get_user_model
from resources.models import Faculty, Programme, Course, Resource, Rating, Review, Engagement

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'password', 'first_name', 'last_name', 'year_of_study', 'role', 'is_verified_contributor', 'date_joined', 'faculty', 'programme', 'courses')
        read_only_fields = ('id', 'is_verified_contributor', 'date_joined', 'role')

    def validate_email(self, value):
        domain = value.split('@')[-1].lower()
        if domain != 'ub.ac.bw':
            raise serializers.ValidationError('Registration requires a valid university email address (@ub.ac.bw).')
        return value

    def validate_password(self, value):
        import re
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        if not re.search(r"\d", value):
            raise serializers.ValidationError("Password must contain at least one number.")
        if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]", value):
            raise serializers.ValidationError("Password must contain at least one special character.")
        return value

    def create(self, validated_data):
        courses = validated_data.pop('courses', [])
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            year_of_study=validated_data.get('year_of_study'),
            faculty=validated_data.get('faculty'),
            programme=validated_data.get('programme')
        )
        user.courses.set(courses)
        
        # MAILHOG INTEGRATION: Send Verification Email Hook
        try:
            from django.core.mail import send_mail
            from django.core.signing import TimestampSigner
            
            signer = TimestampSigner()
            token = signer.sign(str(user.id))
            
            verification_url = f"http://localhost:5173/verify?id={user.id}&token={token}"
            
            send_mail(
                subject='Welcome to AcademicHub! Verify your account.',
                message=f'Hello {user.first_name},\n\nPlease click the following link to verify your university credentials:\n{verification_url}\n\nThanks,\nThe AcademicHub Team',
                from_email='noreply@academic-resources.test',
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            # We fail silently in development if SMTP isn't running, but log it
            print(f"Failed to send email to {user.email}: {e}")
            
        return user


# --- Academic Structure Serializers ---

class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = '__all__'

class ProgrammeSerializer(serializers.ModelSerializer):
    faculty_name = serializers.ReadOnlyField(source='faculty.name')

    class Meta:
        model = Programme
        fields = '__all__'

class CourseSerializer(serializers.ModelSerializer):
    programme_name = serializers.ReadOnlyField(source='programme.name')

    class Meta:
        model = Course
        fields = '__all__'

# --- Resource and Interaction Serializers ---

class RatingSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = Rating
        fields = '__all__'
        read_only_fields = ('user', 'resource', 'created_at', 'updated_at')

class ReviewSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ('user', 'resource', 'created_at', 'updated_at')

class ResourceListSerializer(serializers.ModelSerializer):
    uploader_email = serializers.ReadOnlyField(source='uploader.email')
    uploader_name = serializers.SerializerMethodField()
    is_verified_contributor = serializers.ReadOnlyField(source='uploader.is_verified_contributor')
    course_code = serializers.ReadOnlyField(source='course.code')
    course_name = serializers.ReadOnlyField(source='course.name')
    tags = serializers.SlugRelatedField(many=True, read_only=True, slug_field='name')

    # Utilizing the denormalized database columns
    rating_count = serializers.ReadOnlyField()
    average_rating = serializers.ReadOnlyField()
    
    user_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()

    def get_user_rating(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            rating = Rating.objects.filter(resource=obj, user=request.user).first()
            if rating:
                return rating.value
        return None
        
    def get_reviews_count(self, obj):
        return Review.objects.filter(resource=obj).count()

    def get_uploader_name(self, obj):
        if obj.uploader:
            name = f"{obj.uploader.first_name} {obj.uploader.last_name}".strip()
            return name if name else obj.uploader.email
        return "Unknown"

    class Meta:
        model = Resource
        exclude = ('file_url', 'video_link') # Minimal data for lists
        

class ResourceDetailSerializer(serializers.ModelSerializer):
    uploader_email = serializers.ReadOnlyField(source='uploader.email')
    ratings = RatingSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    
    course_id = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all(), source='course', write_only=True)
    course = CourseSerializer(read_only=True)

    class Meta:
        model = Resource
        fields = '__all__'
        read_only_fields = ('uploader', 'upload_date', 'cached_score', 'status', 'view_count', 'download_count', 'average_rating', 'rating_count', 'last_engagement_at', 'score_updated_at')

    def validate_file_url(self, file):
        import magic
        import uuid
        import os

        ALLOWED_MIME_TYPES = {
            'application/pdf', 'image/jpeg', 'image/png',
            'image/gif', 'image/webp'
        }
        
        # Read the first 2048 bytes to identify file type definitively
        file_header = file.read(2048)
        file.seek(0)
        
        mime = magic.from_buffer(file_header, mime=True)
        if mime not in ALLOWED_MIME_TYPES:
            raise serializers.ValidationError(f'File type {mime} is not allowed.')
        
        # Obfuscate uploaded name to prevent IDOR scanning and execution
        ext = os.path.splitext(file.name)[1]
        file.name = f"{uuid.uuid4()}{ext}"
        
        # Note: In a complete implementation, original filename would be saved to FileMetadata post-save
        
        return file


class EngagementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Engagement
        fields = '__all__'
        read_only_fields = ('user', 'timestamp')
