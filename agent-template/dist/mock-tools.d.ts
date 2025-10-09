declare const availableTools: {
    toolSpec: {
        name: string;
        description: string;
        inputSchema: {
            json: string;
        };
    };
}[];
declare function toolProcessor(toolName: string, toolArgs: string): Promise<Object>;
export { availableTools, toolProcessor };
//# sourceMappingURL=mock-tools.d.ts.map