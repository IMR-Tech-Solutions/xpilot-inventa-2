from customers.models import Customer
from posorders.models import POSOrder
from django.db.models import Count
from accounts.models import UserMaster
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from datetime import datetime, timedelta
from django.utils import timezone
from dateutil.relativedelta import relativedelta
from django.db.models import Sum, Count
from decimal import Decimal
from django.db.models import Sum, Count, F
from django.db.models.functions import ExtractMonth, ExtractQuarter
from inventory.models import StockEntry
from shop.models import ShopOwnerProducts
from django.shortcuts import get_object_or_404

class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = get_object_or_404(UserMaster, pk=request.user.id)
            
            # Get query parameters
            year = int(request.query_params.get('year', timezone.now().year))
            month = int(request.query_params.get('month', timezone.now().month))
            period = request.query_params.get('period', 'monthly')
            
            # Common date calculations
            today = timezone.now().date()
            start_of_this_month = today.replace(day=1)
            start_of_last_month = (start_of_this_month - relativedelta(months=1))
            end_of_last_month = start_of_this_month - timedelta(days=1)
            
            # Monthly date range for specific month/year
            start_date = timezone.make_aware(datetime(year, month, 1))
            if month == 12:
                end_date = timezone.make_aware(datetime(year + 1, 1, 1))
            else:
                end_date = timezone.make_aware(datetime(year, month + 1, 1))
            
            # === USER SUMMARY DATA ===
            total_customers = Customer.objects.filter(user=user).count()
            total_orders = POSOrder.objects.filter(user=user).count()
            
            customers_this_month = Customer.objects.filter(
                user=user, created_at__date__gte=start_of_this_month
            ).count()
            
            orders_this_month = POSOrder.objects.filter(
                user=user, created_at__date__gte=start_of_this_month
            ).count()
            
            customers_last_month = Customer.objects.filter(
                user=user,
                created_at__date__gte=start_of_last_month,
                created_at__date__lte=end_of_last_month
            ).count()
            
            orders_last_month = POSOrder.objects.filter(
                user=user,
                created_at__date__gte=start_of_last_month,
                created_at__date__lte=end_of_last_month
            ).count()
            
            # === TODAY'S SALES DATA ===
            todays_orders = POSOrder.objects.filter(
                user=user, created_at__date=today
            )
            todays_orders_count = todays_orders.count()
            todays_revenue = todays_orders.aggregate(
                total=Sum('total_amount')
            )['total'] or Decimal('0.00')
            
            this_month_revenue = POSOrder.objects.filter(
                user=user, created_at__date__gte=start_of_this_month
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
            
            last_month_revenue = POSOrder.objects.filter(
                user=user,
                created_at__date__gte=start_of_last_month,
                created_at__date__lte=end_of_last_month
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
            
            # === STOCK DATA ===
            is_manager = StockEntry.objects.filter(user=user).exists()
            is_shop_owner = ShopOwnerProducts.objects.filter(shop_owner=user).exists()

            if is_manager:
                from products.models import Product
                total_stock_added = Product.objects.filter(
                    user=user
                ).aggregate(total_quantity=Sum('current_stock'))['total_quantity'] or 0
                source = "manager"

                manager_stock_added = StockEntry.objects.filter(
                    user=user,
                    created_at__gte=start_date,
                    created_at__lt=end_date
                ).aggregate(total_quantity=Sum('quantity'))['total_quantity'] or 0

                manager_batches_count = StockEntry.objects.filter(
                    user=user,
                    created_at__gte=start_date,
                    created_at__lt=end_date
                ).count()

                shop_owner_stock_purchased = 0
                shop_owner_purchases_count = 0

            elif is_shop_owner:
                total_stock_added = ShopOwnerProducts.objects.filter(
                    shop_owner=user
                ).aggregate(total_quantity=Sum('quantity'))['total_quantity'] or 0
                source = "shopowner"
                
                # Shop owner-specific monthly data  
                shop_owner_stock_purchased = ShopOwnerProducts.objects.filter(
                    shop_owner=user,
                    purchase_date__gte=start_date.date(),
                    purchase_date__lt=end_date.date()
                ).aggregate(total_quantity=Sum('quantity'))['total_quantity'] or 0
                
                shop_owner_purchases_count = ShopOwnerProducts.objects.filter(
                    shop_owner=user,
                    purchase_date__gte=start_date.date(),
                    purchase_date__lt=end_date.date()
                ).count()
                
                manager_stock_added = 0
                manager_batches_count = 0
            else:
                total_stock_added = 0
                source = None
                manager_stock_added = 0
                shop_owner_stock_purchased = 0
                manager_batches_count = 0
                shop_owner_purchases_count = 0
            
            # === STATISTICS DATA (based on period parameter) ===
            sales_stats = self.get_sales_statistics(user, period, year)
            
            # === HELPER FUNCTION ===
            def calculate_percentage_change(current, previous):
                if previous == 0:
                    return 100 if current > 0 else 0
                return round(((current - previous) / previous) * 100, 2)
            
            # Calculate percentages
            orders_percentage = calculate_percentage_change(orders_this_month, orders_last_month)
            customers_percentage = calculate_percentage_change(customers_this_month, customers_last_month)
            sales_percentage = calculate_percentage_change(
                float(this_month_revenue), float(last_month_revenue)
            )
            
            # Progress percentage
            if last_month_revenue > 0:
                progress_percentage = round((float(this_month_revenue) / float(last_month_revenue)) * 100, 2)
            else:
                progress_percentage = 100 if this_month_revenue > 0 else 0
            
            # === CONSOLIDATED RESPONSE ===
            response_data = {
                # User Summary
                'user_summary': {
                    'total_orders': total_orders,
                    'total_customers': total_customers,
                    'orders_comparison': {
                        'this_month': orders_this_month,
                        'last_month': orders_last_month,
                        'percentage_change': orders_percentage
                    },
                    'customers_comparison': {
                        'this_month': customers_this_month,
                        'last_month': customers_last_month,
                        'percentage_change': customers_percentage
                    }
                },
                
                # Today's Sales
                'todays_sales': {
                    'orders_count': todays_orders_count,
                    'revenue': float(todays_revenue),
                    'this_month_revenue': float(this_month_revenue),
                    'last_month_revenue': float(last_month_revenue),
                    'sales_percentage_change': sales_percentage,
                    'progress_percentage': min(progress_percentage, 100)
                },
                
                # Stock Information
                'stock_summary': {
                    'source': source,
                    'total_stock_added': total_stock_added,
                    'monthly_data': {
                        'year': year,
                        'month': month,
                        'month_name': datetime(year, month, 1).strftime('%B'),
                        'manager_stock_added': manager_stock_added,
                        'shop_owner_stock_purchased': shop_owner_stock_purchased,
                        'total_monthly_stock': manager_stock_added + shop_owner_stock_purchased,
                        'manager_batches_count': manager_batches_count,
                        'shop_owner_purchases_count': shop_owner_purchases_count
                    },
                    'user_role_data': {
                        'as_manager': {
                            'stock_batches_added': manager_batches_count,
                            'quantity_added': manager_stock_added
                        },
                        'as_shop_owner': {
                            'purchases_made': shop_owner_purchases_count,
                            'quantity_purchased': shop_owner_stock_purchased
                        }
                    }
                },
                
                # Sales Statistics
                'sales_statistics': sales_stats,
                
                # Overall Metrics
                'metrics': {
                    'total_pos_sales': float(this_month_revenue + last_month_revenue),
                    'orders_vs_stock_ratio': round(total_orders / max(total_stock_added, 1), 2),
                    'avg_order_value': float(this_month_revenue / max(orders_this_month, 1)) if orders_this_month > 0 else 0
                }
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Something went wrong. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_sales_statistics(self, user, period, year):
        """Helper method to get sales statistics based on period"""
        base_queryset = POSOrder.objects.filter(user=user, created_at__year=year)
        
        if period == 'monthly':
            data = base_queryset.annotate(
                period_value=ExtractMonth('created_at')
            ).values('period_value').annotate(
                orders_count=Count('id'),
                total_revenue=Sum('total_amount')
            ).order_by('period_value')
            
            month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            
            result = []
            data_dict = {item['period_value']: item for item in data}
            
            for month in range(1, 13):
                if month in data_dict:
                    result.append({
                        'period': month_names[month-1],
                        'orders_count': data_dict[month]['orders_count'],
                        'total_revenue': float(data_dict[month]['total_revenue'] or 0)
                    })
                else:
                    result.append({
                        'period': month_names[month-1],
                        'orders_count': 0,
                        'total_revenue': 0.0
                    })
                    
        elif period == 'quarterly':
            data = base_queryset.annotate(
                period_value=ExtractQuarter('created_at')
            ).values('period_value').annotate(
                orders_count=Count('id'),
                total_revenue=Sum('total_amount')
            ).order_by('period_value')
            
            quarter_names = ['Q1', 'Q2', 'Q3', 'Q4']
            result = []
            data_dict = {item['period_value']: item for item in data}
            
            for quarter in range(1, 5):
                if quarter in data_dict:
                    result.append({
                        'period': quarter_names[quarter-1],
                        'orders_count': data_dict[quarter]['orders_count'],
                        'total_revenue': float(data_dict[quarter]['total_revenue'] or 0)
                    })
                else:
                    result.append({
                        'period': quarter_names[quarter-1],
                        'orders_count': 0,
                        'total_revenue': 0.0
                    })
        else:  # annual
            current_year = int(year)
            years = range(current_year - 4, current_year + 1)
            
            result = []
            for yr in years:
                yearly_data = POSOrder.objects.filter(
                    user=user, created_at__year=yr
                ).aggregate(
                    orders_count=Count('id'),
                    total_revenue=Sum('total_amount')
                )
                
                result.append({
                    'period': str(yr),
                    'orders_count': yearly_data['orders_count'] or 0,
                    'total_revenue': float(yearly_data['total_revenue'] or 0)
                })
        
        # Calculate summary
        total_orders = sum(item['orders_count'] for item in result)
        total_revenue = sum(item['total_revenue'] for item in result)
        best_period = max(result, key=lambda x: x['total_revenue']) if result else None
        
        return {
            'period': period,
            'year': year,
            'data': result,
            'summary': {
                'total_orders': total_orders,
                'total_revenue': total_revenue,
                'best_period': best_period,
                'periods_count': len([item for item in result if item['orders_count'] > 0])
            }
        }
