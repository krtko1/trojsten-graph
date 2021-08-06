from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views


urlpatterns = [
    url(r'^$', login_required(views.GraphView.as_view()), name='graph'),
    url(r'^graph-data/$', login_required(views.GraphDataView.as_view()), name='graph_data'),
    url(r'^v2/$', views.GraphViewV2.as_view(), name='graphV2'),
    url(r'api/people/$', views.PeopleView.as_view(), name='graph_people'),
    url(r'api/relationships/$', views.RelationshipView.as_view(), name='graph_relationships'),
    url(r'^about/$', login_required(views.AboutView.as_view()), name='about')
]
