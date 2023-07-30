export enum SupportedWebsite {
    SushiScan = 'sushiscan.net',
    Unsupported = 'unsupported'
}

export type PageStatus = {
    website: SupportedWebsite,
    hasDownloadableContent: boolean,
    canDownload: boolean
}

export enum DownloadType {
    SingleVolume,
    AllVolumes
}