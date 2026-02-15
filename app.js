/* BrowserSafeCheck — Detection Engine (Part 1: Categories 1 & 2) */

// ========== UTILITIES ==========
function createCheckItem(label, value, status) {
    const icons = { safe: '✓', warning: '⚠', danger: '✕', info: 'ℹ' };
    return `<div class="check-item">
        <div class="check-icon ${status}">${icons[status]}</div>
        <div class="check-content">
            <div class="check-label">${label}</div>
            <div class="check-value">${value}</div>
        </div>
    </div>`;
}

function setBadge(id, status, text) {
    const el = document.getElementById(id);
    el.className = 'category-badge ' + status;
    el.textContent = text;
}

function getCategoryStatus(checks) {
    const d = checks.filter(c => c.status === 'danger').length;
    const w = checks.filter(c => c.status === 'warning').length;
    if (d > 0) return 'danger';
    if (w > 1) return 'warning';
    return 'safe';
}

const badgeLabels = { safe: 'လုံခြုံ', warning: 'သတိ', danger: 'အန္တရာယ်' };

// ========== GLOBAL STATE ==========
let allSuggestions = [];
let categoryScores = { cat1: 100, cat2: 100, cat3: 100, cat4: 100 };

// ========== MAIN SCAN ==========
async function startScan() {
    const btn = document.getElementById('scanBtn');
    btn.classList.add('scanning');
    btn.querySelector('span').textContent = 'စစ်ဆေးနေပါသည်';

    document.getElementById('welcomeSection').classList.add('hidden');
    document.getElementById('overallScore').classList.remove('hidden');
    document.getElementById('categoriesGrid').classList.remove('hidden');

    allSuggestions = [];

    // Run all categories
    await checkCategory1();
    await checkCategory2();
    checkCategory3();
    await checkCategory4();

    // Show suggestions
    renderSuggestions();
    renderOverallScore();

    btn.classList.remove('scanning');
    btn.querySelector('span').textContent = 'ပြန်စစ်ဆေးမည်';
}

// ========== CATEGORY 1: General Info ==========
async function checkCategory1() {
    const checks = [];
    let html = '';

    // Browser Name & Version
    const browserInfo = detectBrowser();
    checks.push({ status: 'info' });
    html += createCheckItem('Browser အမည်', browserInfo.name, 'info');
    html += createCheckItem('Browser ဗားရှင်း', browserInfo.version, 'info');

    // OS
    const osInfo = detectOS();
    html += createCheckItem('စက်စနစ် (Operating System)', osInfo, 'info');

    // Language
    const lang = navigator.language || navigator.userLanguage || 'မသိ';
    html += createCheckItem('ဘာသာစကား (Language)', lang, 'info');

    // Screen Resolution
    const w = screen.width, h = screen.height;
    const dpr = window.devicePixelRatio || 1;
    html += createCheckItem('မျက်နှာပြင် အတိုင်းအတာ', `${w} × ${h} (${dpr}x pixel ratio)`, 'info');

    // Platform
    const platform = navigator.userAgentData?.platform || navigator.platform || 'မသိ';
    html += createCheckItem('ပလက်ဖောင်း (Platform)', platform, 'info');

    // Touch Support
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    html += createCheckItem('Touch အသုံးပြုနိုင်မှု', hasTouch ? 'ရှိသည်' : 'မရှိပါ', 'info');

    // Browser Engine
    const engine = detectBrowserEngine();
    html += createCheckItem('Browser အင်ဂျင် (Engine)', engine, 'info');

    // Browser Vendor
    const vendor = navigator.vendor || 'Unknown';
    html += createCheckItem('Browser ထုတ်လုပ်သူ (Vendor)', vendor, 'info');

    // Color Depth
    const colorDepth = screen.colorDepth || screen.pixelDepth || 'Unknown';
    html += createCheckItem('အရောင် ပြတ်သားမှု (Color)', `${colorDepth}-bit`, 'info');

    // Installed Fonts Count (privacy indicator)
    const fontsCount = await detectInstalledFontsCount();
    html += createCheckItem('ဖောင့် အရေအတွက် (Fonts)', fontsCount, 'info');

    document.getElementById('cat1Items').innerHTML = html;
    setBadge('cat1Badge', 'info', 'INFO');
    categoryScores.cat1 = 100; // info only, always full
}

function detectBrowserEngine() {
    const ua = navigator.userAgent;
    
    // Check for specific engines
    if (ua.includes('Gecko/') && ua.includes('Firefox/')) return 'Gecko';
    if (ua.includes('AppleWebKit/')) {
        if (ua.includes('Chrome/') || ua.includes('Edg/')) return 'Blink';
        if (ua.includes('Safari/')) return 'WebKit';
        return 'WebKit/Blink';
    }
    if (ua.includes('Trident/')) return 'Trident';
    if (ua.includes('Presto/')) return 'Presto';
    
    return 'Unknown';
}

async function detectInstalledFontsCount() {
    // Use a sample of common fonts to estimate
    const testFonts = [
        'Arial', 'Verdana', 'Helvetica', 'Times New Roman', 'Courier New',
        'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
        'Trebuchet MS', 'Impact', 'Lucida Sans', 'Tahoma', 'Century Gothic',
        'Monaco', 'Consolas', 'Courier', 'Lucida Console', 'Andale Mono',
        'MS Sans Serif', 'MS Serif', 'Calibri', 'Cambria', 'Candara'
    ];
    
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Get baseline widths
    const baseWidths = {};
    baseFonts.forEach(baseFont => {
        context.font = `${testSize} ${baseFont}`;
        baseWidths[baseFont] = context.measureText(testString).width;
    });
    
    // Count detected fonts
    let detectedCount = 0;
    testFonts.forEach(font => {
        let detected = false;
        baseFonts.forEach(baseFont => {
            context.font = `${testSize} '${font}', ${baseFont}`;
            const width = context.measureText(testString).width;
            if (width !== baseWidths[baseFont]) {
                detected = true;
            }
        });
        if (detected) detectedCount++;
    });
    
    // Estimate total (sample is ~25 fonts)
    const estimatedTotal = Math.round((detectedCount / testFonts.length) * 200);
    return `~${estimatedTotal} ခု (${detectedCount}/${testFonts.length} တွေ့ရှိ)`;
}

function detectBrowser() {
    const ua = navigator.userAgent;
    let name = 'Unknown Browser', version = '';

    if (navigator.userAgentData && navigator.userAgentData.brands) {
        const brands = navigator.userAgentData.brands;
        const real = brands.find(b => !b.brand.includes('Not') && b.brand !== 'Chromium');
        if (real) { name = real.brand; version = real.version; }
        else {
            const chromium = brands.find(b => b.brand === 'Chromium');
            if (chromium) { name = 'Chromium'; version = chromium.version; }
        }
    } else {
        if (ua.includes('Firefox/')) { name = 'Firefox'; version = ua.match(/Firefox\/([\d.]+)/)?.[1] || ''; }
        else if (ua.includes('Edg/')) { name = 'Microsoft Edge'; version = ua.match(/Edg\/([\d.]+)/)?.[1] || ''; }
        else if (ua.includes('Chrome/') && !ua.includes('Edg/')) { name = 'Google Chrome'; version = ua.match(/Chrome\/([\d.]+)/)?.[1] || ''; }
        else if (ua.includes('Safari/') && !ua.includes('Chrome/')) { name = 'Safari'; version = ua.match(/Version\/([\d.]+)/)?.[1] || ''; }
    }
    return { name, version };
}

function detectOS() {
    if (navigator.userAgentData?.platform) return navigator.userAgentData.platform;
    const ua = navigator.userAgent;
    if (ua.includes('Windows NT 10')) return 'Windows 10/11';
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac OS X')) { const v = ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, '.'); return v ? `macOS ${v}` : 'macOS'; }
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Unknown OS';
}

// ========== CATEGORY 2: Security & Privacy ==========
async function checkCategory2() {
    const checks = [];
    let html = '';

    // HTTPS
    const isHTTPS = location.protocol === 'https:';
    const httpsStatus = isHTTPS ? 'safe' : 'danger';
    checks.push({ status: httpsStatus });
    html += createCheckItem('HTTPS ချိတ်ဆက်မှု', isHTTPS ? 'HTTPS ဖြင့် ချိတ်ဆက်ထားသည် ✓' : 'HTTPS မဟုတ်ပါ — လုံခြုံမှု မရှိပါ', httpsStatus);
    if (!isHTTPS) allSuggestions.push({ critical: true, text: '<strong>HTTPS</strong> ဖြင့် ချိတ်ဆက်ထားခြင်း မရှိပါ။ HTTPS ရှိသော website များကိုသာ အသုံးပြုပါ။ Browser address bar တွင် 🔒 အိုင်ကွန် ရှိ/မရှိ စစ်ဆေးပါ။' });

    // Secure Context
    const isSecure = window.isSecureContext;
    const secureStatus = isSecure ? 'safe' : 'danger';
    checks.push({ status: secureStatus });
    html += createCheckItem('လုံခြုံသော ပတ်ဝန်းကျင်', isSecure ? 'Secure Context ဖြစ်သည် ✓' : 'Secure Context မဟုတ်ပါ', secureStatus);
    if (!isSecure) allSuggestions.push({ critical: true, text: '<strong>Secure Context</strong> မဟုတ်ပါ။ ဤ website သည် လုံခြုံသော ပတ်ဝန်းကျင်တွင် မရှိပါ။ HTTPS ရှိသော site ကို အသုံးပြုပါ။' });

    // Cookies
    const cookiesEnabled = navigator.cookieEnabled;
    const cookieStatus = cookiesEnabled ? 'safe' : 'warning';
    checks.push({ status: cookieStatus });
    html += createCheckItem('ကွတ်ကီးများ (Cookies)', cookiesEnabled ? 'ဖွင့်ထားသည် (Enabled)' : 'ပိတ်ထားသည် (Disabled)', cookieStatus);
    if (!cookiesEnabled) allSuggestions.push({ critical: false, text: '<strong>Cookies</strong> ပိတ်ထားပါသည်။ အချို့ website များ ကောင်းစွာ အလုပ်မလုပ်နိုင်ပါ။ လိုအပ်ပါက browser settings မှ cookies ကို ဖွင့်ပေးပါ။' });

    // Do Not Track
    const dnt = navigator.doNotTrack;
    let dntValue, dntStatus;
    if (dnt === '1') { dntValue = 'ဖွင့်ထားပါသည် (Enabled) ✓'; dntStatus = 'safe'; }
    else if (dnt === '0') { dntValue = 'ပိတ်ထားပါသည် (Disabled)'; dntStatus = 'warning'; }
    else { dntValue = 'သတ်မှတ်ထားခြင်း မရှိပါ (Not Set)'; dntStatus = 'warning'; }
    checks.push({ status: dntStatus });
    html += createCheckItem('ခြေရာခံခြင်း တားဆီးမှု (DNT)', dntValue, dntStatus);
    if (dntStatus !== 'safe') allSuggestions.push({ critical: false, text: '<strong>Do Not Track</strong> ဖွင့်ထားခြင်း မရှိပါ။ Browser settings ထဲတွင် "Do Not Track" ကို enable လုပ်ခြင်းဖြင့် website များက သင့်ကို track လုပ်ခြင်းကို တားဆီးနိုင်ပါသည်။' });

    // JavaScript
    html += createCheckItem('ဂျာဗားစခရစ် (JavaScript)', 'ဖွင့်ထားသည် (Enabled)', 'info');
    checks.push({ status: 'info' });

    // Third-party Cookies test (simplified)
    const tpcStatus = 'warning';
    html += createCheckItem('Third-party Cookies', 'Browser Settings ပေါ်မူတည်ပါသည်', tpcStatus);
    checks.push({ status: tpcStatus });
    allSuggestions.push({ critical: false, text: '<strong>Third-party Cookies</strong> ကို ပိတ်ထားရန် (Block) အကြံပြုပါသည်။ Browser settings > Privacy > "Block third-party cookies" ကို ဖွင့်ပါ။' });

    // Ad Blocker Detection
    const adBlockStatus = detectAdBlocker();
    checks.push({ status: adBlockStatus ? 'safe' : 'warning' });
    html += createCheckItem('ကြော်ငြာ တားဆီးမှု (Ad Blocker)', adBlockStatus ? 'Ad Blocker တွေ့ရှိသည် ✓' : 'Ad Blocker မတွေ့ရှိပါ', adBlockStatus ? 'safe' : 'warning');
    if (!adBlockStatus) allSuggestions.push({ critical: false, text: '<strong>Ad Blocker</strong> ထည့်သွင်းထားခြင်း မရှိပါ။ uBlock Origin သို့မဟုတ် အခြား ad blocker extension ထည့်သွင်းခြင်းဖြင့် malicious ads များမှ ကာကွယ်နိုင်ပါသည်။' });

    // Browser Fingerprinting Score
    const fpScore = calculateFingerprintScore();
    const fpStatus = fpScore.score < 30 ? 'safe' : fpScore.score < 60 ? 'warning' : 'danger';
    checks.push({ status: fpStatus });
    html += createCheckItem('Browser Fingerprinting ရမှတ်', `${fpScore.score}/100 (${fpScore.label})`, fpStatus);
    if (fpStatus === 'danger') {
        allSuggestions.push({ critical: true, text: `<strong>Browser Fingerprinting</strong> score မြင့်ပါသည် (${fpScore.score}/100)။ သင့် browser သည် အလွန် unique ဖြစ်ပြီး website များက လွယ်ကူစွာ track လုပ်နိုင်ပါသည်။ Privacy-focused browser (Firefox, Brave) အသုံးပြုပါ သို့မဟုတ် Privacy Badger extension ထည့်သွင်းပါ။` });
    } else if (fpStatus === 'warning') {
        allSuggestions.push({ critical: false, text: `<strong>Browser Fingerprinting</strong> score ${fpScore.score}/100 ဖြစ်ပါသည်။ Privacy ပိုကောင်းစေရန် browser extensions (Privacy Badger, uBlock Origin) ထည့်သွင်းပါ။` });
    }

    // Vulnerability Database Check
    const browserInfo = detectBrowser();
    const vulnCheck = checkBrowserVulnerabilities(browserInfo.name, browserInfo.version);
    const vulnStatus = vulnCheck.safe ? 'safe' : 'danger';
    checks.push({ status: vulnStatus });
    html += createCheckItem('Browser Version လုံခြုံရေး', vulnCheck.message, vulnStatus);
    if (!vulnCheck.safe) {
        allSuggestions.push({ critical: true, text: `<strong>${browserInfo.name} ${browserInfo.version}</strong> တွင် လုံခြုံရေး ပြဿနာများ ရှိပါသည်။ ${vulnCheck.suggestion}` });
    }

    // Camera/Microphone Permission Check
    if (navigator.permissions) {
        try {
            const cameraStatus = await navigator.permissions.query({ name: 'camera' });
            const micStatus = await navigator.permissions.query({ name: 'microphone' });
            
            let mediaPermStatus, mediaPermDisplay;
            if (cameraStatus.state === 'granted' || micStatus.state === 'granted') {
                mediaPermStatus = 'warning';
                mediaPermDisplay = 'ခွင့်ပြုထားသည် (Granted)';
                allSuggestions.push({ critical: false, text: '<strong>Camera/Microphone</strong> permission ခွင့်ပြုထားပါသည်။ မလိုအပ်သော website များအတွက် browser settings > Site Settings > Camera/Microphone တွင် ပိတ်ထားပါ။' });
            } else if (cameraStatus.state === 'denied' && micStatus.state === 'denied') {
                mediaPermStatus = 'safe';
                mediaPermDisplay = 'ငြင်းပယ်ထားသည် (Denied) ✓';
            } else {
                mediaPermStatus = 'safe';
                mediaPermDisplay = 'ခွင့်တောင်းမည် (Prompt) ✓';
            }
            
            checks.push({ status: mediaPermStatus });
            html += createCheckItem('ကင်မရာနှင့် မိုက်ခရိုဖုန်း ခွင့်ပြုချက်', mediaPermDisplay, mediaPermStatus);
        } catch {
            html += createCheckItem('ကင်မရာနှင့် မိုက်ခရိုဖုန်း ခွင့်ပြုချက်', 'စစ်ဆေး၍ မရပါ', 'info');
            checks.push({ status: 'info' });
        }
    }

    // Notification Permission Check
    if ('Notification' in window) {
        const notifPerm = Notification.permission;
        let notifStatus, notifDisplay;
        
        if (notifPerm === 'granted') {
            notifStatus = 'warning';
            notifDisplay = 'ခွင့်ပြုထားသည် (Granted)';
            allSuggestions.push({ critical: false, text: '<strong>Notification</strong> permission ခွင့်ပြုထားပါသည်။ spam notifications များ ရရှိနိုင်ပါသည်။ Browser settings > Site Settings > Notifications တွင် မလိုအပ်သော site များကို ပိတ်ပါ။' });
        } else if (notifPerm === 'denied') {
            notifStatus = 'safe';
            notifDisplay = 'ငြင်းပယ်ထားသည် (Denied) ✓';
        } else {
            notifStatus = 'safe';
            notifDisplay = 'ခွင့်တောင်းမည် (Default) ✓';
        }
        
        checks.push({ status: notifStatus });
        html += createCheckItem('အသိပေးချက် ခွင့်ပြုချက် (Notification)', notifDisplay, notifStatus);
    }

    document.getElementById('cat2Items').innerHTML = html;
    const catStatus = getCategoryStatus(checks);
    setBadge('cat2Badge', catStatus, badgeLabels[catStatus]);

    const total = checks.filter(c => c.status !== 'info').length;
    const safe = checks.filter(c => c.status === 'safe').length;
    categoryScores.cat2 = total > 0 ? Math.round((safe / total) * 100) : 100;
}

function detectAdBlocker() {
    const testAd = document.createElement('div');
    testAd.innerHTML = '&nbsp;';
    testAd.className = 'adsbox ad-placement ad-banner';
    testAd.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;';
    document.body.appendChild(testAd);
    const blocked = testAd.offsetHeight === 0 || testAd.clientHeight === 0;
    document.body.removeChild(testAd);
    return blocked;
}

// Browser Fingerprinting Score Calculation
function calculateFingerprintScore() {
    let entropy = 0;
    const factors = [];

    // User Agent uniqueness (high entropy)
    const ua = navigator.userAgent;
    if (ua) { entropy += 8; factors.push('UserAgent'); }

    // Screen resolution
    const screenSig = `${screen.width}x${screen.height}x${screen.colorDepth}`;
    entropy += 4.5;
    factors.push('Screen');

    // Timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    entropy += 3.5;
    factors.push('Timezone');

    // Language
    const langs = navigator.languages || [navigator.language];
    entropy += 3;
    factors.push('Language');

    // Platform
    const platform = navigator.platform || navigator.userAgentData?.platform;
    if (platform) { entropy += 2; factors.push('Platform'); }

    // Hardware Concurrency
    if (navigator.hardwareConcurrency) {
        entropy += 2.5;
        factors.push('CPU');
    }

    // Device Memory
    if (navigator.deviceMemory) {
        entropy += 1.5;
        factors.push('Memory');
    }

    // Canvas Fingerprinting (simplified check)
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('Browser fingerprint test', 2, 2);
            const canvasData = canvas.toDataURL();
            if (canvasData) {
                entropy += 5.5;
                factors.push('Canvas');
            }
        }
    } catch (e) {}

    // WebGL Fingerprinting
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                if (vendor && renderer) {
                    entropy += 4.5;
                    factors.push('WebGL');
                }
            }
        }
    } catch (e) {}

    // Plugins (deprecated but still tracked)
    if (navigator.plugins && navigator.plugins.length > 0) {
        entropy += 6;
        factors.push('Plugins');
    }

    // Touch support
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (hasTouch) {
        entropy += 1;
        factors.push('Touch');
    }

    // Do Not Track
    if (navigator.doNotTrack) {
        entropy += 0.5;
    }

    // Cookie enabled
    if (navigator.cookieEnabled) {
        entropy += 0.3;
    }

    // Audio context fingerprinting
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            entropy += 3;
            factors.push('Audio');
        }
    } catch (e) {}

    // Calculate score (0-100, higher = more unique = worse for privacy)
    // Max theoretical entropy ~50 bits
    const score = Math.min(100, Math.round((entropy / 50) * 100));

    let label;
    if (score < 30) label = 'နည်း (ကောင်းမွန်)';
    else if (score < 60) label = 'အလယ်အလတ်';
    else label = 'မြင့် (အန္တရာယ်)';

    return { score, entropy: entropy.toFixed(1), factors, label };
}

// Vulnerability Database Check
function checkBrowserVulnerabilities(browserName, version) {
    // Simplified vulnerability database (in production, this would query a real CVE database)
    const vulnDB = {
        'Google Chrome': {
            minSafeVersion: 120,
            vulnerabilities: {
                119: ['CVE-2023-7024: High severity heap buffer overflow'],
                118: ['CVE-2023-6345: Integer overflow in Skia'],
                117: ['CVE-2023-5997: Use after free in Garbage Collection']
            }
        },
        'Microsoft Edge': {
            minSafeVersion: 120,
            vulnerabilities: {
                119: ['CVE-2023-7024: High severity heap buffer overflow'],
                118: ['CVE-2023-6345: Integer overflow']
            }
        },
        'Firefox': {
            minSafeVersion: 121,
            vulnerabilities: {
                120: ['CVE-2023-6856: Heap-buffer-overflow in WebGL'],
                119: ['CVE-2023-6204: Out-of-bound memory access'],
                118: ['CVE-2023-5721: Queued up rendering could have allowed websites to clickjack']
            }
        },
        'Safari': {
            minSafeVersion: 17.2,
            vulnerabilities: {
                17.1: ['CVE-2023-42916: Out-of-bounds read'],
                17.0: ['CVE-2023-42917: Memory corruption issue'],
                16.6: ['CVE-2023-41993: WebKit arbitrary code execution']
            }
        },
        'Brave': {
            minSafeVersion: 1.60,
            vulnerabilities: {}
        }
    };

    const majorVersion = parseInt(version.split('.')[0]);
    const browserData = vulnDB[browserName];

    if (!browserData) {
        return {
            safe: true,
            message: `${browserName} - Version စစ်ဆေး၍ မရပါ`,
            suggestion: ''
        };
    }

    if (majorVersion >= browserData.minSafeVersion) {
        return {
            safe: true,
            message: `${browserName} ${version} - လုံခြုံပါသည် ✓`,
            suggestion: ''
        };
    }

    const vulns = browserData.vulnerabilities[majorVersion] || [];
    const vulnCount = vulns.length;

    return {
        safe: false,
        message: `${browserName} ${version} - လုံခြုံရေး အားနည်းချက် ${vulnCount > 0 ? vulnCount + ' ခု' : ''} ရှိပါသည်`,
        suggestion: `Browser ကို အသစ်ဆုံး Version (${browserData.minSafeVersion}+) သို့ Update လုပ်ပါ။ လက်ရှိ Version တွင် လုံခြုံရေး အားနည်းချက်များ ရှိနေပါသည်။`
    };
}

function detectAdBlocker() {
    const testAd = document.createElement('div');
    testAd.innerHTML = '&nbsp;';
    testAd.className = 'adsbox ad-placement ad-banner';
    testAd.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;';
    document.body.appendChild(testAd);
    const blocked = testAd.offsetHeight === 0 || testAd.clientHeight === 0;
    document.body.removeChild(testAd);
    return blocked;
}

// ========== CATEGORY 3: Hardware & Performance ==========
function checkCategory3() {
    const checks = [];
    let html = '';

    // CPU Cores
    const cores = navigator.hardwareConcurrency;
    if (cores) {
        const coreStatus = cores >= 4 ? 'safe' : cores >= 2 ? 'warning' : 'danger';
        checks.push({ status: coreStatus });
        html += createCheckItem('CPU Core အရေအတွက်', `${cores} Cores`, coreStatus);
        if (cores < 4) allSuggestions.push({ critical: false, text: `CPU cores ${cores} ခု ရှိပါသည်။ ခေတ်မီ browser များ အတွက် အနည်းဆုံး 4 cores ရှိသင့်ပါသည်။` });
    } else {
        html += createCheckItem('CPU Core အရေအတွက်', 'စစ်ဆေး၍ မရပါ', 'info');
        checks.push({ status: 'info' });
    }

    // RAM
    const ram = navigator.deviceMemory;
    if (ram) {
        const ramStatus = ram >= 8 ? 'safe' : ram >= 4 ? 'warning' : 'danger';
        checks.push({ status: ramStatus });
        html += createCheckItem('RAM မှတ်ဉာဏ် (Memory)', `${ram} GB`, ramStatus);
        if (ram < 4) allSuggestions.push({ critical: false, text: `RAM ${ram} GB ရှိပါသည်။ Browser tab များစွာ ဖွင့်ခြင်းကို ရှောင်ပါ။ အနည်းဆုံး 4 GB ရှိသင့်ပါသည်။` });
    } else {
        html += createCheckItem('RAM မှတ်ဉာဏ် (Memory)', 'ဤ browser တွင် စစ်ဆေး၍ မရပါ', 'info');
        checks.push({ status: 'info' });
    }

    // Battery
    if (navigator.getBattery) {
        navigator.getBattery().then(battery => {
            const level = Math.round(battery.level * 100);
            const charging = battery.charging;
            const batStatus = charging || level > 20 ? 'safe' : level > 10 ? 'warning' : 'danger';
            const batText = `${level}%${charging ? ' (အားသွင်းနေသည်)' : ''}`;
            const batItem = createCheckItem('Battery အခြေအနေ', batText, batStatus);
            // Append to existing items
            document.getElementById('cat3Items').innerHTML += batItem;
            if (level <= 20 && !charging) allSuggestions.push({ critical: false, text: `Battery ${level}% သာ ကျန်ပါသည်။ အားသွင်းပါ။ Battery နည်းသောအခါ browser performance ကျဆင်းနိုင်ပါသည်။` });
        }).catch(() => {});
    } else {
        html += createCheckItem('Battery အခြေအနေ', 'ဤ browser တွင် စစ်ဆေး၍ မရပါ', 'info');
        checks.push({ status: 'info' });
    }

    // JS Heap (Chrome only)
    if (performance.memory) {
        const used = (performance.memory.usedJSHeapSize / 1048576).toFixed(1);
        const total = (performance.memory.jsHeapSizeLimit / 1048576).toFixed(0);
        const pct = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100).toFixed(1);
        const memStatus = pct < 50 ? 'safe' : pct < 80 ? 'warning' : 'danger';
        checks.push({ status: memStatus });
        html += createCheckItem('JS Memory (Heap)', `${used} MB / ${total} MB (${pct}%)`, memStatus);
        if (pct >= 80) allSuggestions.push({ critical: true, text: `JS Memory ${pct}% အသုံးပြုနေပါသည်။ Browser tab အချို့ကို ပိတ်ပါ။ Memory leak ရှိနိုင်ပါသည်။` });
    } else {
        html += createCheckItem('JS Memory (Heap)', 'ဤ browser တွင် စစ်ဆေး၍ မရပါ', 'info');
        checks.push({ status: 'info' });
    }

    // WebGPU
    const hasGPU = !!navigator.gpu;
    html += createCheckItem('WebGPU အသုံးပြုနိုင်မှု', hasGPU ? 'ရရှိနိုင်သည် ✓' : 'မရရှိနိုင်ပါ', hasGPU ? 'safe' : 'info');
    checks.push({ status: hasGPU ? 'safe' : 'info' });

    // Connection type (also in cat4 but performance-related here)
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && conn.effectiveType) {
        const eff = conn.effectiveType;
        const connStatus = eff === '4g' ? 'safe' : eff === '3g' ? 'warning' : 'danger';
        checks.push({ status: connStatus });
        html += createCheckItem('အင်တာနက် အမြန်နှုန်း', eff.toUpperCase(), connStatus);
        if (eff !== '4g') allSuggestions.push({ critical: false, text: `Internet connection speed ${eff} ဖြစ်ပါသည်။ ပိုမြန်သော WiFi သို့ ပြောင်းပါ။` });
    }

    document.getElementById('cat3Items').innerHTML = html;
    const catStatus = getCategoryStatus(checks);
    setBadge('cat3Badge', catStatus, badgeLabels[catStatus] || 'INFO');

    const total = checks.filter(c => c.status !== 'info').length;
    const safe = checks.filter(c => c.status === 'safe').length;
    categoryScores.cat3 = total > 0 ? Math.round((safe / total) * 100) : 100;
}

// ========== CATEGORY 4: Network & Location ==========
async function checkCategory4() {
    const checks = [];
    let html = '';

    // Online Status
    const online = navigator.onLine;
    const onlineStatus = online ? 'safe' : 'danger';
    checks.push({ status: onlineStatus });
    html += createCheckItem('Internet ချိတ်ဆက်မှု', online ? 'Online ဖြစ်ပါသည် ✓' : 'Offline ဖြစ်နေပါသည်', onlineStatus);

    // Timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'မသိ';
    html += createCheckItem('အချိန်ဇုန် (Timezone)', tz, 'info');
    checks.push({ status: 'info' });

    // Connection Type
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
        const type = conn.type || 'Unknown';
        const downlink = conn.downlink ? `${conn.downlink} Mbps` : '';
        html += createCheckItem('ကွန်ရက် အမျိုးအစား', `${type}${downlink ? ' — ' + downlink : ''}`, 'info');
        checks.push({ status: 'info' });
    }

    // Public IP
    try {
        const resp = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(5000) });
        const data = await resp.json();
        html += createCheckItem('Public IP လိပ်စာ', data.ip, 'info');
        checks.push({ status: 'info' });
        allSuggestions.push({ critical: false, text: `သင့် Public IP address (<strong>${data.ip}</strong>) ကို website များက မြင်နိုင်ပါသည်။ <strong>VPN</strong> အသုံးပြု၍ IP ကို ဖုံးကွယ်နိုင်ပါသည်။` });
    } catch {
        html += createCheckItem('Public IP Address', 'စစ်ဆေး၍ မရပါ (Network Error)', 'warning');
        checks.push({ status: 'warning' });
    }

    const webrtcLeak = await checkWebRTCLeak();
    if (webrtcLeak.leaked) {
        checks.push({ status: 'danger' });
        html += createCheckItem('WebRTC IP Leak စစ်ဆေးမှု', `Local IP ပေါ်နေသည်: ${webrtcLeak.ip}`, 'danger');
        allSuggestions.push({ critical: true, text: `<strong>WebRTC</strong> မှ သင့် local IP address (${webrtcLeak.ip}) ပေါ်နေပါသည်။ VPN အသုံးပြုနေသော်လည်း IP ပေါ်နိုင်ပါသည်။ Browser extension "WebRTC Leak Shield" ထည့်သွင်းပါ သို့မဟုတ် browser settings တွင် WebRTC ကို disable လုပ်ပါ။` });
    } else {
        checks.push({ status: 'safe' });
        html += createCheckItem('WebRTC IP Leak စစ်ဆေးမှု', 'WebRTC Leak မတွေ့ရှိပါ ✓', 'safe');
    }

    // Geolocation Permission
    if (navigator.permissions) {
        try {
            const geoStatus = await navigator.permissions.query({ name: 'geolocation' });
            const geoVal = geoStatus.state;
            let geoDisplay, geoSt;
            if (geoVal === 'granted') { geoDisplay = 'ခွင့်ပြုထားသည် (Granted)'; geoSt = 'warning'; }
            else if (geoVal === 'denied') { geoDisplay = 'ငြင်းပယ်ထားသည် (Denied)'; geoSt = 'safe'; }
            else { geoDisplay = 'ခွင့်တောင်းမည် (Prompt)'; geoSt = 'safe'; }
            checks.push({ status: geoSt });
            html += createCheckItem('တည်နေရာ သိရှိခွင့် (Geolocation)', geoDisplay, geoSt);
            if (geoVal === 'granted') allSuggestions.push({ critical: false, text: '<strong>Geolocation</strong> permission ခွင့်ပြုထားပါသည်။ မလိုအပ်ပါက browser settings > Site Settings > Location တွင် ပိတ်ထားပါ။' });
        } catch {
            html += createCheckItem('Geolocation Permission', 'စစ်ဆေး၍ မရပါ', 'info');
            checks.push({ status: 'info' });
        }
    }

    document.getElementById('cat4Items').innerHTML = html;
    const catStatus = getCategoryStatus(checks);
    setBadge('cat4Badge', catStatus, badgeLabels[catStatus] || 'INFO');

    const total = checks.filter(c => c.status !== 'info').length;
    const safe = checks.filter(c => c.status === 'safe').length;
    categoryScores.cat4 = total > 0 ? Math.round((safe / total) * 100) : 100;
}

function checkWebRTCLeak() {
    return new Promise((resolve) => {
        try {
            const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
            let found = false;
            pc.createDataChannel('');
            pc.createOffer().then(offer => pc.setLocalDescription(offer)).catch(() => resolve({ leaked: false }));
            pc.onicecandidate = (e) => {
                if (!e.candidate) { if (!found) resolve({ leaked: false }); pc.close(); return; }
                const parts = e.candidate.candidate.split(' ');
                const ip = parts[4];
                if (ip && !ip.includes(':') && !ip.startsWith('0.') && ip !== '0.0.0.0') {
                    // Private IP ranges  
                    if (ip.match(/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/)) {
                        found = true;
                        resolve({ leaked: true, ip });
                    }
                }
            };
            setTimeout(() => { if (!found) resolve({ leaked: false }); pc.close(); }, 3000);
        } catch { resolve({ leaked: false }); }
    });
}

// ========== SUGGESTIONS ==========
function renderSuggestions() {
    const section = document.getElementById('suggestionsSection');
    const list = document.getElementById('suggestionsList');

    if (allSuggestions.length === 0) {
        section.classList.add('hidden');
        return;
    }

    section.classList.remove('hidden');
    // Sort critical first
    allSuggestions.sort((a, b) => (b.critical ? 1 : 0) - (a.critical ? 1 : 0));

    list.innerHTML = allSuggestions.map((s, i) =>
        `<div class="suggestion-item ${s.critical ? 'critical' : ''}" style="animation-delay:${i * 0.05}s">
            <span class="suggestion-icon">${s.critical ? '🔴' : '⚠️'}</span>
            <div class="suggestion-text">${s.text}</div>
        </div>`
    ).join('');
}

// ========== OVERALL SCORE ==========
function renderOverallScore() {
    const scores = Object.values(categoryScores);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    // Animate score ring
    const fill = document.getElementById('scoreRingFill');
    const circumference = 326.73;
    const offset = circumference - (avg / 100) * circumference;
    fill.style.strokeDashoffset = offset;

    // Update color
    let color;
    if (avg >= 80) color = '#10b981';
    else if (avg >= 50) color = '#f59e0b';
    else color = '#f43f5e';
    fill.style.stroke = color;

    // Animate number
    const valueEl = document.getElementById('scoreValue');
    animateNumber(valueEl, 0, avg, 1200);

    // Verdict
    const verdict = document.getElementById('verdictText');
    const desc = document.getElementById('verdictDesc');
    if (avg >= 80) {
        verdict.textContent = '✅ လုံခြုံပါသည်';
        verdict.style.color = '#34d399';
        desc.textContent = 'သင့် browser သည် လုံခြုံရေး အခြေအနေ ကောင်းမွန်ပါသည်။';
    } else if (avg >= 50) {
        verdict.textContent = '⚠️ သတိထားသင့်ပါသည်';
        verdict.style.color = '#fbbf24';
        desc.textContent = 'အချို့ လုံခြုံရေး ပြဿနာများ တွေ့ရှိပါသည်။ အောက်ပါ အကြံပြုချက်များကို ဖတ်ရှုပါ။';
    } else {
        verdict.textContent = '🔴 လုံခြုံမှု အားနည်းပါသည်';
        verdict.style.color = '#fb7185';
        desc.textContent = 'အရေးကြီးသော လုံခြုံရေး ပြဿနာများ တွေ့ရှိပါသည်။ ချက်ချင်း ဆောင်ရွက်ရန် လိုအပ်ပါသည်။';
    }

    // Category breakdown tags
    const breakdown = document.getElementById('scoreBreakdown');
    const catNames = {
        cat1: 'အထွေထွေ',
        cat2: 'လုံခြုံရေး',
        cat3: 'Hardware',
        cat4: 'ကွန်ရက်'
    };
    breakdown.innerHTML = Object.entries(categoryScores).map(([key, score]) => {
        const st = score >= 80 ? 'safe' : score >= 50 ? 'warning' : 'danger';
        return `<span class="score-tag ${st}">${catNames[key]} ${score}%</span>`;
    }).join('');
}

function animateNumber(el, from, to, duration) {
    const start = performance.now();
    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(from + (to - from) * eased);
        el.textContent = current + '%';
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}
