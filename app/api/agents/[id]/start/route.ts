import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, AgentStatus } from '../../../../generated/prisma/index';
import { AuthService } from '../../../../../src/lib/auth';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const authService = new AuthService();
    const user = authService.verifyToken(token);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: agentId } = await params;

    // Check if agent exists and belongs to user's tenant
    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        tenantId: user.tenantId
      }
    });

    if (!agent) {
      return NextResponse.json(
        { message: 'Agent not found' },
        { status: 404 }
      );
    }

    // Update agent status to DEPLOYING
    await prisma.agent.update({
      where: { id: agentId },
      data: { status: AgentStatus.DEPLOYING }
    });

    // Invoke deployment Lambda
    const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
    const functionName = process.env.DEPLOY_AGENT_LAMBDA || 'shttempo-deploy-agent';
    const payload = {
      action: 'deploy',
      agentId,
      tenantId: user.tenantId,
      config: {
        name: agent.name,
        prompt: agent.prompt,
        guardrails: agent.guardrails,
        knowledgeBase: agent.knowledgeBase,
        callPhoneNumber: agent.callPhoneNumber,
        transferPhoneNumber: agent.transferPhoneNumber,
        summaryPhoneNumber: agent.summaryPhoneNumber,
        twilioAccountSid: agent.twilioAccountSid,
        twilioApiSid: agent.twilioApiSid,
        twilioApiSecret: agent.twilioApiSecret,
        voiceId: agent.voiceId,
      }
    };

    const invoke = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: 'RequestResponse',
      Payload: Buffer.from(JSON.stringify(payload))
    });

    const result = await lambda.send(invoke);
    const responseString = result.Payload ? Buffer.from(result.Payload).toString('utf-8') : '{}';
    const responseJson = JSON.parse(responseString || '{}') as { serviceUrl?: string; webhookUrl?: string; error?: string };

    if (responseJson.error) {
      await prisma.agent.update({ where: { id: agentId }, data: { status: AgentStatus.ERROR } });
      return NextResponse.json({ message: 'Deployment failed', error: responseJson.error }, { status: 500 });
    }

    const serviceUrl = responseJson.webhookUrl || responseJson.serviceUrl;

    // Persist webhook endpoint and activate agent
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: AgentStatus.ACTIVE,
        webhookEndpoint: serviceUrl || null,
      }
    });

    // Update phone number mapping with webhook URL
    if (serviceUrl && agent.callPhoneNumber) {
      await prisma.phoneNumber.updateMany({
        where: { number: agent.callPhoneNumber },
        data: { webhookUrl: serviceUrl }
      });
    }

    return NextResponse.json({
      message: 'Agent deployment started'
    });

  } catch (error) {
    console.error('Error starting agent:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
