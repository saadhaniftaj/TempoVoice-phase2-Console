"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeBaseService = void 0;
// 📚 Knowledge Base Service
class KnowledgeBaseService {
    constructor(config) {
        this.config = config;
        this.knowledgeBase = this.loadKnowledgeBase();
    }
    loadKnowledgeBase() {
        // If knowledge base is provided as a string, parse it
        if (typeof this.config.knowledgeBase === 'string') {
            try {
                return JSON.parse(this.config.knowledgeBase);
            }
            catch (error) {
                console.warn('Failed to parse knowledge base JSON:', error);
                return this.createDefaultKnowledgeBase();
            }
        }
        // If it's already an object, use it
        if (typeof this.config.knowledgeBase === 'object' && this.config.knowledgeBase !== null) {
            return this.config.knowledgeBase;
        }
        // Fallback to default
        return this.createDefaultKnowledgeBase();
    }
    createDefaultKnowledgeBase() {
        return {
            company_info: {
                name: this.config.agentName || 'Our Company',
                description: this.config.agentDescription || 'We provide excellent customer service',
                hours: 'Monday to Friday, 9 AM to 5 PM',
                contact: {
                    phone: this.config.callPhoneNumber,
                    email: 'info@company.com'
                }
            },
            services: [
                {
                    name: 'Customer Support',
                    description: 'General customer support and assistance',
                    details: 'We provide comprehensive customer support for all your needs'
                }
            ],
            policies: [
                {
                    name: 'Privacy Policy',
                    description: 'How we handle your personal information',
                    details: 'We respect your privacy and protect your personal information'
                },
                {
                    name: 'Refund Policy',
                    description: 'Our refund and return policy',
                    details: 'We offer 30-day refunds for most products and services'
                }
            ],
            frequently_asked_questions: [
                {
                    question: 'What are your business hours?',
                    answer: 'We are open Monday to Friday from 9 AM to 5 PM'
                },
                {
                    question: 'How can I contact customer support?',
                    answer: 'You can reach us by phone or email during business hours'
                }
            ]
        };
    }
    getKnowledgeBase() {
        return this.knowledgeBase;
    }
    searchKnowledgeBase(query) {
        const results = [];
        const searchTerm = query.toLowerCase();
        // Search in company info
        if (this.knowledgeBase.company_info) {
            const company = this.knowledgeBase.company_info;
            if (company.name?.toLowerCase().includes(searchTerm) ||
                company.description?.toLowerCase().includes(searchTerm)) {
                results.push({
                    id: 'company-info',
                    title: 'Company Information',
                    content: `${company.name}: ${company.description}`,
                    category: 'company',
                    tags: ['company', 'info'],
                    lastUpdated: new Date()
                });
            }
        }
        // Search in services
        if (this.knowledgeBase.services) {
            this.knowledgeBase.services.forEach((service, index) => {
                if (service.name?.toLowerCase().includes(searchTerm) ||
                    service.description?.toLowerCase().includes(searchTerm)) {
                    results.push({
                        id: `service-${index}`,
                        title: service.name,
                        content: service.description,
                        category: 'services',
                        tags: ['service', 'offering'],
                        lastUpdated: new Date()
                    });
                }
            });
        }
        // Search in FAQs
        if (this.knowledgeBase.frequently_asked_questions) {
            this.knowledgeBase.frequently_asked_questions.forEach((faq, index) => {
                if (faq.question?.toLowerCase().includes(searchTerm) ||
                    faq.answer?.toLowerCase().includes(searchTerm)) {
                    results.push({
                        id: `faq-${index}`,
                        title: faq.question,
                        content: faq.answer,
                        category: 'faq',
                        tags: ['faq', 'question'],
                        lastUpdated: new Date()
                    });
                }
            });
        }
        return results;
    }
    getContextualInfo(context) {
        // Return relevant information based on context
        switch (context.toLowerCase()) {
            case 'greeting':
                return `Hello! I'm ${this.config.agentName}. ${this.config.agentDescription}`;
            case 'business_hours':
                return this.knowledgeBase.company_info?.hours || 'We are available Monday to Friday, 9 AM to 5 PM';
            case 'contact_info':
                const company = this.knowledgeBase.company_info;
                return `You can reach us at ${company?.contact?.phone || this.config.callPhoneNumber} or ${company?.contact?.email || 'info@company.com'}`;
            case 'services':
                if (this.knowledgeBase.services) {
                    return this.knowledgeBase.services
                        .map((s) => `${s.name}: ${s.description}`)
                        .join('\n');
                }
                return 'We provide various services to meet your needs.';
            default:
                return this.config.agentDescription || 'I\'m here to help you with any questions or concerns.';
        }
    }
    getCompanyInfo() {
        return this.knowledgeBase.company_info || {};
    }
    getServices() {
        return this.knowledgeBase.services || [];
    }
    getPolicies() {
        return this.knowledgeBase.policies || [];
    }
    getFAQs() {
        return this.knowledgeBase.frequently_asked_questions || [];
    }
    updateKnowledgeBase(newKnowledgeBase) {
        this.knowledgeBase = { ...this.knowledgeBase, ...newKnowledgeBase };
    }
    // Generate a context-aware response based on the knowledge base
    generateContextualResponse(userQuery) {
        const query = userQuery.toLowerCase();
        // Check for specific keywords and return relevant information
        if (query.includes('hours') || query.includes('open') || query.includes('time')) {
            return this.getContextualInfo('business_hours');
        }
        if (query.includes('contact') || query.includes('phone') || query.includes('email')) {
            return this.getContextualInfo('contact_info');
        }
        if (query.includes('service') || query.includes('offer') || query.includes('provide')) {
            return this.getContextualInfo('services');
        }
        // Search for relevant FAQ
        const searchResults = this.searchKnowledgeBase(userQuery);
        if (searchResults.length > 0) {
            return searchResults[0].content;
        }
        // Default response
        return this.getContextualInfo('default');
    }
}
exports.KnowledgeBaseService = KnowledgeBaseService;
//# sourceMappingURL=knowledge-base-service.js.map