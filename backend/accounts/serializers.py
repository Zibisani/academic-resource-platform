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
