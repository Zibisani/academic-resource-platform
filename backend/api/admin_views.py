from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from django.db import models
from django.db.models import Count, Q, Avg, Sum
from django.contrib.auth import get_user_model
from resources.models import Resource, Rating, Review, Engagement, Report, Faculty, Programme, Course, Module, Topic, RankingWeight, AuditLog
from .permissions import IsAdmin
from .admin_serializers import (
    AdminUserListSerializer, AdminUserDetailSerializer, AdminUserCreateUpdateSerializer,
    AdminResourceListSerializer, AdminResourceDetailSerializer, AdminReviewSerializer,
    AdminReportSerializer, AdminRankingWeightSerializer, AdminAuditLogSerializer,
    ModuleSerializer, TopicSerializer
)

User = get_user_model()

def log_audit(admin, action, target_type, target_id, details=""):
    AuditLog.objects.create(
        admin=admin, action=action, target_type=target_type, target_id=str(target_id), details=details
    )

class AdminUserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    filter_backends = [filters.SearchFilter]
    search_fields = ['email', 'first_name', 'last_name']

    def get_queryset(self):
        qs = User.objects.all().order_by('-date_joined')
        role = self.request.query_params.get('role')
        if role: qs = qs.filter(role=role)
        status_q = self.request.query_params.get('status')
        if status_q: qs = qs.filter(status=status_q)
        verified = self.request.query_params.get('is_verified_contributor')
        if verified is not None: qs = qs.filter(is_verified_contributor=verified.lower() == 'true')
        return qs

    def get_serializer_class(self):
        if self.action == 'list': return AdminUserListSerializer
        if self.action in ['create', 'update', 'partial_update']: return AdminUserCreateUpdateSerializer
        return AdminUserDetailSerializer

    def perform_create(self, serializer):
        user = serializer.save(is_email_verified=True, must_change_password=True)
        password = self.request.data.get('password')
        if password:
            user.set_password(password)
            user.save()
            
            # Send email to the user so they know their account exists
            from django.core.mail import send_mail
            import os
            frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
            send_mail(
                'Welcome to AcademicHub',
                f'Your account has been created by an administrator. Please log in at {frontend_url}/login with your email and this temporary password: {password}\nYou will be required to change it upon your first login.',
                'noreply@academichub.edu',
                [user.email],
                fail_silently=False,
            )
            
        log_audit(self.request.user, 'user_created', 'User', user.id, f"Created {user.role} {user.email}")

    def perform_update(self, serializer):
        user = self.get_object()
        old_verified = user.is_verified_contributor
        updated_user = serializer.save()
        
        if old_verified != updated_user.is_verified_contributor:
            Resource.objects.filter(uploader=updated_user).update(score_updated_at=None)

        if updated_user.status == User.STATUS_DISABLED and updated_user.is_active:
            updated_user.is_active = False
            updated_user.save(update_fields=['is_active'])
        elif updated_user.status == User.STATUS_ACTIVE and not updated_user.is_active:
            updated_user.is_active = True
            updated_user.save(update_fields=['is_active'])
            
        log_audit(self.request.user, 'user_updated', 'User', user.id, "Updated fields")

    def perform_destroy(self, instance):
        instance.status = User.STATUS_DISABLED
        instance.is_active = False
        instance.save(update_fields=['status', 'is_active'])
        log_audit(self.request.user, 'user_deleted', 'User', instance.id, "Soft deleted user")

    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        user = self.get_object()
        temp_pass = request.data.get('temporary_password')
        if temp_pass:
            user.set_password(temp_pass)
            user.must_change_password = True
            user.save()
            log_audit(request.user, 'password_reset_triggered', 'User', user.id, "Set temporary password")
            return Response({'detail': 'Temporary password set'})
        
        from accounts.models import PasswordResetToken
        from django.core.mail import send_mail
        import hashlib, secrets, os
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        PasswordResetToken.objects.create(
            user=user, token_hash=token_hash, expires_at=timezone.now() + timedelta(minutes=60)
        )
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
        reset_link = f"{frontend_url}/reset-password?token={raw_token}&email={user.email}"
        
        send_mail(
            'Password Reset - AcademicHub',
            f'An administrator has requested a password reset for your account. Please click the link to reset it: {reset_link}\n\nIf you did not request this, please contact support.',
            'noreply@academichub.edu',
            [user.email],
            fail_silently=False,
        )
        
        print(f"[Admin] Password reset link text generated: {reset_link}")
        log_audit(request.user, 'password_reset_triggered', 'User', user.id, "Sent reset email link")
        return Response({'detail': 'Reset email sent'})

class AdminResourceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title']

    def get_queryset(self):
        qs = Resource.objects.all().order_by('-upload_date')
        status_filter = self.request.query_params.get('status')
        if status_filter: qs = qs.filter(status=status_filter)
        module = self.request.query_params.get('module_id')
        if module: qs = qs.filter(module_id=module)
        rtype = self.request.query_params.get('resource_type')
        if rtype: qs = qs.filter(resource_type=rtype)
        staff_pick = self.request.query_params.get('is_staff_pick')
        if staff_pick is not None: qs = qs.filter(is_staff_pick=staff_pick.lower() == 'true')
        return qs

    def get_serializer_class(self):
        if self.action == 'list': return AdminResourceListSerializer
        return AdminResourceDetailSerializer

    def perform_update(self, serializer):
        res = self.get_object()
        old_staff = res.is_staff_pick
        
        status_req = self.request.data.get('status')
        is_staff_req = self.request.data.get('is_staff_pick')

        updated = serializer.save()

        if is_staff_req is not None and str(is_staff_req).lower() == 'true' and not old_staff:
            updated.is_staff_pick = True
            updated.staff_pick_added_at = timezone.now()
            updated.staff_pick_added_by = self.request.user
            updated.save()
            log_audit(self.request.user, 'staff_pick_added', 'Resource', updated.id, updated.title)
        elif is_staff_req is not None and str(is_staff_req).lower() == 'false' and old_staff:
            updated.is_staff_pick = False
            updated.staff_pick_added_at = None
            updated.staff_pick_added_by = None
            updated.save()
            log_audit(self.request.user, 'staff_pick_removed', 'Resource', updated.id, updated.title)
            
        if status_req == Resource.STATUS_REMOVED and res.status != Resource.STATUS_REMOVED:
            log_audit(self.request.user, 'resource_removed', 'Resource', updated.id, updated.title)

    def perform_destroy(self, instance):
        title = instance.title
        instance.delete()
        log_audit(self.request.user, 'resource_deleted', 'Resource', instance.id, f"Hard deleted: {title}")

class AdminReviewViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    queryset = Review.objects.all().order_by('-created_at')
    serializer_class = AdminReviewSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['content']

    def get_queryset(self):
        qs = super().get_queryset()
        r_id = self.request.query_params.get('resource_id')
        if r_id: qs = qs.filter(resource_id=r_id)
        u_id = self.request.query_params.get('user_id')
        if u_id: qs = qs.filter(user_id=u_id)
        return qs

    def perform_destroy(self, instance):
        snippet = instance.content[:30]
        instance.delete()
        log_audit(self.request.user, 'review_deleted', 'Review', instance.id, f"Deleted review: '{snippet}'")

class AdminReportViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    serializer_class = AdminReportSerializer

    def get_queryset(self):
        qs = Report.objects.all().order_by(
            models.Case(models.When(status=Report.STATUS_PENDING, then=0), default=1),
            '-created_at'
        )
        st = self.request.query_params.get('status')
        if st: qs = qs.filter(status=st)
        return qs

    @action(detail=True, methods=['patch'])
    def resolve(self, request, pk=None):
        report = self.get_object()
        action_req = request.data.get('action')

        if action_req == 'remove_resource':
            report.resource.status = Resource.STATUS_REMOVED
            report.resource.save()
            report.status = Report.STATUS_RESOLVED
            log_audit(request.user, 'resource_removed_via_report', 'Resource', report.resource.id, report.resource.title)
        elif action_req == 'dismiss':
            report.status = Report.STATUS_DISMISSED
            
        report.resolved_by = request.user
        report.resolved_at = timezone.now()
        report.save()
        log_audit(request.user, 'report_resolved', 'Report', report.id, action_req)
        return Response(self.get_serializer(report).data)

from resources.models import Faculty, Programme, Course
from api.serializers import FacultySerializer, ProgrammeSerializer, CourseSerializer

class BaseHierarchyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    
    def get_cascade_count(self, instance):
        return 0

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        confirm = request.query_params.get('confirm', 'false').lower() == 'true'
        
        cascade = self.get_cascade_count(instance)
        if not confirm:
            return Response({'detail': 'Requires confirmation', 'cascade_count': cascade}, status=428)
            
        log_audit(request.user, f'{self.basename}_deleted', self.basename.capitalize(), instance.id, f"Deleted {getattr(instance, 'name', '')} with cascade {cascade}")
        return super().destroy(request, *args, **kwargs)

class AdminFacultyViewSet(BaseHierarchyViewSet):
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer
    basename = 'faculty'
    def get_cascade_count(self, inst): return inst.programmes.count()

class AdminProgrammeViewSet(BaseHierarchyViewSet):
    queryset = Programme.objects.all()
    serializer_class = ProgrammeSerializer
    basename = 'programme'
    def get_cascade_count(self, inst): return inst.courses.count()

class AdminCourseViewSet(BaseHierarchyViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    basename = 'course'
    def get_cascade_count(self, inst): return inst.modules.count()

class AdminModuleViewSet(BaseHierarchyViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    basename = 'module'
    def get_cascade_count(self, inst): return inst.resources.count()
    
    def perform_destroy(self, instance):
        for r in instance.resources.all():
            log_audit(self.request.user, 'resource_deleted_cascade', 'Resource', r.id, r.title)
        instance.delete()

class AdminTopicViewSet(BaseHierarchyViewSet):
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer
    basename = 'topic'

class AdminWeightsViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    queryset = RankingWeight.objects.all()
    serializer_class = AdminRankingWeightSerializer
    
    def perform_update(self, serializer):
        old_val = self.get_object().value
        inst = serializer.save(updated_by=self.request.user)
        log_audit(self.request.user, 'weight_updated', 'Weight', inst.id, f"{inst.weight_name}: {old_val} -> {inst.value}")

class AdminAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdmin]
    serializer_class = AdminAuditLogSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['admin__first_name', 'admin__last_name']
    
    def get_queryset(self):
        qs = AuditLog.objects.all().order_by('-timestamp')
        adm = self.request.query_params.get('admin_id')
        if adm: qs = qs.filter(admin_id=adm)
        act = self.request.query_params.get('action')
        if act: qs = qs.filter(action=act)
        ttyp = self.request.query_params.get('target_type')
        if ttyp: qs = qs.filter(target_type=ttyp)
        return qs

from rest_framework.views import APIView

class AdminAnalyticsView(APIView):
    permission_classes = [IsAdmin]
    
    def get(self, request):
        now = timezone.now()
        thirty_ago = now - timedelta(days=30)
        
        data = {
            'resources_total': Resource.objects.count(),
            'users_total': User.objects.count(),
            'pending_reports': Report.objects.filter(status=Report.STATUS_PENDING).count(),
            'downloads_30d': Engagement.objects.filter(action=Engagement.ACTION_DOWNLOAD, timestamp__gte=thirty_ago).count(),
        }
        
        # Line charts grouped by day
        from django.db.models.functions import TruncDate
        from django.db.models import Count
        resources_per_day = list(Resource.objects.filter(upload_date__gte=thirty_ago)
            .annotate(date=TruncDate('upload_date'))
            .values('date').annotate(count=Count('id')).order_by('date'))
        
        engagements_per_day = list(Engagement.objects.filter(timestamp__gte=thirty_ago)
            .annotate(date=TruncDate('timestamp'))
            .values('date').annotate(count=Count('id')).order_by('date'))
            
        data['chart_resources'] = resources_per_day
        data['chart_engagements'] = engagements_per_day

        # Tables
        data['top_downloaded'] = list(Resource.objects.order_by('-download_count')[:10].values('id', 'title', 'download_count', 'module__name'))
        data['top_rated'] = list(Resource.objects.filter(rating_count__gt=0).order_by('-average_rating')[:10].values('id', 'title', 'average_rating', 'rating_count'))
        
        uploaders = User.objects.annotate(rc_count=Count('uploaded_resources')).order_by('-rc_count')[:10]
        data['top_uploaders'] = [{'id': u.id, 'name': f"{u.first_name} {u.last_name}", 'upload_count': u.rc_count} for u in uploaders]
        
        return Response(data)

class AdminHierarchyReorderView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request):
        items = request.data.get('items', [])
        level = request.data.get('level')
        
        model_map = {'faculty': Faculty, 'programme': Programme, 'course': Course, 'module': Module, 'topic': Topic}
        ModelClass = model_map.get(level)
        if not ModelClass:
            return Response(status=400)
            
        for ix, item in enumerate(items):
            ModelClass.objects.filter(id=item['id']).update(order_index=item.get('order_index', ix))
            
        log_audit(request.user, 'hierarchy_reordered', level.capitalize(), 0, f"Reordered {len(items)} items")
        return Response({'status': 'ok'})
