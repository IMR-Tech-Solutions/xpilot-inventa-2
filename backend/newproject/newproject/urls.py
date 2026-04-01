"""
URL configuration for newproject project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/', include('roles.urls')),
    path('api/', include('usermodules.urls')),
    path('api/', include('categories.urls')),  
    path('api/', include('products.urls')), 
    path('api/', include('vendors.urls')), 
    path('api/', include('inventory.urls')), 
    path('api/', include('customers.urls')),
    path('api/', include('posorders.urls')),  
    path('api/', include('shop.urls')),
    path('api/', include('summary.urls')),
    path('api/', include('reports.urls')), 
    path('api/', include('broker.urls')),
    path('api/', include('notifications.urls')),
    path('api/', include('transport.urls')),
    path('api/', include('management.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
