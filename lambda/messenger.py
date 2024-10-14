import os
import boto3
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
from websocket import create_connection

method = "GET"
service = 'execute-api'
region = os.environ['REGION']
ws_endpoint = os.environ['WS_ENDPOINT']

def handler(event, context):
    session = boto3.Session()

    request = AWSRequest(method, ws_endpoint)
    SigV4Auth(session.get_credentials(), service, region).add_auth(request)

    try:
        print("Connecting to " + ws_endpoint)
        print("Running Code")
        ws = create_connection(ws_endpoint, header=dict(request.headers))
        print("Connection created")
        print("Sending 'Hello, World'...")
        ws.send("Hello, World")
        print("Sent")
        print("Receiving...")
        result =  ws.recv()
        print("Received '%s'" % result)
        ws.close()
    except Exception as e:
        print(f'Error: {e}')

