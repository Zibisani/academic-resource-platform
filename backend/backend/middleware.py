from django.utils.deprecation import MiddlewareMixin

class SecurityHeadersMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'
        
        # Dev exception: allow embedding our own media files in frontend iframes
        if request.path.startswith('/media/'):
            if 'X-Frame-Options' in response:
                del response['X-Frame-Options']
                
        return response
