import influxdb_client, os, time
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS

token = os.environ.get("INFLUXDB_TOKEN")
org = "urban_twin"
url = "https://urbantwinwaterdata.epfl.ch:8086"

client = influxdb_client.InfluxDBClient(url=url, token=token, org=org)

query_api = client.query_api()

query = """from(bucket: "urban_twin_water_data")
 |> range(start: -2d)
 |> filter(fn: (r) => r._measurement == "hydrovu")"""
tables = query_api.query(query, org="urban_twin")

for table in tables:
  for record in table.records:
    print(record)
