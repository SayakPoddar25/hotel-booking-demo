from django.contrib import admin
from .models import Room, RoomPlan, RoomImage, Booking, Gallery, Testimonial

class RoomImageInline(admin.TabularInline):
    model = RoomImage
    extra = 3

class RoomPlanInline(admin.TabularInline):
    model = RoomPlan
    extra = 3

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    # === UPDATED: এখানে 'total_inventory' অ্যাড করা হলো যাতে লিস্ট ভিউতেও দেখা যায় ===
    list_display = ['room_number', 'room_type', 'price_base', 'capacity', 'total_inventory', 'created_at', 'amenities']
    list_filter = ['room_type', 'capacity']
    search_fields = ['room_number', 'room_type']
    inlines = [RoomImageInline, RoomPlanInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('room_type', 'room_number', 'description')
        }),
        ('Pricing & Capacity', {
            # === UPDATED: capacity-এর ঠিক পাশেই 'total_inventory' বসানো হলো ===
            'fields': ('price_base', 'capacity', 'total_inventory', 'size_sqm')
        }),
        ('Room Features', {
            'fields': ('bed_type', 'view_type', 'amenities')
        }),
    )
@admin.register(RoomPlan)
class RoomPlanAdmin(admin.ModelAdmin):
    list_display = ['room', 'title', 'price_modifier', 'breakfast_included', 'free_cancellation']
    list_filter = ['breakfast_included', 'free_cancellation']
    search_fields = ['title', 'room__room_number']

@admin.register(RoomImage)
class RoomImageAdmin(admin.ModelAdmin):
    list_display = ['room', 'caption', 'is_primary']
    list_filter = ['is_primary']
    search_fields = ['room__room_number', 'caption']

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'guest_name', 'room', 'check_in', 'check_out', 'total_price', 'status', 'payment_status']
    list_filter = ['status', 'payment_status', 'check_in']
    search_fields = ['guest_name', 'guest_email', 'guest_phone']
    readonly_fields = ['created_at', 'razorpay_order_id', 'razorpay_payment_id']
    fieldsets = (
        ('Guest Information', {
            'fields': ('guest_name', 'guest_email', 'guest_phone')
        }),
        ('Booking Details', {
            'fields': ('room', 'room_plan', 'check_in', 'check_out', 'guests', 'special_requests')
        }),
        ('Payment Information', {
            'fields': ('total_price', 'status', 'payment_status', 'razorpay_order_id', 'razorpay_payment_id')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

@admin.register(Gallery)
class GalleryAdmin(admin.ModelAdmin):
    list_display = ['title', 'order', 'created_at']
    list_editable = ['order']
    search_fields = ['title', 'description']

@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ['guest_name', 'rating', 'stay_date', 'is_approved', 'created_at']
    list_filter = ['rating', 'is_approved']
    search_fields = ['guest_name', 'review']
    list_editable = ['is_approved']