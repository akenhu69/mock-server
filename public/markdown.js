// HTML to Markdown Parser
function copyTabAsMarkdown(tabId) {
    const tabEl = document.getElementById(tabId);
    if (!tabEl) return;

    let md = "";
    
    // Helper to add lines
    const addLine = (text = "") => { md += text + "\n"; };
    const addBlock = (text = "") => { md += text + "\n\n"; };

    // 1. Iterate child elements to construct MD
    // We will do a custom walk for our specific structure

    // Get Title (hardcoded based on known structure or extracted)
    const title = tabId === 'tab-dynamic' ? 'Dynamic Mock API' : 'Cloudflare Waiting Room Mock';
    addLine(`# ${title}`);
    addLine();

    // -- Endpoint Header Section --
    const endpointHeader = tabEl.querySelector('.bg-gradient-to-r');
    if (endpointHeader) {
        const url = endpointHeader.querySelector('.font-mono')?.innerText.trim() || '';
        const methods = endpointHeader.querySelector('.bg-white\\/10')?.innerText.trim() || '';
        const desc = endpointHeader.querySelector('.text-blue-100, .text-orange-100')?.innerText.trim() || '';
        
        addBlock(`## Endpoint`);
        addBlock(`- URL: \`${url}\``);
        addBlock(`- Methods: **${methods}**`);
        addBlock(`> ${desc}`);
    }

    // -- Alerts (Cookie warning etc) --
    const alerts = tabEl.querySelectorAll('.border-l-4'); // Our alert style
    alerts.forEach(alert => {
        const title = alert.querySelector('h3')?.innerText || 'Note';
        const text = alert.querySelector('p')?.innerText || '';
        addBlock(`> [!IMPORTANT] ${title}\n> ${text}`);
    });

    // -- Feature Grid --
    const featureGrid = tabEl.querySelector('.grid');
    if (featureGrid) {
        addBlock(`## Features`);
        const cards = featureGrid.querySelectorAll('.bg-white');
        cards.forEach(card => {
            const icon = card.querySelector('.w-10')?.innerText || '';
            const title = card.querySelector('h3')?.innerText || '';
            const p = card.querySelector('p');
            // Extract text from p, handling code tags
            let desc = "";
            if (p) {
                // simple innerText might miss code formatting emphasis, but it's okay for basic md
                // Let's try to maintain `code` backticks
                desc = p.innerHTML.replace(/<code>/g, '`').replace(/<\/code>/g, '`').replace(/<br>/g, ' ').replace(/<[^>]+>/g, '');
            }
            addLine(`- **${icon} ${title}**: ${desc}`);
        });
        addLine();
    }

    // -- Tables (Parameters) --
    const tableDiv = tabEl.querySelector('.overflow-x-auto table');
    if (tableDiv) {
        addBlock(`## Parameters`);
        
        // Header
        const headers = Array.from(tableDiv.querySelectorAll('thead th')).map(th => th.innerText.trim());
        addLine(`| ${headers.join(' | ')} |`);
        addLine(`| ${headers.map(() => '---').join(' | ')} |`);

        // Rows
        const rows = tableDiv.querySelectorAll('tbody tr');
        rows.forEach(tr => {
            const cols = Array.from(tr.querySelectorAll('td')).map(td => {
                 // Handle code blocks inside table cells
                 let text = td.innerHTML
                    .replace(/<div.*?>.*?<\/div>/gs, '') // Remove nested divs (like status list) for cleanliness or parse them?
                    // actually status list is important.
                    .replace(/<span.*?>(.*?)<\/span>/g, '`$1` ')
                    .replace(/<code.*?>(.*?)<\/code>/g, '`$1`')
                    .replace(/<br>/g, ', ')
                    .replace(/<[^>]+>/g, '') // strip remaining tags
                    .trim();
                 // Special handling for the Status list div to clear extra whitespace
                 text = text.replace(/\s+/g, ' ');
                 return text;
            });
            addLine(`| ${cols.join(' | ')} |`);
        });
        addLine();
    }

    // -- Usage Examples --
    // Find the container directly using the IDs we added
    const exampleContainer = tabEl.querySelector('#dynamic-examples, #waiting-examples');
    
    if (exampleContainer) {
        addBlock(`## Examples`);
        
        Array.from(exampleContainer.children).forEach(child => {
            const titleEl = child.querySelector('h3, h4');
            const pre = child.querySelector('pre');
            
            if (titleEl) {
                let titleText = titleEl.innerText.trim();
                // Clean up badges in title if any (getting text only might include badge text, which is fine or we can clean)
                titleText = titleText.replace(/\n/g, ' ');
                addLine(`### ${titleText}`);
            }
            
            const desc = child.querySelector('p');
            if (desc) {
                addLine(desc.innerText.trim());
            }

            if (pre) {
                addLine('```bash');
                addLine(pre.innerText.trim());
                addLine('```');
            }
            addLine();
        });
    }

    // -- Response Format --
    const responseFormat = tabEl.querySelector('#response-format');
    if (responseFormat) {
        addBlock(`## Response Format`);
        const pre = responseFormat.querySelector('pre');
        if (pre) {
            addLine('```json');
            addLine(pre.innerText.trim());
            addLine('```');
        }
    }

    // Copy to clipboard
    navigator.clipboard.writeText(md).then(() => {
        alert('Documentation copied to clipboard as Markdown!');
    }).catch(err => {
        console.error('Failed to copy', err);
        alert('Failed to copy to clipboard');
    });
}
