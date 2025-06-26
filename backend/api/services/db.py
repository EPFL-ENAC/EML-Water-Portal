import datetime
from influxdb_client import InfluxDBClient
from api.config import config
from fastapi.logger import logger
from api.models.measures import DBFilters


class DBClient:
    def __init__(self):
        self.client = InfluxDBClient(
            url=config.INFLUXDB_URL, token=config.INFLUXDB_TOKEN, org=config.INFLUXDB_ORG)

    def close(self):
        self.client.close()

    def execute(self, query_str: str, filters: DBFilters):
        logger.info(f"Executing query: {query_str}")
        query_api = self.client.query_api()
        tables = query_api.query(query_str, org=config.INFLUXDB_ORG)
        time = []
        value = []
        measure = []
        param_measures = {}
        for filter in filters.measures:
            param_measures[filter.value] = filter.measure
        for table in tables:
            for record in table.records:
                param = record.values.get(filters.field)
                if param not in param_measures:
                    continue
                time.append(record.get_time())
                value.append(record.get_value())
                measure.append(param_measures[param])
        return time, value, measure


class DBQuery:

    def __init__(self, name: str, measurement, start: str, stop: str = None):
        self.name = name
        self.query_str = f"from(bucket: \"{config.INFLUXDB_BUCKET}\")"
        if stop:
            self.query_str += f" |> range(start: {self._stringify(start)}, stop: {self._stringify(stop)})"
        else:
            self.query_str += f" |> range(start: {self._stringify(start)})"
        self.query_str += f" |> filter(fn: (r) => r._measurement == \"{measurement}\")"

    def aggregate(self, every: str, fn: str = "mean"):
        self.query_str += f" |> aggregateWindow(every: {every}, fn: {fn}, createEmpty: true)"
        # self.query_str += f" |> yield(name: \"{fn}\")"
        return self

    def filter(self, field: str, value: str):
        self.query_str += f" |> filter(fn: (r) => r.{field} == \"{value}\")"
        return self

    def min_max(self, min_value: float, max_value: float):
        if min_value is None and max_value is None:
            return self
        if min_value is not None and max_value is not None:
            self.query_str += f" |> filter(fn: (r) => r._value >= {self._stringify(min_value)} and r._value <= {self._stringify(max_value)})"
        elif min_value is not None:
            self.query_str += f" |> filter(fn: (r) => r._value >= {self._stringify(min_value)})"
        elif max_value is not None:
            self.query_str += f" |> filter(fn: (r) => r._value <= {self._stringify(max_value)})"
        return self

    def not_null(self):
        self.query_str += f" |> filter(fn: (r) => exists r._value)"
        return self

    def to_string(self):
        return self.query_str

    def _stringify(self, value):
        if isinstance(value, str):
            return value
        if isinstance(value, datetime.datetime):
            return value.strftime("%Y-%m-%dT%H:%M:%SZ")
        return str(value)


class DBUnionQuery:
    def __init__(self):
        self.queries = []

    def add_query(self, query: DBQuery):
        self.queries.append(query)

    def to_string(self):
        if not self.queries:
            return ""

        if len(self.queries) == 1:
            return self.queries[0].to_string()

        # Create a union query string
        if not all(isinstance(query, DBQuery) for query in self.queries):
            raise ValueError("All queries must be instances of DBQuery")
        if not all(query.name for query in self.queries):
            raise ValueError("All queries must have a name")
        if not all(query.query_str for query in self.queries):
            raise ValueError("All queries must have a query string")

        statements = "\n".join(
            [f"{query.name} = {query.to_string()}" for query in self.queries])

        query_str = f"{statements}\n"
        query_str += "union(tables: ["
        query_str += ", ".join([f"{query.name}" for query in self.queries])
        query_str += "])"
        return query_str


db_client = DBClient()
