from django import forms
from django.contrib import admin, messages
from django.http import HttpResponseRedirect
from django.template.loader import get_template
from django.urls import reverse

from users.models import ContentSuggestion, EmailPatternWhitelist, InviteCode


@admin.register(ContentSuggestion)
class ContentSuggestionAdmin(admin.ModelAdmin):
    readonly_fields = ('suggestion', 'submitted_by', 'date_created')


@admin.register(EmailPatternWhitelist)
class EmailPatternWhitelistAdmin(admin.ModelAdmin):
    list_display = ('pattern',)


class InviteCodeForm(forms.Form):
    number = forms.IntegerField()


@admin.register(InviteCode)
class InviteCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'copy_button', 'user')
    change_list_template = 'people/admin/invite_code_changelist.html'
    ordering = ['-user']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        print(request.META['SERVER_PORT'])
        self.request = request
        if request.method == 'POST' and 'generate_invites' in request.POST:
            form = InviteCodeForm(request.POST)
            if form.is_valid():
                codes = InviteCode.objects.bulk_generate(form.cleaned_data['number'])
                messages.success(request, f'Successfully created {len(codes)} codes')
                return HttpResponseRedirect(reverse('admin:users_invitecode_changelist'))

        return super().changelist_view(request, extra_context=extra_context)

    def copy_button(self, obj):
        if not obj.user:
            link = f'{self.request.scheme}://{self.request.get_host()}' + reverse('registration') + f'?code={obj.code}'
            return get_template('people/admin/copy_invite_link.html').render({'link': link})
