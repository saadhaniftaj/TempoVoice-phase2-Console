"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.availableTools = void 0;
exports.toolProcessor = toolProcessor;
//GET rental policy details
const getPolicyDetailsSchema = JSON.stringify({
    "type": "object",
    "properties": {
        "question": {
            "type": "string",
            "description": "The question the users asks about the car rental policy"
        }
    },
    "required": [
        "question"
    ]
});
function getPolicyDetails({ question: string }) {
    return {
        answer: "You are well within the policy limits and you should be able to do that without any issues"
    };
}
const getPolicyDetailsToolSpec = {
    toolSpec: {
        name: "getPolicyDetails",
        description: "get car rental policies",
        inputSchema: {
            json: getPolicyDetailsSchema
        }
    }
};
//GET booking status
const getReservationStatusSchema = JSON.stringify({
    "type": "object",
    "properties": {
        "bookingNumber": {
            "type": "string",
            "description": "The reservation  number for the rental car booked"
        }
    },
    "required": []
});
function getReservationStatus({ bookingNumber }) {
    if (!bookingNumber)
        bookingNumber = "98786843";
    return {
        bookingNumber,
        status: "confirmed"
    };
}
const getReservationStatusToolSpec = {
    toolSpec: {
        name: "getReservationStatus",
        description: "get the status of the rental car booked by the customer.",
        inputSchema: {
            json: getReservationStatusSchema
        }
    }
};
//CANCEL booking
const cancelReservationSchema = JSON.stringify({
    "type": "object",
    "properties": {
        "bookingNumber": {
            "type": "string",
            "description": "The reservation number for the cancellation"
        }
    },
    "required": []
});
function cancelReservation({ bookingNumber }) {
    if (!bookingNumber)
        bookingNumber = "98786843";
    return {
        bookingNumber,
        'canceled': true
    };
}
const cancelReservationToolSpec = {
    toolSpec: {
        name: "cancelReservation",
        description: "request to cancel the booking of a customer",
        inputSchema: {
            json: cancelReservationSchema
        }
    }
};
const DefaultToolSchema = JSON.stringify({
    "type": "object",
    "properties": {},
    "required": []
});
//SUPPORT - call to an agent
const supportToolSpec = {
    toolSpec: {
        name: "support",
        description: "Help with billing issues, charges and refunds. Connects to a human support agent",
        inputSchema: {
            json: DefaultToolSchema
        }
    }
};
//END_CALL - gracefully end the call
const endCallToolSpec = {
    toolSpec: {
        name: "end_call",
        description: "End the call gracefully when customer says goodbye or wants to hang up",
        inputSchema: {
            json: DefaultToolSchema
        }
    }
};
//TRANSFER_CALL - transfer to human agent
const transferCallSchema = JSON.stringify({
    "type": "object",
    "properties": {
        "department": {
            "type": "string",
            "description": "Department to transfer to (support, sales, billing, manager)"
        },
        "reason": {
            "type": "string",
            "description": "Reason for transfer (optional)"
        }
    },
    "required": ["department"]
});
const transferCallToolSpec = {
    toolSpec: {
        name: "transfer_call",
        description: "Transfer call to a human agent in specified department",
        inputSchema: {
            json: transferCallSchema
        }
    }
};
//WARM_TRANSFER - warm transfer with whisper
const warmTransferToolSpec = {
    toolSpec: {
        name: "warm_transfer",
        description: "Warm transfer to human agent with context briefing",
        inputSchema: {
            json: transferCallSchema
        }
    }
};
//COLD_TRANSFER - direct transfer
const coldTransferToolSpec = {
    toolSpec: {
        name: "cold_transfer",
        description: "Direct transfer to human agent without briefing",
        inputSchema: {
            json: transferCallSchema
        }
    }
};
//VOICEMAIL - initiate voicemail recording
const voicemailToolSpec = {
    toolSpec: {
        name: "voicemail",
        description: "Start voicemail recording when customer wants to leave a message",
        inputSchema: {
            json: DefaultToolSchema
        }
    }
};
//SCHEDULE_CALLBACK - schedule a callback
const scheduleCallbackSchema = JSON.stringify({
    "type": "object",
    "properties": {
        "customerPhone": {
            "type": "string",
            "description": "Customer's phone number for callback"
        },
        "preferredTime": {
            "type": "string",
            "description": "Customer's preferred callback time"
        },
        "reason": {
            "type": "string",
            "description": "Reason for callback"
        }
    },
    "required": ["customerPhone", "preferredTime"]
});
const scheduleCallbackToolSpec = {
    toolSpec: {
        name: "schedule_callback",
        description: "Schedule a callback for the customer at their preferred time",
        inputSchema: {
            json: scheduleCallbackSchema
        }
    }
};
function callSupport() {
    console.log(`SMK: billing tool`);
    return {
        answer: "Let me get you an agent to help you ..."
    };
}
function endCall() {
    console.log(`SMK: end_call tool invoked`);
    return {
        answer: "Thank you for calling The Car Genie. Have a great day!"
    };
}
function transferCall({ department, reason }) {
    console.log(`SMK: transfer_call tool invoked - department: ${department}, reason: ${reason || 'none'}`);
    return {
        answer: `I'm transferring you to our ${department} department. Please hold while I connect you.`,
        department: department,
        reason: reason || 'Customer requested transfer'
    };
}
function warmTransfer({ department, reason }) {
    console.log(`SMK: warm_transfer tool invoked - department: ${department}, reason: ${reason || 'none'}`);
    return {
        answer: `I'm connecting you to our ${department} specialist who will be briefed on your inquiry. Please hold for a moment.`,
        department: department,
        reason: reason || 'Customer requested warm transfer'
    };
}
function coldTransfer({ department, reason }) {
    console.log(`SMK: cold_transfer tool invoked - department: ${department}, reason: ${reason || 'none'}`);
    return {
        answer: `I'm transferring you directly to our ${department} department. Thank you for calling The Car Genie.`,
        department: department,
        reason: reason || 'Customer requested direct transfer'
    };
}
function voicemail() {
    console.log(`SMK: voicemail tool invoked`);
    return {
        answer: "I'll start recording your message now. Please speak after the tone and our team will get back to you."
    };
}
function scheduleCallback({ customerPhone, preferredTime, reason }) {
    console.log(`SMK: schedule_callback tool invoked - phone: ${customerPhone}, time: ${preferredTime}, reason: ${reason || 'none'}`);
    return {
        answer: `I've scheduled a callback for you at ${preferredTime}. Our team will call you at ${customerPhone}. Is there anything else I can help you with?`,
        callbackScheduled: true,
        phone: customerPhone,
        time: preferredTime,
        reason: reason || 'Customer requested callback'
    };
}
//GET date tool
const getDateToolSpec = {
    toolSpec: {
        name: "getDateTool",
        description: "get information about the current date",
        inputSchema: {
            json: DefaultToolSchema
        }
    }
};
function getDate() {
    const date = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
    const pstDate = new Date(date);
    return {
        date: pstDate.toISOString().split('T')[0],
        year: pstDate.getFullYear(),
        month: pstDate.getMonth() + 1,
        day: pstDate.getDate(),
        dayOfWeek: pstDate.toLocaleString('en-US', { weekday: 'long' }).toUpperCase(),
        timezone: "PST"
    };
}
//GET date tool
const getTimeToolSpec = {
    toolSpec: {
        name: "getTimeTool",
        description: "get information about the current time",
        inputSchema: {
            json: DefaultToolSchema
        }
    }
};
function getTime() {
    const pstTime = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
    return {
        timezone: "PST",
        formattedTime: new Date(pstTime).toLocaleTimeString('en-US', {
            hour12: true,
            hour: '2-digit',
            minute: '2-digit'
        })
    };
}
const availableTools = [
    getDateToolSpec,
    getTimeToolSpec,
    getPolicyDetailsToolSpec,
    getReservationStatusToolSpec,
    cancelReservationToolSpec,
    supportToolSpec,
    endCallToolSpec,
    transferCallToolSpec,
    warmTransferToolSpec,
    coldTransferToolSpec,
    voicemailToolSpec,
    scheduleCallbackToolSpec
];
exports.availableTools = availableTools;
//all names are converted to lowercase
const toolHandlers = {
    "getpolicydetails": getPolicyDetails,
    "getreservationstatus": getReservationStatus,
    "cancelreservation": cancelReservation,
    "support": callSupport,
    "end_call": endCall,
    "transfer_call": transferCall,
    "warm_transfer": warmTransfer,
    "cold_transfer": coldTransfer,
    "voicemail": voicemail,
    "schedule_callback": scheduleCallback,
    "getdatetool": getDate,
    "gettimetool": getTime
};
async function toolProcessor(toolName, toolArgs) {
    console.log(toolArgs);
    const args = JSON.parse(toolArgs);
    console.log(`Tool ${toolName} invoked with args ${args}`);
    if (toolName in toolHandlers) {
        const tool = toolHandlers[toolName];
        if (tool.constructor.name === "AsyncFunction") {
            return await toolHandlers[toolName](args);
        }
        else {
            return toolHandlers[toolName](args);
        }
    }
    else {
        console.log(`Tool ${toolName} not supported`);
        return {
            message: "I cannot help you with that request",
            success: false
        };
    }
}
//# sourceMappingURL=mock-tools.js.map