// Helper function to get the browser name from the user agent
export function getBrowserName(userAgent) {
    if (/firefox|fxios/i.test(userAgent)) {
        return "Firefox";
    } else if (/chrome|chromium|crios/i.test(userAgent)) {
        return "Chrome";
    } else if (/safari/i.test(userAgent)) {
        return "Safari";
    } else if (/msie|trident/i.test(userAgent)) {
        return "Internet Explorer";
    } else if (/edge/i.test(userAgent)) {
        return "Edge";
    } else {
        return "Unknown";
    }
}

// Helper function to get the device type from the user agent
export function getDeviceType(userAgent) {
    if (/android/i.test(userAgent)) {
        return "Android";
    } else if (/iphone|ipod/i.test(userAgent)) {
        return "iPhone";
    } else if (/mobile/i.test(userAgent)) {
        return "Mobile";
    } else if (/tablet/i.test(userAgent)) {
        return "Tablet";
    } else {
        return "Desktop";
    }
}

// Helper function to get the user's IP address using an external API
export async function getIPAddress() {
    const response = await fetch("https://api.ipify.org?format=json");
    if (!response.ok) {
        return "Unknown";
    }
    const data = await response.json();
    return data.ip;
}
