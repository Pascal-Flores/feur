# Feur

Feur is a chrome extension that allows you to easily extract images for certain websites, and save them locally.

## Installation

### From sources

Needed tools : [Node.js](https://nodejs.org/en/), [npm](https://www.npmjs.com/), [git](https://git-scm.com/)

1. Clone the repository

```bash
git clone https://github.com/Pascal-Flores/feur.git
```

2. Install dependencies (in the extension folder)

```bash
npm install
```

3. Build the extension (in the extension folder)

```bash
npm run build
```

4. Load the extension in chrome

- Go to chrome://extensions/
- Enable developer mode
- Click on "Load unpacked"
- Select the entire extension folder
- Et voilà !

### Usage

1. Go to a website that you want to extract images from
2. Click on the extension icon
3. If the website is compatible and the page has content that can be extracted, a download button will appear
4. Click on the download button to download the images


## Supported websites

- [x] [SushiScan](https://sushiscan.net/) -> work for a single volume / chapter page or for all the volumes at once (the download button will appear on the main page (https://sushiscan.net/catalogue/manga_name/))

## Contributing

Adding support for more website would be cool, so please feel free to open issues / PR if you want to add support for a website.

## TODO

- [ ] Better UI -> popup
- [ ] Better interaction with the user (error messages, etc.) -> popup
- [ ] Find a way to download all volumes in a single zip file

## What does "Feur" mean ?

Feur is a french "word" (it is not technically a word) that is supposed to be said after someone says "Quoi ?" (which means "What ?" in french). It is used for humoristic (or not) purposes, because the juxtaposition of the two words makes "coiffeur" (which means "hairdresser" in french). Other examples of this kind of puns are "Qui ? Quette" or "Comment ? Dant de bord".
I chose this name because I love to say "Feur" to everybody because it's very annoying :)