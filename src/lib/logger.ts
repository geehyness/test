// src/lib/logger.ts

/**
 * A simple, centralized logging utility with different logging levels.
 */
export const logger = {
    /**
     * Logs a message with a 'LOG' tag.
     */
    log: (tag: string, ...message: any[]) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${tag}]`, ...message);
    },

    /**
     * Logs a message with an 'INFO' tag.
     */
    info: (tag: string, ...message: any[]) => {
        const timestamp = new Date().toISOString();
        console.info(`%c[${timestamp}] %c[${tag}] %c${message.join(' ')}`, 'color: gray;', 'color: dodgerblue; font-weight: bold;', 'color: black;');
    },

    /**
     * Logs a message with an 'WARN' tag.
     */
    warn: (tag: string, ...message: any[]) => {
        const timestamp = new Date().toISOString();
        console.warn(`[${timestamp}] [${tag}]`, ...message);
    },

    /**
     * Logs a message with an 'ERROR' tag.
     */
    error: (tag: string, ...message: any[]) => {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] [${tag}]`, ...message);
    },
};