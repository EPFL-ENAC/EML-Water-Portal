FROM python:3.11.7-bookworm
ENV POETRY_VERSION=2.1.3
RUN pip install "poetry==$POETRY_VERSION"
ENV PYTHONPATH="$PYTHONPATH:/app"

WORKDIR /app

COPY poetry.lock pyproject.toml /app/
RUN poetry config installer.max-workers 10
RUN poetry config virtualenvs.create false
RUN apt-get update && apt-get install -y g++ libpq-dev libgl1 gdal-bin libgdal-dev
RUN poetry install --no-interaction --no-root

COPY start.sh /app/
COPY api /app/api

ENTRYPOINT sh start.sh
