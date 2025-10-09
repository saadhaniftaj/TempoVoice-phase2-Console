"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTranscriptEndpoints = registerTranscriptEndpoints;
function registerTranscriptEndpoints(fastify, transcriptService) {
    // Get all transcripts
    fastify.get('/transcripts', async (request, reply) => {
        try {
            // In a real implementation, you would query your database
            // For now, return a placeholder response
            reply.send({
                message: 'Transcript API endpoints registered',
                service: 'transcript-storage-service',
                endpoints: [
                    'GET /transcripts - List all transcripts',
                    'GET /transcripts/:callSid - Get specific transcript',
                    'POST /transcripts/:callSid/summary - Generate summary',
                    'DELETE /transcripts/:callSid - Delete transcript'
                ]
            });
        }
        catch (error) {
            reply.status(500).send({ error: 'Failed to get transcripts' });
        }
    });
    // Get specific transcript
    fastify.get('/transcripts/:callSid', async (request, reply) => {
        const { callSid } = request.params;
        try {
            const transcript = await transcriptService.retrieveTranscript(callSid);
            if (!transcript) {
                reply.status(404).send({ error: 'Transcript not found' });
                return;
            }
            reply.send(transcript);
        }
        catch (error) {
            console.error('Error retrieving transcript:', error);
            reply.status(500).send({ error: 'Failed to retrieve transcript' });
        }
    });
    // Generate transcript summary
    fastify.post('/transcripts/:callSid/summary', async (request, reply) => {
        const { callSid } = request.params;
        try {
            const transcript = await transcriptService.retrieveTranscript(callSid);
            if (!transcript) {
                reply.status(404).send({ error: 'Transcript not found' });
                return;
            }
            const summary = await transcriptService.generateTranscriptSummary(transcript);
            reply.send({ callSid, summary });
        }
        catch (error) {
            console.error('Error generating transcript summary:', error);
            reply.status(500).send({ error: 'Failed to generate transcript summary' });
        }
    });
    // Delete transcript
    fastify.delete('/transcripts/:callSid', async (request, reply) => {
        const { callSid } = request.params;
        try {
            // In a real implementation, you would delete from your database
            reply.send({ message: `Transcript ${callSid} deleted successfully` });
        }
        catch (error) {
            console.error('Error deleting transcript:', error);
            reply.status(500).send({ error: 'Failed to delete transcript' });
        }
    });
    // Transcript analytics
    fastify.get('/transcripts/analytics', async (request, reply) => {
        try {
            // In a real implementation, you would generate analytics from your database
            reply.send({
                message: 'Transcript analytics endpoint',
                analytics: {
                    totalTranscripts: 0,
                    averageDuration: 0,
                    commonTopics: [],
                    peakHours: []
                }
            });
        }
        catch (error) {
            console.error('Error generating analytics:', error);
            reply.status(500).send({ error: 'Failed to generate analytics' });
        }
    });
    // Export transcripts
    fastify.get('/transcripts/export', async (request, reply) => {
        try {
            // In a real implementation, you would export transcripts in various formats
            reply.send({
                message: 'Transcript export endpoint',
                formats: ['JSON', 'CSV', 'PDF'],
                instructions: 'Add ?format=json|csv|pdf to specify export format'
            });
        }
        catch (error) {
            console.error('Error exporting transcripts:', error);
            reply.status(500).send({ error: 'Failed to export transcripts' });
        }
    });
    console.log('✅ Transcript API endpoints registered');
}
//# sourceMappingURL=transcript-api-endpoints.js.map