# Rust Breeder

## Info

Rust Breeder is a passion project designed to help users calculate crossbreeding instructions for plants in the game [Rust](https://rust.facepunch.com/). The tool simplifies the process of optimizing plant genetics, making it easier for players to achieve their desired traits.

Available at: [rustbreeder.com](https://rustbreeder.com)

If you want to see it in action but don't know how to provide valid input: [click here](https://rustbreeder.com?genes=WGXYYW,WGGXYW,WGYXGW,WYYXGW,XYYXGW,XYGXYW,YWGYGX,WGGWYX,XGYWGG,XGYWYX,WYYWGW,XYYGWX,YXGWGX,WYGXYW,WGWGYW,WYWXGG,XYGWGW,WGYWGW,XYYWYW,XYGWYX,XYGXYX,WGGXYX,XYGWYW).

Join the discussion on [Discord](https://discord.com/invite/Va5475pqFw).

## Tech Stack

- [Vue2](https://v2.vuejs.org/) + [Vuetify2](https://v2.vuetifyjs.com/) + [Typescript](https://www.typescriptlang.org/) - User Interface
- [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) - used for unblocking main thread and utilizing multiple CPU threads
- [Tesseract.js](https://github.com/naptha/tesseract.js) + [Screen Capture API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API) - used for screen scanning functionality that helps avoid having to type plant genes manually

## Collaboration

Currently I have limited time to work on the app due to increased responsibilities (twins!). If you are interested in collaborating through PRs, please align with me on proposed features first.

### Considerations

- Users often suggest or request features, which I may not always agree with for various reasons.
- My goal is to keep the UI simple and tidy. Niche features that complicate the app for average users are generally not favored.

### Ideas for Improvement

- Add scanner support for different aspect ratios / allow users to set up their own scanner regions (manual adjustment: zoom, move)
- Explore scanning possibilities with phone cameras
- Update versions of some packages to improve performance (e.g Tesseract.js)
- Explore possibility of migrating core calculation logic to WASM
- Add some guidance on how to crossbreed in the UI (maybe even as a separate subpage)

### Contributing

If you wish to contribute, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Submit a pull request with a detailed description of your changes.

### License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

Special thanks to the Rust community and all the contributors who have provided valuable feedback and suggestions.

## Required Software

- [NodeJS](https://nodejs.org/en/)

## Commands

Below is the list of commands required for development and deployment.

### Dependencies

```
npm install
```

### Compiles and Hot-Reloads for Development

```
npm run serve
```

### Compiles and Minifies for Production

```
npm run build
```

### Run Unit Tests

```
npm run test:unit
```

### Lints and Fixes Files

```
npm run lint
```

### Customize Configuration

See the [Configuration Reference](https://cli.vuejs.org/config/).
