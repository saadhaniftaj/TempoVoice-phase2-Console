import { KnowledgeBaseItem } from './types';
import { AgentConfig } from './config-loader';
export declare class KnowledgeBaseService {
    private knowledgeBase;
    private config;
    constructor(config: AgentConfig);
    private loadKnowledgeBase;
    private createDefaultKnowledgeBase;
    getKnowledgeBase(): any;
    searchKnowledgeBase(query: string): KnowledgeBaseItem[];
    getContextualInfo(context: string): string;
    getCompanyInfo(): any;
    getServices(): any[];
    getPolicies(): any[];
    getFAQs(): any[];
    updateKnowledgeBase(newKnowledgeBase: any): void;
    generateContextualResponse(userQuery: string): string;
}
//# sourceMappingURL=knowledge-base-service.d.ts.map