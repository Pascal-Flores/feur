import { DownloadType, SupportedWebsite } from './supported_websites';
import { fetchAndRetry } from './downloadUtils';
import FileSaver from 'file-saver';
import JSZip from 'jszip';

/**
 * An interface that defines the methods that a content manager should implement
 * @remarks
 * A content manager is an object that is responsible for downloading the content of a volume or all the volumes of a manga for a given website
 */
export interface ContentManager {
    /**
     * Fetches all the images from the volume and downloads them as a zip (cbz) file
     * @param url The url of the volume
     * @returns A promise that resolves when the download is finished or rejects if an error occured
     * @warning When implementing this method, you should ensure that the `url` page contains all the images links 
     */
    downloadVolume(url: string): Promise<void>;

    /**
     * Downloads all the volumes and downloads them as individual zip (cbz) files
     * @param url the url of the page where all the volumes are listed
     * @returns A promise that resolves when the download is finished or rejects if an error occured
     * @warning When implementing this method, you should ensure that the `url` page contains all the volumes links 
     */
    downloadAllVolumes(url: string): Promise<void>;

    /**
     * Returns the type of download that should be performed for the given url
     * @param url The url of the page
     * @returns A promise that resolves with the type of download that should be performed
     */
    getDownloadType(url: string): Promise<DownloadType>;
}

/**
 * Returns a content manager for the given website
 * @param website the website for which the content manager should be returned
 * @returns A content manager for the given website
 * @throws An error if the website is not supported
 * @see {@link ContentManager}
 */
export function getContentManager(website: SupportedWebsite) : ContentManager {
    switch (website) {
        case SupportedWebsite.SushiScan:
            return new SushiScanContentManager();
        case SupportedWebsite.Unsupported:
        default:
            throw new Error('Unsupported website');
    }
}

/**
 * A content manager for the SushiScan website
 */
class SushiScanContentManager implements ContentManager {
    public async getDownloadType(url : string) : Promise<DownloadType> {
        return fetch(url).then(async (response) => {
            const html = new DOMParser().parseFromString(await response.text(), 'text/html');
            if (html.querySelector('#chapterlist') !== null && html.querySelector('#chapterlist') !== undefined)
                return DownloadType.AllVolumes;
            else if (html.querySelector('#readerarea') !== null && html.querySelector('#readerarea') !== undefined)
                return DownloadType.SingleVolume;
            else
                throw new Error('Unsupported page');
        });
    }
    
    public async downloadVolume(url : string) : Promise<void> {
        return fetch(url).then(async (response) => {
            const html = new DOMParser().parseFromString(await response.text(), 'text/html');
            const volumeImagesLinks = this.parseVolumeImagesLinks(html);

            let volumeAsZip : Blob;
            try {volumeAsZip = await this.getZipFromImagesLinks(volumeImagesLinks);}
            catch (error) {throw new Error('Failed to download volume : ' + (error as Error).message);}
            
            FileSaver.saveAs(volumeAsZip, this.parseVolumeTitle(url));
            return;
        });
    }

    public async downloadAllVolumes(url : string) : Promise<void> {
        return fetch(url).then(async (response) => {
            const html = new DOMParser().parseFromString(await response.text(), 'text/html');
            const volumesLinks = this.parseVolumesLinks(html);

            for (const volumeLink of volumesLinks)
                try {await this.downloadvolumeAndRetry(volumeLink); }
                catch (error) { console.warn(error); }
        });
    }

    public constructor() {}

    /**
     * Parses the html of the manga catalogue page and returns the links of all the volumes / chapters
     * @param html The html of the manga catalogue page
     * @returns An array containing the links of all the volumes / chapters
     * @remarks
     * To ease naming, the term `volume` is used to refer to a chapter or a volume
     */
    private parseVolumesLinks(html : Document) : string[] {
        const chapterAElements = Array.from(html.querySelectorAll('#chapterlist > ul a'));
        return (chapterAElements.map(element => element.getAttribute('href')).filter((href) => href !== null && href !== undefined) as string[]).reverse();
    }

    /**
     * Parses the html of a volume page and returns the links of all the images
     * @param html The html of the volume page
     * @returns An array containing the links of all the images
     * @remarks
     * To ease naming, the term `volume` is used to refer to a chapter or a volume
     */
    private parseVolumeImagesLinks(html : Document) : string[] {
        const imagesElements = Array.from(html.querySelectorAll('#readerarea > noscript > p > img'));
        const imagesLinks = imagesElements.map(element => element.getAttribute('src'))
        .filter((src) => src !== null && src !== undefined) as string[]
        imagesLinks.forEach((src, index, array) => array[index] = src.replace('http://', 'https://'));

        return imagesLinks;
    }

    /**
     * Utility method that parses the volume title from the volume url
     * @param url The url of the volume
     * @returns The title of the volume
     * @remarks
     * To ease naming, the term `volume` is used to refer to a chapter or a volume
     */
    private parseVolumeTitle(url : string) : string {
        if (url.endsWith('/'))
            url = url.substring(0, url.length - 1);
        return url.split('/')[url.split('/').length - 1] + '.cbz';
    }

    /**
     * fetches all the images from the given links and returns them as a zip blob
     * @param imagesLinks The links of the images to download
     * @returns A promise that resolves with the zip blob or rejects if an error occured
     */
    private async getZipFromImagesLinks(imagesLinks : string[]) : Promise<Blob> {
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

    /**
     * Tries to download the volume at the given url and retries if it fails
     * @param url The url of the volume
     * @param retries The number of times the download should be retried if it fails
     * @returns A promise that resolves when the download is finished or rejects if an error occured after all the retries
     * @remarks
     * To ease naming, the term `volume` is used to refer to a chapter or a volume
     */
    private async downloadvolumeAndRetry(url : string, retries = 3) : Promise<void> {
        return this.downloadVolume(url).catch((error) => {
            if (retries > 0)
                return this.downloadvolumeAndRetry(url, retries - 1);
            else
                throw error;
        });
    }
}