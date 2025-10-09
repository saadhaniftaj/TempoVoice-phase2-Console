import { Twilio } from 'twilio';
export interface TransferResult {
    success: boolean;
    callSid?: string;
    error?: string;
    transferType: 'warm' | 'cold' | 'department';
}
export interface TransferLog {
    originalCallSid: string;
    transferTo: string;
    transferType: 'warm' | 'cold' | 'department';
    timestamp: Date;
    reason: string;
    status: 'initiated' | 'completed' | 'failed';
}
export declare class SimpleCallTransferService {
    private twilioClient;
    private transferLogs;
    constructor(twilioClient: Twilio);
    /**
     * Warm Transfer - Connect both parties before transferring
     */
    warmTransfer(callSid: string, transferTo: string, reason?: string): Promise<TransferResult>;
    /**
     * Cold Transfer - Direct transfer without connection
     */
    coldTransfer(callSid: string, transferTo: string, reason?: string): Promise<TransferResult>;
    /**
     * Transfer to Department - Route based on department type
     */
    transferToDepartment(callSid: string, department: string, reason?: string): Promise<TransferResult>;
    /**
     * Emergency Transfer - Immediate transfer to emergency services
     */
    emergencyTransfer(callSid: string, emergencyNumber: string, reason: string): Promise<TransferResult>;
    /**
     * Get transfer status for a call
     */
    getTransferStatus(callSid: string): TransferLog | null;
    /**
     * Get transfer statistics
     */
    getTransferStats(): any;
    /**
     * Update transfer status (called by webhooks)
     */
    updateTransferStatus(callSid: string, status: 'completed' | 'failed'): void;
    /**
     * Get all transfer logs
     */
    getAllTransferLogs(): TransferLog[];
    /**
     * Clean up old transfer logs
     */
    cleanupOldLogs(daysToKeep?: number): void;
}
//# sourceMappingURL=simple-call-transfer.d.ts.map