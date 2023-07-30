import { DownloadType, PageStatus, SupportedWebsite } from "./modules/supported_websites";
import { ContentManager, getContentManager } from "./modules/ContentManager";

function getWebsite(): SupportedWebsite {
    const hostname = window.location.hostname;
    let website: SupportedWebsite = SupportedWebsite.Unsupported;
    Object.values(SupportedWebsite).forEach((supportedWebsite) => {
        if (hostname.includes(supportedWebsite)) {
            website = supportedWebsite;
        }
    });
    return website;
}

function doesPageHasDownloadableContent(website: SupportedWebsite): boolean {
    switch (website) {
        case SupportedWebsite.SushiScan:
            if (window.location.href.includes('catalogue')) 
                return document.querySelector('#chapterlist') !== null && document.querySelector('#chapterlist') !== undefined;
            else
                return document.querySelector('#readerarea') !== null && document.querySelector('#readerarea') !== undefined;
        case SupportedWebsite.Unsupported:
        default:
            return false;
    }
}

async function isContentDownloadable(website: SupportedWebsite): Promise<boolean> {
    switch (website) {
        case SupportedWebsite.SushiScan:
            if (window.location.href.includes('catalogue')) {
                const links = document.querySelectorAll('#chapterlist > ul a')!;
                for (const link of links) {
                    const response = await fetch(link.getAttribute('href')!);
                    if (!response.ok) {
                        return false;
                    }
                }
                return true;
            }
            else {
                const images = document.querySelectorAll('#readerarea > noscript > p > img')!;
                for (const image of images) {
                    const response = await fetch(image.getAttribute('src')!);
                    if (!response.ok) {
                        return false;
                    }
                }
                return true;
            }

        case SupportedWebsite.Unsupported:
        default:
            return false;
    }
}
    

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    async function processMessage(message: any) {
        switch (message.type) {
            case 'get_page_status':
                sendPageStatusResponse({website: getWebsite(), hasDownloadableContent: doesPageHasDownloadableContent(getWebsite()), canDownload: await isContentDownloadable(getWebsite())}, sendResponse)
                break;
            case 'download':
                let contentManager : ContentManager;
                try {contentManager = getContentManager(getWebsite());}
                catch (error) {console.error(error); return;}

                contentManager.getDownloadType(window.location.href)
                .then((type) => {
                    switch (type) {
                        case DownloadType.AllVolumes:
                            console.log('Downloading all volumes');
                            contentManager.downloadAllVolumes(window.location.href)
                            .catch((error) => console.error(error));
                            break;
                        case DownloadType.SingleVolume:
                            console.log('Downloading single volume');
                            contentManager.downloadVolume(window.location.href)
                            .catch((error) => console.error(error));
                            break;
                        default:
                            break;
                    }
                })
                .catch((error) => console.error(error));
                break;
            default:
                break;
        }
    }
        processMessage(message);

    return true;
});

function sendPageStatusResponse(status: PageStatus, sendResponse: (response?: any) => void) {
    sendResponse(status);
}
