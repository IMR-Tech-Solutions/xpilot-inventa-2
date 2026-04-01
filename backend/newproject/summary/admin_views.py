from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from accounts.premissions import IsAdminRole
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import Group
from django.db.models import Count, Sum, Q
from accounts.models import UserMaster
from products.models import Product
from customers.models import Customer
from posorders.models import POSOrder

class AdminDashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated,IsAdminRole]
    
    def get(self, request):
        try:
            user = get_object_or_404(UserMaster, pk=request.user.id)
            total_customers = Customer.objects.count()
            total_products = Product.objects.count()
            total_pos_orders = POSOrder.objects.count()
            total_users = UserMaster.objects.filter(is_superuser=False).count()
            total_revenue = POSOrder.objects.filter(
                payment_status='paid'
            ).aggregate(
                total=Sum('total_amount')
            )['total'] or 0

            response_data = {
                "success": True,
                "data": {
                    "total_customers": total_customers,
                    "total_products": total_products, 
                    "total_pos_orders": total_pos_orders,
                    "total_users": total_users,
                    "total_revenue": float(total_revenue)
                },
                "message": "Admin dashboard summary retrieved successfully"
            }

            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
