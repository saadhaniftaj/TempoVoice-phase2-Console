"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleCallTransferService = void 0;
const twilio_1 = require("twilio");
class SimpleCallTransferService {
    constructor(twilioClient) {
        this.transferLogs = new Map();
        this.twilioClient = twilioClient;
    }
    /**
     * Warm Transfer - Connect both parties before transferring
     */
    async warmTransfer(callSid, transferTo, reason = 'Customer requested transfer') {
        try {
            console.log(`Initiating warm transfer for call ${callSid} to ${transferTo}`);
            // Create TwiML for warm transfer
            const twimlResponse = new twilio_1.twiml.VoiceResponse();
            twimlResponse.say('Please hold while I connect you with a specialist.');
            const dial = twimlResponse.dial({
                timeout: 30,
                record: 'do-not-record'
            });
            dial.number(transferTo);
            // Update the call with the new TwiML
            await this.twilioClient.calls(callSid).update({
                twiml: twimlResponse.toString()
            });
            // Log the transfer
            const transferLog = {
                originalCallSid: callSid,
                transferTo,
                transferType: 'warm',
                timestamp: new Date(),
                reason,
                status: 'initiated'
            };
            this.transferLogs.set(callSid, transferLog);
            console.log(`Warm transfer initiated for call ${callSid}`);
            return {
                success: true,
                callSid,
                transferType: 'warm'
            };
        }
        catch (error) {
            console.error(`Error in warm transfer for call ${callSid}:`, error);
            return {
                success: false,
                error: error.message,
                transferType: 'warm'
            };
        }
    }
    /**
     * Cold Transfer - Direct transfer without connection
     */
    async coldTransfer(callSid, transferTo, reason = 'Direct transfer requested') {
        try {
            console.log(`Initiating cold transfer for call ${callSid} to ${transferTo}`);
            // Create TwiML for cold transfer
            const twimlResponse = new twilio_1.twiml.VoiceResponse();
            twimlResponse.say('Transferring your call now.');
            const dial = twimlResponse.dial({
                timeout: 30,
                record: 'do-not-record'
            });
            dial.number(transferTo);
            // Update the call with the new TwiML
            await this.twilioClient.calls(callSid).update({
                twiml: twimlResponse.toString()
            });
            // Log the transfer
            const transferLog = {
                originalCallSid: callSid,
                transferTo,
                transferType: 'cold',
                timestamp: new Date(),
                reason,
                status: 'initiated'
            };
            this.transferLogs.set(callSid, transferLog);
            console.log(`Cold transfer initiated for call ${callSid}`);
            return {
                success: true,
                callSid,
                transferType: 'cold'
            };
        }
        catch (error) {
            console.error(`Error in cold transfer for call ${callSid}:`, error);
            return {
                success: false,
                error: error.message,
                transferType: 'cold'
            };
        }
    }
    /**
     * Transfer to Department - Route based on department type
     */
    async transferToDepartment(callSid, department, reason = 'Department transfer') {
        try {
            console.log(`Transferring call ${callSid} to ${department} department`);
            // Map departments to phone numbers (these would be configured in your system)
            const departmentNumbers = {
                'support': '+17755935774', // Replace with actual support number
                'sales': '+17755935774', // Replace with actual sales number
                'billing': '+17755935774', // Replace with actual billing number
                'manager': '+17755935774' // Replace with actual manager number
            };
            const transferTo = departmentNumbers[department.toLowerCase()] || departmentNumbers['support'];
            // Create department-specific TwiML
            const twimlResponse = new twilio_1.twiml.VoiceResponse();
            twimlResponse.say(`I'm connecting you to our ${department} department. Please hold.`);
            const dial = twimlResponse.dial({
                timeout: 30,
                record: 'do-not-record'
            });
            dial.number(transferTo);
            // Update the call with the new TwiML
            await this.twilioClient.calls(callSid).update({
                twiml: twimlResponse.toString()
            });
            // Log the transfer
            const transferLog = {
                originalCallSid: callSid,
                transferTo,
                transferType: 'department',
                timestamp: new Date(),
                reason: `${department} department transfer: ${reason}`,
                status: 'initiated'
            };
            this.transferLogs.set(callSid, transferLog);
            console.log(`Department transfer initiated for call ${callSid} to ${department}`);
            return {
                success: true,
                callSid,
                transferType: 'department'
            };
        }
        catch (error) {
            console.error(`Error in department transfer for call ${callSid}:`, error);
            return {
                success: false,
                error: error.message,
                transferType: 'department'
            };
        }
    }
    /**
     * Emergency Transfer - Immediate transfer to emergency services
     */
    async emergencyTransfer(callSid, emergencyNumber, reason) {
        try {
            console.log(`EMERGENCY TRANSFER for call ${callSid} to ${emergencyNumber}: ${reason}`);
            // Create emergency TwiML
            const twimlResponse = new twilio_1.twiml.VoiceResponse();
            twimlResponse.say('This is an emergency transfer. Connecting you now.');
            const dial = twimlResponse.dial({
                timeout: 10,
                record: 'do-not-record'
            });
            dial.number(emergencyNumber);
            // Update the call with the new TwiML
            await this.twilioClient.calls(callSid).update({
                twiml: twimlResponse.toString()
            });
            // Log the emergency transfer
            const transferLog = {
                originalCallSid: callSid,
                transferTo: emergencyNumber,
                transferType: 'department', // Using department type for emergency
                timestamp: new Date(),
                reason: `EMERGENCY: ${reason}`,
                status: 'initiated'
            };
            this.transferLogs.set(callSid, transferLog);
            console.log(`EMERGENCY transfer completed for call ${callSid}`);
            return {
                success: true,
                callSid,
                transferType: 'department'
            };
        }
        catch (error) {
            console.error(`CRITICAL ERROR in emergency transfer for call ${callSid}:`, error);
            return {
                success: false,
                error: error.message,
                transferType: 'department'
            };
        }
    }
    /**
     * Get transfer status for a call
     */
    getTransferStatus(callSid) {
        return this.transferLogs.get(callSid) || null;
    }
    /**
     * Get transfer statistics
     */
    getTransferStats() {
        const transfers = Array.from(this.transferLogs.values());
        const stats = {
            totalTransfers: transfers.length,
            byType: {
                warm: transfers.filter(t => t.transferType === 'warm').length,
                cold: transfers.filter(t => t.transferType === 'cold').length,
                department: transfers.filter(t => t.transferType === 'department').length
            },
            byStatus: {
                initiated: transfers.filter(t => t.status === 'initiated').length,
                completed: transfers.filter(t => t.status === 'completed').length,
                failed: transfers.filter(t => t.status === 'failed').length
            },
            recentTransfers: transfers
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .slice(0, 10)
        };
        return stats;
    }
    /**
     * Update transfer status (called by webhooks)
     */
    updateTransferStatus(callSid, status) {
        const transfer = this.transferLogs.get(callSid);
        if (transfer) {
            transfer.status = status;
            console.log(`Transfer status updated for call ${callSid}: ${status}`);
        }
    }
    /**
     * Get all transfer logs
     */
    getAllTransferLogs() {
        return Array.from(this.transferLogs.values());
    }
    /**
     * Clean up old transfer logs
     */
    cleanupOldLogs(daysToKeep = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        let cleanedCount = 0;
        for (const [callSid, transfer] of this.transferLogs.entries()) {
            if (transfer.timestamp < cutoffDate) {
                this.transferLogs.delete(callSid);
                cleanedCount++;
            }
        }
        console.log(`Cleaned up ${cleanedCount} old transfer logs`);
    }
}
exports.SimpleCallTransferService = SimpleCallTransferService;
//# sourceMappingURL=simple-call-transfer.js.map