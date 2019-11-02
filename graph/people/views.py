from functools import wraps

from django.core.exceptions import PermissionDenied
from django.http import JsonResponse
from django.utils import timezone
from django.views import View
from django.views.generic import TemplateView

from people.models import Person, Relationship, VerificationToken, RelationshipStatus, Group
from people.serializers import PeopleSerializer, RelationshipSerializer


class TokenAuth:
    def __call__(self, view_func):
        @wraps(view_func)
        def _dispatch_method(request, *args, **kwargs):
            if request.user and request.user.is_staff:
                return view_func(request, *args, **kwargs)

            token = request.GET.get('token')
            if token and VerificationToken.objects.filter(valid_until__gt=timezone.localtime(), token=token).exists():
                return view_func(request, *args, **kwargs)

            raise PermissionDenied

        return _dispatch_method


token_auth = TokenAuth()


class GraphView(TemplateView):
    template_name = 'people/graph.html'

    def get_context_data(self, **kwargs):
        data = super().get_context_data(**kwargs)
        data['person_cls'] = Person
        return data


class GraphEnumView(View):
    def get(self, request, *args, **kwargs):
        enums = {
            'relationships': RelationshipStatus.StatusChoices.as_json(),
            'genders': Person.Genders.as_json(),
            'groups': Group.Categories.as_json(),
            'seminars': {
                group.name: group.name
                for group in Group.objects.filter(category=Group.Categories.SEMINAR)
            }
        }
        return JsonResponse(enums)


class GraphDataView(View):
    def get(self, request, *args, **kwargs):
        people = Person.objects.for_graph_serialization()
        response_data = {
            'nodes': PeopleSerializer(people, many=True).data,
            'edges': RelationshipSerializer(Relationship.objects.for_graph_serialization(people), many=True).data
        }
        return JsonResponse(response_data)
