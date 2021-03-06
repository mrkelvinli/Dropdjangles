"""tutorial URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.8/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Add an import:  from blog import urls as blog_urls
    2. Add a URL to urlpatterns:  url(r'^blog/', include(blog_urls))
"""
from django.conf import settings
from django.conf.urls import patterns, include, url
from django.conf.urls.static import static

from timetable import views

from django.contrib import admin
from django.views.generic import TemplateView

from registration.backends.simple.views import RegistrationView

admin.autodiscover()


# Create a new class that redirects the user to the index page, if successful at logging
class MyRegistrationView(RegistrationView):
    def get_success_url(self,request, user):
        return '/timetable/'

urlpatterns = [
    url(r'^$|^login/$', views.login, name='login'),
    url(r'^register/$', views.register, name='register'),
    url(r'^forgot_password/$', views.forgot_password, name='forgot_password'),
    url(r'^timetable/$', views.timetable, name='timetable'),

    url(r'^admin/', include(admin.site.urls)),
    url(r'^accounts/', include('registration.backends.simple.urls')),

    # ajax GET
    url(r'^class_search/$',views.class_search,name='class_search'),
    url(r'^class_stream_search/$',views.class_stream_search,name='class_stream_search'),
    url(r'^class_add/$',views.class_add,name='class_add'),
    url(r'^class_remove/$',views.class_remove,name='class_remove'),
    url(r'^get_all_class/$',views.get_all_class,name='get_all_class'),
    url(r'^course_add/$',views.course_add,name='course_add'),
    url(r'^course_remove/$',views.course_remove,name='course_remove'),
    url(r'^get_friends_classes/$', views.get_friends_classes, name ='get_friends_classes'),

    # For POST request that deal with friend list
    url(r'^add_friend/$',views.add_friend,name='add_friend'),
    url(r'^remove_friend/$',views.remove_friend,name='remove_friend'),
    url(r'^accept_friend_request/$',views.accept_friend_request,name='accept_friend_request'),
    url(r'^deny_friend_request/$',views.deny_friend_request,name='deny_friend_request'),
    url(r'^get_friend_list/$',views.get_friend_list,name='get_friend_list'),
    url(r'^get_pending_friend_list/$',views.get_pending_friend_list,name='get_pending_friend_list'),
    url(r'^get_waiting_friend_list/$',views.get_waiting_friend_list,name='get_waiting_friend_list'),


    url(r'^timetable_have_classtype_this_course/$',views.timetable_have_classtype_this_course,name='timetable_have_classtype_this_course'),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
