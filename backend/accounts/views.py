import hashlib
import secrets
from django.utils import timezone
from datetime import timedelta
from rest_framework import status, views
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from django.contrib.auth import get_user_model
from django.utils.decorators import method_decorator
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_protect
from django_ratelimit.decorators import ratelimit
from .models import PasswordResetToken
from .serializers import CustomTokenObtainPairSerializer

User = get_user_model()

def set_refresh_cookie(response, refresh_token):
    response.set_cookie(
        key='refresh_token',
        value=str(refresh_token),
        max_age=7 * 24 * 60 * 60, # 7 days
        httponly=True,
        secure=False, # True in production
        samesite='Strict',
        path='/api/auth/token/refresh/'
    )

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    @method_decorator(ratelimit(key='ip', rate='10/15m', method='POST', block=True))
    def post(self, request, *args, **kwargs):
        get_token(request) # Ensure CSRF cookie is set
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            refresh_token = response.data.pop('refresh') # Remove from JSON
            set_refresh_cookie(response, refresh_token)
        return response

class CustomTokenRefreshView(TokenRefreshView):
    @method_decorator(csrf_protect)
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return Response({'detail': 'Refresh token missing'}, status=status.HTTP_401_UNAUTHORIZED)
        
        request.data._mutable = True
        request.data['refresh'] = refresh_token
        request.data._mutable = False
            
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            new_refresh = response.data.pop('refresh', None)
            if new_refresh:
                set_refresh_cookie(response, new_refresh)
        return response

class LogoutView(views.APIView):
    def post(self, request):
        try:
            refresh_token = request.COOKIES.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass # ignore if missing or already blacklisted
        
        response = Response(status=status.HTTP_204_NO_CONTENT)
        response.delete_cookie('refresh_token', path='/api/auth/token/refresh/')
        return response

class PasswordResetRequestView(views.APIView):
    permission_classes = [AllowAny]
    @method_decorator(ratelimit(key='ip', rate='5/h', method='POST', block=True))
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'detail': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.filter(email=email).first()
        if user:
            raw_token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
            PasswordResetToken.objects.create(
                user=user,
                token_hash=token_hash,
                expires_at=timezone.now() + timedelta(minutes=30)
            )
            # Send email with raw_token... Log output for demo
            print(f"Password reset link: /reset-password?token={raw_token}&email={user.email}")
            
        return Response({'detail': 'If the email exists, a reset link has been sent.'})

class PasswordResetConfirmView(views.APIView):
    permission_classes = [AllowAny]
    @method_decorator(ratelimit(key='ip', rate='5/h', method='POST', block=True))
    def post(self, request):
        email = request.data.get('email')
        raw_token = request.data.get('token')
        new_password = request.data.get('password')
        
        if not all([email, raw_token, new_password]):
            return Response({'detail': 'Missing parameters'}, status=status.HTTP_400_BAD_REQUEST)
            
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        reset_token = PasswordResetToken.objects.filter(
            user__email=email,
            token_hash=token_hash,
            used=False,
            expires_at__gt=timezone.now()
        ).first()
        
        if not reset_token:
            return Response({'detail': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)
            
        user = reset_token.user
        user.set_password(new_password)
        user.save()
        
        reset_token.used = True
        reset_token.save()
        
        # Invalidate all outstanding JWT tokens
        tokens = OutstandingToken.objects.filter(user=user)
        for token in tokens:
            BlacklistedToken.objects.get_or_create(token=token)
            
        return Response({'detail': 'Password successfuly reset.'})
