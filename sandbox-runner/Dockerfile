FROM python:3.11-slim

# Create dedicated non-root users and groups:
# - supervisor (uid 1000): runs trusted runner API, holds signing key, evaluates hidden tests
# - sandbox_user (uid 65534): completely unprivileged user that executes candidate code
RUN groupadd -g 1000 supervisor && \
    useradd -u 1000 -g supervisor -m -s /bin/bash supervisor && \
    (groupadd -g 65534 sandbox_user 2>/dev/null || true) && \
    (useradd -u 65534 -g 65534 -d /nonexistent -s /usr/sbin/nologin sandbox_user 2>/dev/null || true) && \
    mkdir -p /app /tests/hidden /tmp/sandbox && \
    chown -R supervisor:supervisor /app /tests/hidden && \
    chmod 0750 /app && \
    chmod 0700 /tests/hidden && \
    chmod 1777 /tmp/sandbox

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY supervisor.py .
COPY test_suites/ /tests/

USER supervisor

ENV PORT=8080
EXPOSE 8080

CMD ["python", "supervisor.py"]
