from influxdb_client import InfluxDBClient
from api.config import config


class DBClient:
    def __init__(self):
        self.client = InfluxDBClient(
            url=config.INFLUXDB_URL, token=config.INFLUXDB_TOKEN, org=config.INFLUXDB_ORG)

    def close(self):
        self.client.close()

    def query(self, measurement):
        self.query_str = f"from(bucket: '{config.INFLUXDB_BUCKET}')"
        self.query_str += f" |> filter(fn: (r) => r._measurement == '{measurement}')"
        return self

    def range(self, start: str, stop: str = None):
        if stop:
            self.query_str += f" |> range(start: {start}, stop: {stop})"
        else:
            self.query_str += f" |> range(start: {start})"
        return self

    def aggregate(self, every: str, fn: str = "mean"):
        self.query_str += f" |> aggregateWindow(every: {every}, fn: {fn}, createEmpty: false)"
        self.query_str += f" |> yield(name: '{fn}')"
        return self

    def filter(self, key: str, value: str):
        self.query_str += f" |> filter(fn: (r) => r.'{key}' == '{value}')"
        return self

    def execute(self):
        query_api = self.client.query_api()
        tables = query_api.query(self.query_str, org=config.INFLUXDB_ORG)
        time = []
        value = []
        for table in tables:
            for record in table.records:
                time.append(record.get_time())
                value.append(record.get_value())
        return time, value


db_client = DBClient()
