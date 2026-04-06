from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    UserViewSet, FacultyViewSet, ProgrammeViewSet, CourseViewSet, ResourceViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'faculties', FacultyViewSet)
router.register(r'programmes', ProgrammeViewSet)
router.register(r'courses', CourseViewSet)


router.register(r'resources', ResourceViewSet, basename='resources')


urlpatterns = [
    path('', include(router.urls)),
    
    # JWT Authentication Endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
