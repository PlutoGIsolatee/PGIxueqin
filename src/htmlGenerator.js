import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const viewsDir = path.join(__dirname, 'views');

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function applyHighlights(text, intervals, color) {
    if (!intervals || intervals.length === 0) {
        return escapeHtml(text);
    }
    
    const sorted = [...intervals].sort((a, b) => a.start - b.start);
    const merged = [];
    let current = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
        const next = sorted[i];
        if (next.start <= current.end) {
            current.end = Math.max(current.end, next.end);
        } else {
            merged.push(current);
            current = next;
        }
    }
    merged.push(current);
    
    let result = '';
    let lastEnd = 0;
    for (const interval of merged) {
        if (interval.start > lastEnd) {
            result += escapeHtml(text.slice(lastEnd, interval.start));
        }
        result += `<mark style="background: ${color};">${escapeHtml(text.slice(interval.start, interval.end))}</mark>`;
        lastEnd = interval.end;
    }
    if (lastEnd < text.length) {
        result += escapeHtml(text.slice(lastEnd));
    }
    return result;
}

const stepColors = [
    '#ffcccc', '#ffe0cc', '#fff0cc', '#e0ffe0', '#cce0ff', '#e0ccff', '#ffccff'
];

export async function generateHtml(text, finalFragments, stepResults, usedSteps, availableSteps, serverConfig, currentStepConfig, currentParamConfig) {
    const templatePath = path.join(viewsDir, 'index.ejs');
    
    const html = await ejs.renderFile(templatePath, {
        text,
        stepResults,
        usedSteps,
        availableSteps,
        serverConfig,
        currentParamConfig,
        stepColors,
        escapeHtml,
        applyHighlights
    }, {
        views: [viewsDir],
        root: viewsDir,
        filename: templatePath
    });
    
    return html;
}