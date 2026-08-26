from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages
from django.db import models as db_models
from datetime import datetime, timedelta
import razorpay
import json
from .models import Room, RoomPlan, Booking, Gallery, Testimonial
from django.conf import settings

# Razorpay client initialization
razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

def home(request):
    rooms = Room.objects.all()[:4]
    galleries = Gallery.objects.all()[:8]
    testimonials = Testimonial.objects.filter(is_approved=True)[:6]
    return render(request, 'index.html', {
        'rooms': rooms,
        'galleries': galleries,
        'testimonials': testimonials
    })

def about(request):
    return render(request, 'about.html')

def rooms_page(request):
    rooms = Room.objects.all()
    return render(request, 'rooms.html', {'rooms': rooms})

def room_detail(request, room_id):
    room = get_object_or_404(Room, id=room_id)
    plans = room.plans.all()
    return render(request, 'room_detail.html', {'room': room, 'plans': plans})

def check_availability(request):
    if request.method == 'GET':
        room_id = request.GET.get('room_id')
        check_in = request.GET.get('check_in')
        check_out = request.GET.get('check_out')
        
        try:
            room = Room.objects.get(id=room_id)
            check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
            check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()
            nights = (check_out_date - check_in_date).days
            
            # === UPDATED: .exists() এর বদলে .count() ব্যবহার করা হলো ===
            conflicting_count = Booking.objects.filter(
                room=room,
                status='confirmed',
                check_in__lt=check_out_date,
                check_out__gt=check_in_date
            ).count()
            
            if conflicting_count < room.total_inventory:
                return JsonResponse({'available': True, 'nights': nights})
            else:
                return JsonResponse({'available': False, 'message': 'Room Sold Out'})
        except Exception as e:
            return JsonResponse({'available': False, 'message': str(e)})
    
    return JsonResponse({'available': False})
@csrf_exempt
def create_booking(request):
    if request.method == 'POST':
        try:
            room_id = request.POST.get('room_id')
            plan_id = request.POST.get('plan_id')
            check_in = request.POST.get('check_in')
            check_out = request.POST.get('check_out')
            guests = request.POST.get('guests')
            guest_name = request.POST.get('guest_name')
            guest_email = request.POST.get('guest_email')
            guest_phone = request.POST.get('guest_phone')
            
            room = get_object_or_404(Room, id=room_id)
            plan = None
            if plan_id:
                plan = get_object_or_404(RoomPlan, id=plan_id)
            
            check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
            check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()
            nights = (check_out_date - check_in_date).days
            
            # ====================================================
            # এখানেই ৯৭০০ টাকার সমস্যাটা ছিল। আমি আপনার লজিক অনুযায়ী
            # যোগ করাটা বাদ দিয়ে শুধু plan.price_modifier দিয়েছি।
            # ====================================================
            if plan:
                total_price = plan.price_modifier * nights
            else:
                total_price = room.price_base * nights
            
            # Store in session
            request.session['booking_data'] = {
                'room_id': room_id,
                'plan_id': plan_id,
                'check_in': check_in,
                'check_out': check_out,
                'guests': guests,
                'guest_name': guest_name,
                'guest_email': guest_email,
                'guest_phone': guest_phone,
                'total_price': str(total_price),
                'nights': nights,
            }
            # Create Razorpay Order
            order_data = {
                'amount': int(float(total_price) * 100),
                'currency': 'INR',
                'receipt': f'booking_{int(datetime.now().timestamp())}',
                'payment_capture': 1,
            }
            
            order = razorpay_client.order.create(data=order_data)
            
            return render(request,'payment.html',{
                'success': True,
                'razorpay_order_id': order['id'],
                'razorpay_key_id': settings.RAZORPAY_KEY_ID,
                'amount': order_data['amount'],
                'room': room,
                'plan': plan
            })
            
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request'})

@csrf_exempt
def confirm_booking(request):
    """Confirm booking after successful payment"""
    if request.method == 'POST':
        try:
            razorpay_payment_id = request.POST.get('razorpay_payment_id')
            razorpay_order_id = request.POST.get('razorpay_order_id')
            razorpay_signature = request.POST.get('razorpay_signature')
            
            booking_data = request.session.get('booking_data')
            
            if booking_data:
                # Create a simple booking ID
                booking_id = int(datetime.now().timestamp())
                
                # Store booking info in session for success page
                request.session['confirmed_booking'] = {
                    'id': booking_id,
                    'guest_name': booking_data.get('guest_name'),
                    'check_in': booking_data.get('check_in'),
                    'check_out': booking_data.get('check_out'),
                    'total_price': booking_data.get('total_price'),
                    'room_name': 'Deluxe Suite'
                }
                
                # Clear the temporary booking data
                del request.session['booking_data']
                
                # Return JSON response with redirect URL
                return JsonResponse({
                    'success': True, 
                    'booking_id': booking_id,
                    'redirect_url': f'/payment-success/{booking_id}/'
                })
            else:
                return JsonResponse({'success': False, 'error': 'No booking data found'})
                
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request'})

def payment_success(request, booking_id):
    """Show payment success page"""
    from .models import Booking, Room
    from datetime import datetime
    
    try:
        # Try to get from database
        booking = Booking.objects.get(id=booking_id)
        room = booking.room
        return render(request, 'booking_success.html', {
            'booking': booking,
            'room': room
        })
    except:
        # If no database, get from session
        booking_data = request.session.get('booking_data', {})
        
        # Create a dummy booking object for display
        class DummyBooking:
            pass
        
        booking = DummyBooking()
        booking.id = booking_id
        booking.guest_name = booking_data.get('guest_name', 'Guest')
        booking.check_in = booking_data.get('check_in', '2024-01-01')
        booking.check_out = booking_data.get('check_out', '2024-01-05')
        booking.total_price = booking_data.get('total_price', '5000')
        
        class DummyRoom:
            pass
        
        room = DummyRoom()
        room.get_room_type_display = 'Deluxe Suite'
        
        return render(request, 'booking_success.html', {
            'booking': booking,
            'room': room
        })

def contact(request):
    if request.method == 'POST':
        messages.success(request, 'Thank you for contacting us!')
        return redirect('contact')
    return render(request, 'contact.html')

def login_view(request):
    if request.user.is_authenticated:
        return redirect('admin_dashboard')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        
        if user is not None and user.is_staff:
            login(request, user)
            return redirect('admin_dashboard')
        else:
            messages.error(request, 'Invalid credentials')
    
    return render(request, 'login.html')

def logout_view(request):
    logout(request)
    return redirect('home')

@login_required
def admin_dashboard(request):
    if not request.user.is_staff:
        return redirect('home')
    
    total_bookings = Booking.objects.count()
    confirmed_bookings = Booking.objects.filter(status='confirmed').count()
    pending_payments = Booking.objects.filter(payment_status='pending').count()
    total_revenue = Booking.objects.filter(payment_status='paid').aggregate(
        total=db_models.Sum('total_price')
    )['total'] or 0
    
    recent_bookings = Booking.objects.all().order_by('-created_at')[:10]
    
    return render(request, 'admin_dashboard.html', {
        'total_bookings': total_bookings,
        'confirmed_bookings': confirmed_bookings,
        'pending_payments': pending_payments,
        'total_revenue': total_revenue,
        'recent_bookings': recent_bookings,
    })

@login_required
def admin_rooms(request):
    if not request.user.is_staff:
        return redirect('home')
    
    if request.method == 'POST':
        action = request.POST.get('action')
        
        if action == 'add':
            room = Room.objects.create(
                room_type=request.POST.get('room_type'),
                room_number=request.POST.get('room_number'),
                price_base=request.POST.get('price_base'),
                capacity=request.POST.get('capacity'),
                # === NEW: ইনভেন্টরি সেভ করার লাইন ===
                total_inventory=request.POST.get('total_inventory', 1),
                description=request.POST.get('description'),
                size_sqm=request.POST.get('size_sqm'),
                bed_type=request.POST.get('bed_type'),
                view_type=request.POST.get('view_type'),
                amenities=request.POST.get('amenities', ''),
            )
            messages.success(request, 'Room added successfully')
        
        elif action == 'delete':
            room_id = request.POST.get('room_id')
            Room.objects.get(id=room_id).delete()
            messages.success(request, 'Room deleted')
        
        return redirect('admin_rooms')
    
    rooms = Room.objects.all().prefetch_related('plans', 'images')
    return render(request, 'admin_rooms.html', {'rooms': rooms})
@login_required
def admin_bookings(request):
    if not request.user.is_staff:
        return redirect('home')
    
    if request.method == 'POST':
        booking_id = request.POST.get('booking_id')
        status = request.POST.get('status')
        booking = get_object_or_404(Booking, id=booking_id)
        booking.status = status
        booking.save()
        messages.success(request, 'Booking status updated')
        return redirect('admin_bookings')
    
    bookings = Booking.objects.all().select_related('room', 'room_plan').order_by('-created_at')
    return render(request, 'admin_bookings.html', {'bookings': bookings})

def booking_success(request, booking_id):
    """Show booking success page after payment"""
    from .models import Booking, Room
    from datetime import datetime
    
    try:
        # Try to get from database
        booking = Booking.objects.get(id=booking_id)
        room = booking.room
        return render(request, 'booking_success.html', {
            'booking': booking,
            'room': room
        })
    except:
        # If no database, get from session
        booking_data = request.session.get('booking_data', {})
        
        # Create a dummy booking object for display
        class DummyBooking:
            pass
        
        booking = DummyBooking()
        booking.id = booking_id
        booking.guest_name = booking_data.get('guest_name', 'Guest')
        booking.check_in = booking_data.get('check_in', '2024-01-01')
        booking.check_out = booking_data.get('check_out', '2024-01-05')
        booking.total_price = booking_data.get('total_price', '5000')
        
        class DummyRoom:
            pass
        
        room = DummyRoom()
        room.get_room_type_display = 'Deluxe Suite'
        
        return render(request, 'booking_success.html', {
            'booking': booking,
            'room': room
        })

# === NEW: Admin Dashboard Calendar API ===
def room_type_availability(request):
    """API for Admin Dashboard Calendar to check real Inventory"""
    date_str = request.GET.get('date')
    if not date_str:
        date_str = datetime.today().strftime('%Y-%m-%d')
    
    try:
        check_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return JsonResponse({'error': 'Invalid date format'}, status=400)
    
    availability_data = []
    rooms = Room.objects.all()
    
    for room in rooms:
        booked_count = Booking.objects.filter(
            room=room,
            status='confirmed',
            check_in__lte=check_date,
            check_out__gt=check_date
        ).count()
        
        available_rooms = room.total_inventory - booked_count
        
        availability_data.append({
            'type_name': room.get_room_type_display(),
            'total': room.total_inventory,
            'booked': booked_count,
            'available': available_rooms,
            'sold_out': available_rooms <= 0
        })
        
    return JsonResponse({
        'date': date_str,
        'inventory': availability_data
    })