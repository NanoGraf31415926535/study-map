from django.db import models
from projects.models import Project


class Cheatsheet(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='cheatsheets'
    )
    title = models.CharField(max_length=255, blank=True, default='')
    content = models.JSONField(default=dict)
    is_auto_generated = models.BooleanField(default=False)
    source_documents = models.ManyToManyField(
        'projects.Document',
        blank=True,
        related_name='cheatsheets'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title[:50] or 'Untitled Cheatsheet'}"

    def save(self, *args, **kwargs):
        if not self.title:
            from django.utils import timezone
            date_str = timezone.now().strftime('%Y-%m-%d')
            self.title = f"Cheatsheet - {date_str}"
        super().save(*args, **kwargs)