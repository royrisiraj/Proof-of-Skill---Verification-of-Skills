import time
import pytest

# Note: Candidate code is never imported at module level.
# The test harness imports candidate module dynamically inside isolated execution subprocess.

def test_single_expired_event_purged(limiter_module):
    SessionLimiter = limiter_module.SessionLimiter
    limiter = SessionLimiter(window_seconds=60, max_events=5)
    now = time.time()
    limiter.add_event("evt_1", timestamp=now - 120)  # Expired
    limiter.add_event("evt_2", timestamp=now - 10)   # Active
    purged_count = limiter.purge_expired(current_time=now)
    assert purged_count == 1
    assert len(limiter.get_active_events()) == 1

def test_consecutive_expired_events_purge(limiter_module):
    SessionLimiter = limiter_module.SessionLimiter
    limiter = SessionLimiter(window_seconds=60, max_events=5)
    now = time.time()
    limiter.add_event("exp_1", timestamp=now - 100)
    limiter.add_event("exp_2", timestamp=now - 90)
    limiter.add_event("active_1", timestamp=now - 10)
    purged_count = limiter.purge_expired(current_time=now)
    assert purged_count == 2
    assert len(limiter.get_active_events()) == 1

def test_exact_window_cutoff_boundary(limiter_module):
    SessionLimiter = limiter_module.SessionLimiter
    limiter = SessionLimiter(window_seconds=60, max_events=5)
    now = time.time()
    limiter.add_event("border_exact", timestamp=now - 60)
    limiter.add_event("inside_window", timestamp=now - 59.9)
    purged_count = limiter.purge_expired(current_time=now)
    assert purged_count == 1
    assert len(limiter.get_active_events()) == 1
