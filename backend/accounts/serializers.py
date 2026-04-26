from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['role'] = getattr(user, 'role', 'student')
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['must_change_password'] = getattr(user, 'must_change_password', False)
        
        return token

    def validate(self, attrs):
        # Explicit check for disabled status before authentication drops the user
        from django.contrib.auth import get_user_model
        User = get_user_model()
        email = attrs.get('email')
        if email:
            try:
                user = User.objects.get(email=email)
                if getattr(user, 'status', '') == 'disabled':
                    from rest_framework.exceptions import AuthenticationFailed
                    raise AuthenticationFailed(detail='Account Blocked: Please contact staff', code='account_blocked')
            except User.DoesNotExist:
                pass

        data = super().validate(attrs)
        if not getattr(self.user, 'is_email_verified', True) and getattr(self.user, 'role', '') != 'admin':
            from rest_framework.exceptions import AuthenticationFailed
            raise AuthenticationFailed(detail='Email verification required. Please click the link sent to your university email.', code='email_unverified')
        return data
