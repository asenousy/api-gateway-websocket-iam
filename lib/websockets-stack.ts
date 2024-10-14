import { Construct } from 'constructs';
import { Duration, Stack, StackProps, aws_apigatewayv2 as apigwv2, aws_iam, aws_lambda } from 'aws-cdk-lib';
import * as python from '@aws-cdk/aws-lambda-python-alpha';
import { WebSocketIamAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

export class WebsocketsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const defaultHandler = new aws_lambda.Function(this, 'DefaultHandler', {
      runtime: aws_lambda.Runtime.PYTHON_3_10,
      code: aws_lambda.Code.fromAsset('lambda'),
      handler: 'message-handler.handler',
      timeout: Duration.minutes(3),
    });

    const webSocketApi = new apigwv2.WebSocketApi(this, 'mywsapi', {
      defaultRouteOptions: { integration: new WebSocketLambdaIntegration('DefaultIntegration', defaultHandler) },
    });
    
    const stage = new apigwv2.WebSocketStage(this, 'mystage', {
      webSocketApi,
      stageName: 'dev',
      autoDeploy: true,
    });

    const messengerFn = new python.PythonFunction(this, 'MessengerFn', {
      entry: 'lambda',
      runtime: aws_lambda.Runtime.PYTHON_3_10,
      index: 'messenger.py',
      timeout: Duration.minutes(1),
      environment: {
        REGION: this.region,
        WS_ENDPOINT: stage.url
      }
    });

    const connectHandler = new aws_lambda.Function(this, 'ConnectHandler', {
      runtime: aws_lambda.Runtime.PYTHON_3_10,
      code: aws_lambda.Code.fromAsset('lambda'),
      handler: 'connect-handler.handler',
      timeout: Duration.minutes(1),
    });

    webSocketApi.grantManageConnections(defaultHandler)
    webSocketApi.grantManageConnections(connectHandler)
    webSocketApi.grantManageConnections(messengerFn)

    webSocketApi.addRoute('$connect', {
      integration: new WebSocketLambdaIntegration('Integration', connectHandler),
      authorizer: new WebSocketIamAuthorizer()
    });

    const webSocketArn = Stack.of(this).formatArn({
      service: 'execute-api',
      resource: webSocketApi.apiId,
    });

    messengerFn.addToRolePolicy(new aws_iam.PolicyStatement({
      actions: ['execute-api:Invoke'],
      resources: [webSocketArn+`/${stage.stageName}/*`],
    }))
  }
}
