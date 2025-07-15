import { fetchAndRetry } from './modules/downloadUtils';
import JSZip from 'jszip';

/**
 * fetches all the images from the given links and returns them as a zip blob
 * @param imagesLinks The links of the images to download
 * @returns A promise that resolves with the zip blob or rejects if an error occured
 */

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    switch (message.type) {
        case 'download':
            const imagesLinks =  message.urls as string[];
            const volume = new JSZip();
            const downloadErrors : Error[] = [];
            try{chrome.runtime.sendMessage({type: 'volume_download_progess', progress: {current: 0, total: imagesLinks.length}});}
            catch(error) {console.warn(error);}

            let progress = 0;
            for (const imageLink of imagesLinks) {
                try {
                    const response = await fetchAndRetry(imageLink, {}, 10);
                    if (!response.ok)
                        throw new Error('Failed to download image ' + imageLink + ' : ' + response.status);
                    const filename = imageLink.substring(imageLink.lastIndexOf('/') + 1);
                    volume.file(filename, await response.blob());
                    try {chrome.runtime.sendMessage({type: 'volume_download_progess', progress: {current: progress++, total: imagesLinks.length}})}
                    catch(error) {console.warn(error);}
                }
                catch(error) {downloadErrors.push(error as Error);}
            }

            if (downloadErrors.length > 0)
                throw new Error('Failed to download some images :\n' + downloadErrors.map((error) => error.message).join(",\n "));
            else {
                const volumeAsZip = await volume.generateAsync({ type: 'blob' });
                return volumeAsZip;
            }
    }
})

// async getZipFromImagesLinks(imagesLinks : string[]) : Promise<Blob> {

// }