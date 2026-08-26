from django.contrib.auth.decorators import user_passes_test
from django.http import HttpResponseForbidden

def admin_required(function=None):
    """
    Decorator for views that checks that the user is logged in and is admin/staff
    """
    actual_decorator = user_passes_test(
        lambda user: user.is_authenticated and user.is_staff,
        login_url='login',
    )
    if function:
        return actual_decorator(function)
    return actual_decorator