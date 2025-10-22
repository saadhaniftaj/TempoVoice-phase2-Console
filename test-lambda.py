#!/usr/bin/env python3
import boto3
import json

# Create Lambda client
lambda_client = boto3.client('lambda', region_name='us-east-1')

# Test payload
payload = {
    "action": "deploy",
    "agentId": "test-manual-deploy-" + str(int(__import__('time').time())),
    "config": {
        "name": "Manual Test Agent",
        "prompt": "You are a helpful AI assistant for testing purposes. Respond professionally and assist users with their inquiries.",
        "guardrails": [
            "Always be polite and professional",
            "Do not provide harmful or inappropriate content",
            "If you don't know something, say so"
        ],
        "knowledgeBase": "This is a test knowledge base for manual Lambda invocation testing. The agent should use this information to help users.",
        "callPhoneNumber": "+1234567890",
        "transferPhoneNumber": "+1987654321",
        "summaryPhoneNumber": "+1122334455",
        "twilioAccountSid": "ACtest123456789012345678901234567890",
        "twilioApiSid": "SKtest123456789012345678901234567890",
        "twilioApiSecret": "test_twilio_api_secret_key",
        "voiceId": "tiffany"
    }
}

try:
    # Invoke Lambda function
    response = lambda_client.invoke(
        FunctionName='shttempo-deploy-agent',
        InvocationType='RequestResponse',
        Payload=json.dumps(payload)
    )
    
    # Read response
    response_payload = json.loads(response['Payload'].read())
    print("Lambda Response:")
    print(json.dumps(response_payload, indent=2))
    
    # Check status code
    if response['StatusCode'] == 200:
        print("\n✅ Lambda execution successful!")
        if 'statusCode' in response_payload and response_payload['statusCode'] == 200:
            print("✅ Agent deployment workflow completed!")
            if 'body' in response_payload:
                body = json.loads(response_payload['body'])
                if 'serviceUrl' in body:
                    print(f"🌐 ALB URL: {body['serviceUrl']}")
                if 'message' in body:
                    print(f"📝 Message: {body['message']}")
        else:
            print("❌ Lambda execution failed")
            print(f"Error: {response_payload}")
    else:
        print(f"❌ Lambda invocation failed with status code: {response['StatusCode']}")
        
except Exception as e:
    print(f"❌ Error invoking Lambda: {str(e)}")
