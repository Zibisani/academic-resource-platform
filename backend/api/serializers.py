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


class EngagementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Engagement
        fields = '__all__'
        read_only_fields = ('user', 'timestamp')
