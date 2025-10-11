import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, AgentStatus } from '../../../generated/prisma/index';
import { AuthService } from '../../../../src/lib/auth';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const prisma = new PrismaClient();

export async function DELETE(
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

    // If agent is ACTIVE, delete it from AWS infrastructure first
    if (agent.status === 'ACTIVE') {
      try {
        console.log(`Deleting agent ${agentId} from AWS infrastructure...`);
        const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
        const functionName = process.env.DEPLOY_AGENT_LAMBDA || 'DeployTempoVoiceAgent';
        const payload = { action: 'delete', agentId };
        const invoke = new InvokeCommand({
          FunctionName: functionName,
          InvocationType: 'RequestResponse',
          Payload: Buffer.from(JSON.stringify(payload))
        });
        
        const result = await lambda.send(invoke);
        const responseString = result.Payload ? Buffer.from(result.Payload).toString('utf-8') : '{}';
        const lambdaResponse = JSON.parse(responseString || '{}');
        
        console.log('Lambda delete response:', lambdaResponse);
        
        if (lambdaResponse.error) {
          console.error('Failed to delete from AWS:', lambdaResponse.error);
          // Continue with database deletion even if AWS deletion fails
        }
      } catch (error) {
        console.error('Error calling Lambda delete:', error);
        // Continue with database deletion even if AWS deletion fails
      }
    }

    // Free up the phone number if it's assigned
    if (agent.callPhoneNumber) {
      await prisma.phoneNumber.updateMany({
        where: { number: agent.callPhoneNumber },
        data: {
          isAvailable: true,
          agentId: null,
          webhookUrl: null
        }
      });
    }

    // Delete the agent from database
    await prisma.agent.delete({
      where: { id: agentId }
    });

    return NextResponse.json({
      message: 'Agent deleted successfully from both database and AWS infrastructure'
    });

  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
