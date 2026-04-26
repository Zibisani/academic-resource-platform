from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed

class ActiveUserJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        if getattr(user, 'status', None) == 'disabled':
            raise AuthenticationFailed('Account is disabled.', code='user_disabled')
        if not getattr(user, 'is_email_verified', True) and getattr(user, 'role', '') != 'admin':
            raise AuthenticationFailed('Email verification required. Please click the link sent to your university email.', code='email_unverified')
        return user
