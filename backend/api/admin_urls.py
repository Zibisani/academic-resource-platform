from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import (
    AdminUserViewSet, AdminResourceViewSet, AdminReviewViewSet,
    AdminReportViewSet, AdminFacultyViewSet, AdminProgrammeViewSet,
    AdminCourseViewSet, AdminModuleViewSet, AdminTopicViewSet,
    AdminWeightsViewSet, AdminAuditLogViewSet, AdminAnalyticsView,
    AdminHierarchyReorderView
)

router = DefaultRouter()
router.register(r'users', AdminUserViewSet, basename='admin-users')
router.register(r'resources', AdminResourceViewSet, basename='admin-resources')
router.register(r'reviews', AdminReviewViewSet, basename='admin-reviews')
router.register(r'reports', AdminReportViewSet, basename='admin-reports')
router.register(r'faculty', AdminFacultyViewSet, basename='admin-faculty')
router.register(r'programme', AdminProgrammeViewSet, basename='admin-programme')
router.register(r'course', AdminCourseViewSet, basename='admin-course')
router.register(r'module', AdminModuleViewSet, basename='admin-module')
router.register(r'topic', AdminTopicViewSet, basename='admin-topic')
router.register(r'weights', AdminWeightsViewSet, basename='admin-weights')
router.register(r'audit-log', AdminAuditLogViewSet, basename='admin-auditlog')

urlpatterns = [
    path('analytics/', AdminAnalyticsView.as_view(), name='admin-analytics'),
    path('hierarchy/reorder/', AdminHierarchyReorderView.as_view(), name='admin-hierarchy-reorder'),
    path('', include(router.urls)),
]
