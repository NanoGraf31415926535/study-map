from django.db import models
from projects.models import Project


class Summary(models.Model):
    TYPE_CHOICES = [
        ('cornell', 'Cornell Notes'),
        ('study', 'Study Guide'),
        ('research', 'Research Summary'),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='summaries'
    )
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=500, blank=True, default='')
    data = models.JSONField()
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-generated_at']

    def __str__(self):
        return f"{self.type} - {self.title[:50]}"