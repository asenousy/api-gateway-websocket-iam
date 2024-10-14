import json
import boto3


def handler(event, context):
    """
    Lambda function handler for API Gateway WebSockets.
    It handles the $default route, which is triggered when 
    a WebSocket connection is established.
    """
    
    # Get the connection ID from the event
    connection_id = event.get('requestContext', {}).get('connectionId')
    domain = event.get("requestContext", {}).get("domainName")
    stage = event.get("requestContext", {}).get("stage")

    apig_management_client = boto3.client(
        "apigatewaymanagementapi", endpoint_url=f"https://{domain}/{stage}"
    )

    apig_management_client.post_to_connection(
                    Data="yahooooooo", ConnectionId=connection_id
                )
    
    # Return a response with the connection ID
    return {
        'statusCode': 200,
        'body': json.dumps(f'Connected with ID: {connection_id}')
    }