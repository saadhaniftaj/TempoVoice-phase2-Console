import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma, AgentStatus } from '../../generated/prisma/index';
import { AuthService } from '../../../src/lib/auth';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
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

    // Get agents for the user's tenant
    const agents = await prisma.agent.findMany({
      where: {
        tenantId: user.tenantId
      },
      select: {
        id: true,
        name: true,
        status: true,
        callPhoneNumber: true,
        webhookEndpoint: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ agents });

  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      name,
      knowledgeBase,
      prompt,
      guardrails,
      makeEndpoint,
      callPhoneNumber,
      transferPhoneNumber,
      summaryPhoneNumber,
      twilioAccountSid,
      twilioApiSecret,
      twilioApiSid,
      voiceId
    } = body;

    // Validate required fields
    if (!name || !knowledgeBase || !prompt || !guardrails || !makeEndpoint || 
        !callPhoneNumber || !transferPhoneNumber || !summaryPhoneNumber || 
        !twilioAccountSid || !twilioApiSecret || !twilioApiSid || !voiceId) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if the phone number is available
    const phoneNumber = await prisma.phoneNumber.findFirst({
      where: {
        number: callPhoneNumber,
        isAvailable: true
      }
    });

    if (!phoneNumber) {
      return NextResponse.json(
        { message: 'Selected phone number is not available' },
        { status: 400 }
      );
    }

    // Generate webhook endpoint (we'll update this after agent creation)
    const webhookEndpoint = `${process.env.NEXT_PUBLIC_BASE_URL}/api/agents/webhook`;

    // Create the agent
    const agent = await prisma.agent.create({
      data: {
        name,
        knowledgeBase,
        prompt,
        guardrails: Array.isArray(guardrails) ? JSON.stringify(guardrails) : guardrails,
        makeEndpoint,
        callPhoneNumber,
        transferPhoneNumber,
        summaryPhoneNumber,
        twilioAccountSid,
        twilioApiSecret,
        twilioApiSid,
        voiceId,
        webhookEndpoint,
        // required json column
        config: {} as Prisma.JsonObject,
        tenantId: user.tenantId || 'default',
        createdBy: user.id,
        status: 'PENDING'
      }
    });

    // Mark phone number as unavailable and assign to agent
    await prisma.phoneNumber.update({
      where: { id: phoneNumber.id },
      data: {
        isAvailable: false,
        agentId: agent.id,
        webhookUrl: webhookEndpoint
      }
    });

    // Automatically deploy the agent after creation
    try {
      console.log(`🚀 Auto-deploying agent ${agent.id}...`);
      const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
      const functionName = process.env.DEPLOY_AGENT_LAMBDA || 'DeployTempoVoiceAgent';
      const payload = {
        action: 'deploy',
        agentId: agent.id,
        config: {
          prompt: agent.prompt,
          guardrails: JSON.parse(agent.guardrails),
          knowledgeBase: agent.knowledgeBase,
          callPhoneNumber: agent.callPhoneNumber,
          transferPhoneNumber: agent.transferPhoneNumber,
          summaryPhoneNumber: agent.summaryPhoneNumber,
          twilioAccountSid: agent.twilioAccountSid,
          twilioApiSecret: agent.twilioApiSecret,
          twilioApiSid: agent.twilioApiSid,
          voiceId: agent.voiceId,
          makeEndpoint: agent.makeEndpoint
        }
      };

      const invoke = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(JSON.stringify(payload))
      });

      const result = await lambda.send(invoke);
      const responseString = result.Payload ? Buffer.from(result.Payload).toString('utf-8') : '{}';
      const lambdaResponse = JSON.parse(responseString || '{}');
      
      // Lambda returns data in the 'body' field as a JSON string
      const responseJson = lambdaResponse.body ? JSON.parse(lambdaResponse.body) : lambdaResponse;
      
      console.log('Lambda auto-deploy response:', responseJson);

      if (responseJson.error) {
        console.error('Auto-deployment failed:', responseJson.error);
        // Update agent status to ERROR but don't fail the creation
        await prisma.agent.update({ 
          where: { id: agent.id }, 
          data: { status: AgentStatus.ERROR } 
        });
        
        return NextResponse.json({
          message: 'Agent created but deployment failed',
          agent: {
            id: agent.id,
            name: agent.name,
            status: 'ERROR',
            webhookEndpoint: agent.webhookEndpoint
          },
          deploymentError: responseJson.error
        });
      }

      const serviceUrl = responseJson.webhookUrl || responseJson.serviceUrl;

      // Update agent with deployment results
      const updatedAgent = await prisma.agent.update({
        where: { id: agent.id },
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
        message: 'Agent created and deployed successfully',
        agent: {
          id: updatedAgent.id,
          name: updatedAgent.name,
          status: updatedAgent.status,
          webhookEndpoint: updatedAgent.webhookEndpoint
        },
        deployment: {
          serviceUrl: responseJson.serviceUrl,
          webhookUrl: responseJson.webhookUrl,
          targetGroupArn: responseJson.targetGroupArn,
          taskDefinitionArn: responseJson.taskDefinitionArn
        }
      });

    } catch (deploymentError) {
      console.error('Auto-deployment error:', deploymentError);
      // Update agent status to ERROR but don't fail the creation
      await prisma.agent.update({ 
        where: { id: agent.id }, 
        data: { status: AgentStatus.ERROR } 
      });
      
      return NextResponse.json({
        message: 'Agent created but deployment failed',
        agent: {
          id: agent.id,
          name: agent.name,
          status: 'ERROR',
          webhookEndpoint: agent.webhookEndpoint
        },
        deploymentError: deploymentError instanceof Error ? deploymentError.message : String(deploymentError)
      });
    }

  } catch (error) {
    console.error('Error creating agent:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}