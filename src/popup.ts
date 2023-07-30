//import { getPageStatus } from "./modules/messageUtils";
import { PageStatus, SupportedWebsite } from "./modules/supported_websites";

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     switch (message.type) {
//         case 'get_page_status':
//             const website = document.querySelector('#website');
//             if (website !== null && website !== undefined) {
//                 website.textContent = message.website;
//             }
//         default:
//             break;
//     }
// });

document.addEventListener('DOMContentLoaded', async () => {
    await updatePopup();
    setInterval(async () => {
        await updatePopup();
    }, 1000);
});

async function updatePopup() {
    const pageStatus : PageStatus = await getPageStatus();
    if (pageStatus.website === SupportedWebsite.Unsupported) {
        document.querySelector('#website')!.textContent = 'Current website is unsupported';
        document.querySelector('#download')!.innerHTML = '<button disabled>Download</button>'; 
        document.querySelector('#download > button')!.setAttribute('disabled', 'true');
    }
    else if (!pageStatus.hasDownloadableContent) {
        document.querySelector('#website')!.textContent = 'Compatible website detected : ' + pageStatus.website;
        document.querySelector('#download')!.innerHTML = '<button disabled>Download</button><span>No downloadable content found</span>';
    }
    else if (!pageStatus.canDownload) {
        document.querySelector('#website')!.textContent = 'Compatible website detected : ' + pageStatus.website;
        document.querySelector('#download')!.innerHTML = '<button disabled>Download</button><span>Not all images are loaded</span>';
    }
    else {
        document.querySelector('#website')!.textContent = 'Compatible website detected : ' + pageStatus.website;
        document.querySelector('#download > button')!.addEventListener('click', download);

    }
}

async function getPageStatus() : Promise<PageStatus> {
    return new Promise((resolve, reject) => {
       chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id as number, {type: 'get_page_status'}, (response) => {
                resolve(response);
            });
        });
    });
}

function download() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id as number, {type: 'download'});
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case 'volume_download_progess':
            if (message.progress.current === 0)
                document.querySelector('#progress')!.innerHTML = '<progress max="' + message.progress.total + '" value="0"></progress>';
            else
                document.querySelector('#progress > progress')!.setAttribute('value', message.progress.current.toString());
            break;
        default:
            break;
    }
});