from rest_framework import serializers
from django.contrib.auth import get_user_model
from resources.models import Resource, Rating, Review, Engagement, Report, Faculty, Programme, Course, Module, Topic, RankingWeight, AuditLog

User = get_user_model()

class ModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = '__all__'

class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = '__all__'

class AdminUserListSerializer(serializers.ModelSerializer):
    programme_name = serializers.ReadOnlyField(source='programme.name')
    upload_count = serializers.SerializerMethodField()
    average_rating_of_uploads = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role', 'status', 
            'is_verified_contributor', 'programme_name', 'year_of_study', 
            'date_joined', 'upload_count', 'average_rating_of_uploads'
        ]

    def get_upload_count(self, obj):
        return Resource.objects.filter(uploader=obj).count()

    def get_average_rating_of_uploads(self, obj):
        from django.db.models import Avg
        aggs = Resource.objects.filter(uploader=obj).aggregate(Avg('average_rating'))
        return aggs['average_rating__avg'] or 0.0

class AdminUserDetailSerializer(AdminUserListSerializer):
    recent_ratings = serializers.SerializerMethodField()

    class Meta(AdminUserListSerializer.Meta):
        fields = AdminUserListSerializer.Meta.fields + ['recent_ratings', 'faculty', 'programme']

    def get_recent_ratings(self, obj):
        ratings = Rating.objects.filter(user=obj).order_by('-created_at')[:5]
        return [{'resource_id': r.resource_id, 'value': r.value, 'date': r.created_at} for r in ratings]

class AdminUserCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'role', 'status', 'is_verified_contributor', 'year_of_study', 'programme', 'password']
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

class AdminResourceListSerializer(serializers.ModelSerializer):
    uploader_name = serializers.SerializerMethodField()
    module_name = serializers.ReadOnlyField(source='module.name')
    course_name = serializers.ReadOnlyField(source='course.name')
    report_count = serializers.SerializerMethodField()

    class Meta:
        model = Resource
        fields = [
            'id', 'title', 'resource_type', 'status', 'is_staff_pick', 
            'uploader_name', 'upload_date', 'module_name', 'course_name', 
            'average_rating', 'download_count', 'report_count'
        ]

    def get_uploader_name(self, obj):
        if obj.uploader:
            return f"{obj.uploader.first_name} {obj.uploader.last_name}".strip() or obj.uploader.email
        return "Unknown"

    def get_report_count(self, obj):
        return Report.objects.filter(resource=obj, status=Report.STATUS_PENDING).count()

class AdminResourceDetailSerializer(serializers.ModelSerializer):
    uploader_name = serializers.SerializerMethodField()
    reports = serializers.SerializerMethodField()
    
    class Meta:
        model = Resource
        fields = '__all__'

    def get_uploader_name(self, obj):
        if obj.uploader:
            return f"{obj.uploader.first_name} {obj.uploader.last_name}".strip() or obj.uploader.email
        return "Unknown"

    def get_reports(self, obj):
        reports = Report.objects.filter(resource=obj).order_by('-created_at')
        return AdminReportSerializer(reports, many=True).data

class AdminReviewSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    resource_title = serializers.ReadOnlyField(source='resource.title')

    class Meta:
        model = Review
        fields = ['id', 'content', 'author', 'resource_title', 'created_at', 'resource']

    def get_author(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email
        return "Anonymous"

class AdminReportSerializer(serializers.ModelSerializer):
    reporter_name = serializers.SerializerMethodField()
    resource_title = serializers.ReadOnlyField(source='resource.title')
    resolved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = '__all__'

    def get_reporter_name(self, obj):
        if obj.reporter:
            return f"{obj.reporter.first_name} {obj.reporter.last_name}".strip() or obj.reporter.email
        return "Unknown"

    def get_resolved_by_name(self, obj):
        if obj.resolved_by:
            return f"{obj.resolved_by.first_name} {obj.resolved_by.last_name}".strip() or obj.resolved_by.email
        return None

class AdminRankingWeightSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = RankingWeight
        fields = '__all__'

    def get_updated_by_name(self, obj):
        if obj.updated_by:
            return f"{obj.updated_by.first_name} {obj.updated_by.last_name}".strip() or obj.updated_by.email
        return None

class AdminAuditLogSerializer(serializers.ModelSerializer):
    admin_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = '__all__'

    def get_admin_name(self, obj):
        if obj.admin:
            return f"{obj.admin.first_name} {obj.admin.last_name}".strip() or obj.admin.email
        return "System"
