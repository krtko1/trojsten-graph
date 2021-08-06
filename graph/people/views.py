from django.http import JsonResponse
from django.views import View
from django.views.generic import TemplateView
from rest_framework.response import Response
from rest_framework.views import APIView

from people.models import Person, Relationship
from people.serializers import PeopleSerializer, RelationshipSerializer


class PeopleView(APIView):
    def get(self, request, format=None):
        people = Person.objects.for_graph_serialization()
        serializer = PeopleSerializer(people, many=True)
        return Response(serializer.data)


class RelationshipView(APIView):
    def get(self, request, format=None):
        people = Person.objects.for_graph_serialization()
        relationships = Relationship.objects.for_graph_serialization(people)
        serializer = RelationshipSerializer(relationships, many=True)
        return Response(serializer.data)


class GraphView(TemplateView):
    template_name = 'people/graph.html'


class GraphViewV2(TemplateView):
    template_name = 'people/graphV2.html'


class GraphDataView(View):
    def get(self, request, *args, **kwargs):
        people = Person.objects.for_graph_serialization()
        response_data = {
            'nodes': PeopleSerializer(people, many=True).data,
            'edges': RelationshipSerializer(Relationship.objects.for_graph_serialization(people), many=True).data
        }
        return JsonResponse(response_data)


class AboutView(TemplateView):
    template_name = 'people/about.html'
