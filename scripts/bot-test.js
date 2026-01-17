/**
 * 🤖 BOT VERIFICATION SCRIPT
 * 
 * This script uses Playwright to simulate a bot visiting your "Safe Lab" page.
 * It attempts to scrape the text content of the posts.
 * 
 * PREREQUISITES:
 * 1. You must have the extension built and loaded in the browser.
 *    (Playwright launches a fresh browser, so loading the extension requires specific config)
 * 2. You need to install playwright: `npm install playwright`
 * 
 * USAGE:
 * node scripts/bot-test.js
 */

const { chromium } = require('playwright');
const path = require('path');

(async () => {
    // Path to your extension folder
    const pathToExtension = path.join(process.cwd(), 'browser-extension');

    console.log('🚀 Launching Bot with Extension...');
    console.log('📂 Extension Path:', pathToExtension);

    const context = await chromium.launchPersistentContext('', {
        headless: false, // Must be false to load extensions
        args: [
            `--disable-extensions-except=${pathToExtension}`,
            `--load-extension=${pathToExtension}`
        ]
    });

    const page = await context.newPage();

    // 1. Visit the Dummy Site (Make sure your Next.js app is running on 3000!)
    try {
        console.log('🌐 Navigating to Lab Environment...');
        await page.goto('http://localhost:3000/bot-test.html');

        // Wait for extension to load and inject
        await page.waitForTimeout(2000);

        // 2. Simulate Bot Behavior: Fast, linear mouse movement
        console.log('🖱️ Performing "Bot-Like" Mouse Movements...');
        await page.mouse.move(0, 0);
        await page.mouse.move(100, 100);
        await page.mouse.move(200, 200);
        await page.mouse.move(500, 500); // Very linear, very fast

        // 3. Attempt to "Scrape" the content
        console.log('🕵️ Attempting to Scrape Content...');
        await page.waitForTimeout(3000); // Give the extension time to react

        const posts = await page.$$('.reddit-post');

        for (const [index, post] of posts.entries()) {
            const text = await post.innerText();
            // Check if the element has the blur filter applied (computed style)
            const isBlurred = await post.evaluate(el => {
                const style = window.getComputedStyle(el);
                return style.filter.includes('blur');
            });

            console.log(`\n📄 Post #${index + 1}:`);
            console.log(`   - Scraped Text Length: ${text.length} chars`);
            console.log(`   - Is Blurred? ${isBlurred ? '✅ YES (BLOCKED)' : '❌ NO (EXPOSED)'}`);
        }

        console.log('\n--- TEST COMPLETE ---');
        console.log('If "Is Blurred" is YES, your defense is working!');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        // Keep browser open for a moment to see results
        await page.waitForTimeout(5000);
        await context.close();
    }
})();
