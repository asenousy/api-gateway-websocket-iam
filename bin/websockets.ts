#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { WebsocketsStack } from '../lib/websockets-stack';

const app = new cdk.App();
new WebsocketsStack(app, 'WebsocketsStack');
