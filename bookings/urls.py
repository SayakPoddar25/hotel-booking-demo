from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('about/', views.about, name='about'),
    path('rooms/', views.rooms_page, name='rooms'),
    path('room/<int:room_id>/', views.room_detail, name='room_detail'),
    path('check-availability/', views.check_availability, name='check_availability'),
    path('create-booking/', views.create_booking, name='create_booking'),
    path('confirm-booking/', views.confirm_booking, name='confirm_booking'),
    path('payment-success/<int:booking_id>/', views.payment_success, name='payment_success'),
    path('contact/', views.contact, name='contact'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('admin-dashboard/', views.admin_dashboard, name='admin_dashboard'),
    path('admin-rooms/', views.admin_rooms, name='admin_rooms'),
    path('admin-bookings/', views.admin_bookings, name='admin_bookings'),
    path('booking-success/', views.booking_success, name='booking-success'),
    path('api/room-availability/', views.room_type_availability, name='room_availability')
]