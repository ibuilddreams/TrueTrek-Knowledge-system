from rest_framework import generics

from common.response import error_response, success_response
from users.permissions import IsStudent

from .models import CartItem
from .serializers import CartItemSerializer, CartItemWriteSerializer
from .services import checkout_cart


class CartItemListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsStudent]

    def get_queryset(self):
        return CartItem.objects.filter(user=self.request.user).select_related(
            "course", "course__category"
        ).prefetch_related("course__tags")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CartItemWriteSerializer
        return CartItemSerializer

    def list(self, request, *args, **kwargs):
        items = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(items, many=True)
        return success_response(serializer.data, message="Cart fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart_item = serializer.save(user=request.user)
        return success_response(
            CartItemSerializer(cart_item, context=self.get_serializer_context()).data,
            message="Course added to cart",
            status_code=201,
        )


class CartItemDetailView(generics.GenericAPIView):
    permission_classes = [IsStudent]

    def delete(self, request, course_id):
        deleted_count, _ = CartItem.objects.filter(
            user=request.user, course_id=course_id
        ).delete()
        if not deleted_count:
            return error_response(message="This course is not in your cart.", status_code=404)
        return success_response(None, message="Course removed from cart")


class CartCheckoutView(generics.GenericAPIView):
    """Dummy-payment checkout: no real payment gateway yet — the frontend
    simulates payment success, then calls this to actually enroll the student
    in every course currently in their cart."""

    permission_classes = [IsStudent]

    def post(self, request):
        if not CartItem.objects.filter(user=request.user).exists():
            return error_response(message="Your cart is empty.", status_code=400)

        result = checkout_cart(request.user)
        enrolled_count = len(result["enrolled"])
        already_count = len(result["already_enrolled"])
        failed_count = len(result["failed"])

        if not enrolled_count and not already_count:
            message = "Checkout failed — none of the courses in your cart could be enrolled."
        elif failed_count:
            message = (
                f"{enrolled_count} course(s) enrolled successfully, "
                f"{failed_count} couldn't be processed."
            )
        else:
            message = "Payment successful — you're now enrolled in your selected courses."

        return success_response(result, message=message)
