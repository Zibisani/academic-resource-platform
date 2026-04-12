from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.routers import DefaultRouter
from accounts.views import (
    CustomTokenObtainPairView, CustomTokenRefreshView, LogoutView,
    PasswordResetRequestView, PasswordResetConfirmView
)
from .views import (
    UserViewSet, FacultyViewSet, ProgrammeViewSet, CourseViewSet, ResourceViewSet, ReviewViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'faculties', FacultyViewSet)
router.register(r'programmes', ProgrammeViewSet)
router.register(r'courses', CourseViewSet)


router.register(r'resources', ResourceViewSet, basename='resources')
router.register(r'reviews', ReviewViewSet, basename='reviews')


urlpatterns = [
    path('', include(router.urls)),
    path('admin/', include('api.admin_urls')),
    
    # JWT Authentication Endpoints
    path('auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    
    # Password Reset
    path('auth/password-reset/request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('auth/password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]
