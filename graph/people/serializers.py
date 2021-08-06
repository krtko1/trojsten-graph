from rest_framework import serializers

from people.models import Person, Relationship, GroupMembership, RelationshipStatus


class GroupMembershipSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source='group.name')
    group_category = serializers.IntegerField(source='group.category')

    class Meta:
        model = GroupMembership
        fields = ('date_started', 'date_ended', 'group_name', 'group_category')


class PeopleSerializer(serializers.ModelSerializer):
    memberships = serializers.SerializerMethodField()

    def get_memberships(self, instance):
        return GroupMembershipSerializer(instance.visible_memberships, many=True).data

    class Meta:
        model = Person
        fields = ('id', 'first_name', 'last_name', 'maiden_name', 'nickname', 'gender', 'birth_date', 'death_date', 'memberships')


class RelationshipStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = RelationshipStatus
        fields = ('status', 'date_start', 'date_end')


class RelationshipSerializer(serializers.ModelSerializer):
    statuses = serializers.SerializerMethodField()
    source = serializers.IntegerField(source='first_person.pk')
    target = serializers.IntegerField(source='second_person.pk')

    def get_statuses(self, instance):
        return RelationshipStatusSerializer(instance.recent_statuses, many=True).data

    class Meta:
        model = Relationship
        fields = ('id', 'source', 'target', 'statuses')
