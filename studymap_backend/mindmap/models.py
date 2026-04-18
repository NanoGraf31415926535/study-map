from django.db import models
from projects.models import Project


class MindMap(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='mindmaps'
    )
    title = models.CharField(max_length=255)
    data = models.JSONField()
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-generated_at']

    def __str__(self):
        return self.title