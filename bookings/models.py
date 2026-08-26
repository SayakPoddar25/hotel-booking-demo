from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import User
from datetime import date, timedelta

class Room(models.Model):
    ROOM_TYPES = [
        ('deluxe', 'Deluxe Suite'),
        ('presidential', 'Presidential Suite'),
        ('royal', 'Royal Suite'),
        ('standard', 'Standard Room'),
    ]
    
    room_type = models.CharField(max_length=50, choices=ROOM_TYPES)
    room_number = models.CharField(max_length=10, unique=True)
    price_base = models.DecimalField(max_digits=10, decimal_places=2)
    capacity = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)])
    
    # ==========================================
    # NEW: রুম ক্যাপাসিটি (Inventory) সেট করার জন্য নতুন ফিল্ড
    # ==========================================
    total_inventory = models.IntegerField(default=5, help_text="Total number of rooms of this type available in the hotel")
    
    description = models.TextField()
    size_sqm = models.IntegerField()
    bed_type = models.CharField(max_length=100)
    view_type = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    amenities=models.TextField(blank=True,null=True,help_text="Free Wi-fi,AC,Smart TV")
    
    def __str__(self):
        return f"{self.get_room_type_display()} - {self.room_number}"
    
    def get_available_dates(self):
        today = date.today()
        future_dates = [today + timedelta(days=x) for x in range(365)]
        booked_dates = Booking.objects.filter(
            room=self,
            status='confirmed',
            check_in__lte=future_dates[-1],
            check_out__gte=today
        ).values_list('check_in', 'check_out')
        
        available_dates = []
        for check_date in future_dates:
            # ==========================================
            # UPDATED: ১টি বুকিং পেলেই False করার বদলে, এখন টোটাল বুকিং গুনবে
            # ==========================================
            overlap_count = 0
            for booking in booked_dates:
                # check_out এর দিন অন্য কেউ check_in করতে পারে, তাই '<' ব্যবহার করা হয়েছে
                if booking[0] <= check_date < booking[1]: 
                    overlap_count += 1
            
            # যদি ওই ডেটে বুকিং সংখ্যা আপনার সেট করা total_inventory-এর থেকে কম হয়, তবেই ডেটটি অ্যাভেইলেবল
            if overlap_count < self.total_inventory:
                available_dates.append(check_date)
        
        return available_dates

class RoomPlan(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='plans')
    title = models.CharField(max_length=100)
    price_modifier = models.DecimalField(max_digits=10, decimal_places=2)
    breakfast_included = models.BooleanField(default=False)
    free_cancellation = models.BooleanField(default=False)
    cancellation_days = models.IntegerField(default=0)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.room.room_number} - {self.title}"
    
    def get_total_price(self, nights):
        base = self.room.price_base + self.price_modifier
        return base * nights

class RoomImage(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='rooms/')
    is_primary = models.BooleanField(default=False)
    caption = models.CharField(max_length=200, blank=True)
    
    def __str__(self):
        return f"{self.room.room_number} - {self.caption or 'Image'}"

class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Payment'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]
    
    PAYMENT_STATUS = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    room_plan = models.ForeignKey(RoomPlan, on_delete=models.CASCADE, null=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    guest_name = models.CharField(max_length=100)
    guest_email = models.EmailField()
    guest_phone = models.CharField(max_length=20)
    
    check_in = models.DateField()
    check_out = models.DateField()
    guests = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(20)])
    
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    
    razorpay_order_id = models.CharField(max_length=100, blank=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True)
    razorpay_signature = models.CharField(max_length=200, blank=True)
    
    special_requests = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.guest_name} - {self.room.room_number} - {self.check_in}"
    
    def get_nights(self):
        return (self.check_out - self.check_in).days

class Gallery(models.Model):
    title = models.CharField(max_length=200)
    image = models.ImageField(upload_to='gallery/')
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return self.title

class Testimonial(models.Model):
    guest_name = models.CharField(max_length=100)
    guest_image = models.ImageField(upload_to='testimonials/', blank=True)
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    review = models.TextField()
    stay_date = models.DateField()
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.guest_name} - {self.rating} stars"