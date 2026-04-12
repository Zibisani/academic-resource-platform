from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from resources.models import Resource, RankingWeight
from django.db.models import F, Q

class Command(BaseCommand):
    help = 'Recalculates cached_score for resources'

    def get_weight(self, name, default):
        w = RankingWeight.objects.filter(weight_name=name).first()
        return w.value if w else default

    def handle(self, *args, **options):
        one_hour_ago = timezone.now() - timedelta(hours=1)
        
        # Resources to process: score_updated_at is null OR older than 1 hour
        resources = Resource.objects.filter(
            Q(score_updated_at__isnull=True) | 
            Q(score_updated_at__lt=one_hour_ago)
        )
        
        count = resources.count()
        if count == 0:
            self.stdout.write('No resources need score recalculation.')
            return

        w_rating = self.get_weight('rating_weight', 2.0)
        w_download = self.get_weight('download_weight', 1.0)
        w_view = self.get_weight('view_weight', 0.1)
        w_staff = self.get_weight('staff_pick_bonus', 50.0)
        w_verified = self.get_weight('verified_contributor_bonus', 20.0)
        
        for r in resources:
            score = 0.0
            score += r.average_rating * r.rating_count * w_rating
            score += r.download_count * w_download
            score += r.view_count * w_view
            if r.is_staff_pick:
                score += w_staff
            if r.uploader and getattr(r.uploader, 'is_verified_contributor', False):
                score += w_verified
                
            r.cached_score = score
            r.score_updated_at = timezone.now()
            r.save(update_fields=['cached_score', 'score_updated_at'])

        self.stdout.write(self.style.SUCCESS(f'Successfully recalculated scores for {count} resources.'))
