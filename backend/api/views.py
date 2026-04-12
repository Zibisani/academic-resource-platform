from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from resources.models import AuditLog
from .permissions import IsAdmin, IsStudent, IsOwnerOrAdmin
from resources.models import (
    Faculty, Programme, Course, 
    Resource, Rating, Review, Engagement
)
from .serializers import (
    UserSerializer, FacultySerializer, ProgrammeSerializer, 
    CourseSerializer, 
    ResourceListSerializer, ResourceDetailSerializer, 
    RatingSerializer, ReviewSerializer, EngagementSerializer
)

User = get_user_model()

class IsAdminUserOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and getattr(request.user, 'role', '') == 'admin'

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUserOrReadOnly]

    def get_permissions(self):
        if self.action == 'create': # Allow open registration
            return [permissions.AllowAny()]
        return super().get_permissions()

    @method_decorator(ratelimit(key='ip', rate='5/h', method='POST', block=True))
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    def dispatch(self, request, *args, **kwargs):
        if request.method.lower() == 'post' or request.method.lower() == 'options':
            self.authentication_classes = []
        return super().dispatch(request, *args, **kwargs)

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_destroy(self, instance):
        if instance.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own reviews.")
        instance.delete()

# --- Academic Structure Views ---

class FacultyViewSet(viewsets.ModelViewSet):
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer
    permission_classes = [IsAdminUserOrReadOnly]

class ProgrammeViewSet(viewsets.ModelViewSet):
    queryset = Programme.objects.all()
    serializer_class = ProgrammeSerializer
    permission_classes = [IsAdminUserOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['faculty__id']

    def get_queryset(self):
        queryset = Programme.objects.all()
        faculty_id = self.request.query_params.get('faculty_id')
        if faculty_id is not None:
            queryset = queryset.filter(faculty_id=faculty_id)
        return queryset

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAdminUserOrReadOnly]
    
    def get_queryset(self):
        queryset = Course.objects.all()
        programme_id = self.request.query_params.get('programme_id')
        if programme_id is not None:
            queryset = queryset.filter(programme_id=programme_id)
        return queryset

# --- Core Resource Views ---

class ResourceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsOwnerOrAdmin]

    def get_permissions(self):
        if self.action in ['trending', 'recent', 'top_rated', 'recommended', 'staff_picks']:
            return [permissions.AllowAny()]
        if self.action in ['rate', 'download', 'reviews']:
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def perform_destroy(self, instance):
        if self.request.user.role == 'admin' and instance.uploader != self.request.user:
            AuditLog.objects.create(
                admin=self.request.user,
                action='resource_removed',
                target_type='Resource',
                target_id=str(instance.id),
                details=f"Admin removed resource: {instance.title}"
            )
            instance.delete()
        else:
            # Student soft delete
            instance.status = Resource.STATUS_REMOVED
            instance.save()

    def get_queryset(self):
        queryset = Resource.objects.filter(status=Resource.STATUS_ACTIVE)
        
        # Zone 2 Filtering
        course_id = self.request.query_params.get('course_id')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
            
        resource_type = self.request.query_params.get('resource_type')
        if resource_type:
            types = resource_type.split(',')
            queryset = queryset.filter(resource_type__in=types)
            
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(description__icontains=search) | 
                Q(tags__name__icontains=search)
            ).distinct()
            
        ordering = self.request.query_params.get('ordering', '-cached_score')
        return queryset.order_by(ordering)

    def get_serializer_class(self):
        if self.action == 'list':
            return ResourceListSerializer
        return ResourceDetailSerializer

    def perform_create(self, serializer):
        serializer.save(uploader=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        # Track view engagement when a resource is detailed
        instance = self.get_object()
        Engagement.objects.create(
            resource=instance, 
            user=request.user if request.user.is_authenticated else None,
            action=Engagement.ACTION_VIEW
        )
        return super().retrieve(request, *args, **kwargs)

    def _get_course_envelope(self, request):
        if request.user.is_authenticated and request.user.courses.exists():
            return request.user.courses.all()
        return Course.objects.all()

    @action(detail=False, methods=['get'])
    def trending(self, request):
        """ Zone 1: Trending in Your Courses """
        envelope = self._get_course_envelope(request)
        seven_days_ago = timezone.now() - timedelta(days=7)
        
        from django.db.models import Count
        recent_active_ids = Engagement.objects.filter(
            timestamp__gte=seven_days_ago, 
            resource__course__in=envelope
        ).values('resource_id').annotate(count=Count('id')).order_by('-count')
        
        # Extract top 8 resource IDs
        top_ids = [item['resource_id'] for item in recent_active_ids[:8]]
        
        # Maintain ordered retrieval
        resources = Resource.objects.filter(id__in=top_ids, status=Resource.STATUS_ACTIVE)
        if top_ids:
            # Sort by the ranking array locally
            resource_map = {r.id: r for r in resources}
            resources = [resource_map[id] for id in top_ids if id in resource_map]
            
        serializer = ResourceListSerializer(resources, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def top_rated(self, request):
        """ Zone 1: Bayesian Confidence Ranking """
        from django.db.models import Avg, FloatField, ExpressionWrapper, F
        envelope = self._get_course_envelope(request)
        active_resources = Resource.objects.filter(course__in=envelope, status=Resource.STATUS_ACTIVE)
        
        m = active_resources.aggregate(Avg('average_rating'))['average_rating__avg'] or 0.0
        C = 5.0
        
        resources = active_resources.filter(rating_count__gt=0).annotate(
            confidence_score=ExpressionWrapper(
                (F('rating_count') * F('average_rating') + C * m) / (F('rating_count') + C),
                output_field=FloatField()
            )
        ).order_by('-confidence_score')[:8]

        serializer = ResourceListSerializer(resources, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """ Zone 1: New Arrivals """
        envelope = self._get_course_envelope(request)
        resources = Resource.objects.filter(course__in=envelope, status=Resource.STATUS_ACTIVE)
        
        resources = resources.order_by('-upload_date')[:8]
        serializer = ResourceListSerializer(resources, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recommended(self, request):
        """ Zone 1: Behavioral Affinity Mapping """
        envelope = self._get_course_envelope(request)
        resources = Resource.objects.filter(course__in=envelope, status=Resource.STATUS_ACTIVE)
        
        if request.user.is_authenticated:
            from django.db.models import Count
            engagements = Engagement.objects.filter(user=request.user).values('resource__course_id').annotate(count=Count('id'))
            affinity_map = {item['resource__course_id']: item['count'] for item in engagements}
            
            engaged_resource_ids = Engagement.objects.filter(user=request.user).values_list('resource_id', flat=True)
            candidate_resources = list(resources.exclude(id__in=engaged_resource_ids).order_by('-cached_score')[:50])
            
            for r in candidate_resources:
                affinity = affinity_map.get(r.course_id, 0)
                r._affinity_score = r.cached_score * (1 + 0.1 * affinity)
            
            candidate_resources.sort(key=lambda x: getattr(x, '_affinity_score', 0), reverse=True)
            final_resources = candidate_resources[:8]
        else:
            final_resources = resources.order_by('-cached_score')[:8]

        serializer = ResourceListSerializer(final_resources, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def staff_picks(self, request):
        """ Zone 1: Verified Contributors """
        envelope = self._get_course_envelope(request)
        resources = Resource.objects.filter(
            course__in=envelope, 
            status=Resource.STATUS_ACTIVE, 
            uploader__is_verified_contributor=True
        ).order_by('-cached_score')[:8]
        serializer = ResourceListSerializer(resources, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_uploads(self, request):
        """ Return all resources uploaded by the requested user """
        resources = Resource.objects.filter(uploader=request.user).order_by('-upload_date')
        serializer = ResourceListSerializer(resources, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def rate(self, request, pk=None):
        resource = self.get_object()
        user = request.user
        
        rating_obj = Rating.objects.filter(resource=resource, user=user).first()
        serializer = RatingSerializer(rating_obj, data=request.data, partial=True) if rating_obj else RatingSerializer(data=request.data)
            
        if serializer.is_valid():
            serializer.save(resource=resource, user=user)
            
            from django.db.models import Avg, Count
            aggs = Rating.objects.filter(resource=resource).aggregate(avg=Avg('value'), count=Count('id'))
            resource.average_rating = aggs['avg'] or 0.0
            resource.rating_count = aggs['count'] or 0
            resource.save(update_fields=['average_rating', 'rating_count'])
            
            return Response(serializer.data, status=status.HTTP_200_OK if rating_obj else status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get', 'post'])
    def reviews(self, request, pk=None):
        resource = self.get_object()
        
        if request.method == 'GET':
            reviews = Review.objects.filter(resource=resource).order_by('-created_at')
            serializer = ReviewSerializer(reviews, many=True)
            return Response(serializer.data)
            
        elif request.method == 'POST':
            if not request.user.is_authenticated:
                return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
                
            serializer = ReviewSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(resource=resource, user=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def download(self, request, pk=None):
        resource = self.get_object()
        Engagement.objects.create(
            resource=resource,
            user=request.user if request.user.is_authenticated else None,
            action=Engagement.ACTION_DOWNLOAD
        )
        return Response({"status": "Download tracked"})
