/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "8d540d0b92772bfc1596c37556d19503"
  }, {
    "url": "pwa-512x512.png",
    "revision": "8d540d0b92772bfc1596c37556d19503"
  }, {
    "url": "pwa-192x192.png",
    "revision": "64ea6a698394c5436976162396b7af3c"
  }, {
    "url": "index.html",
    "revision": "fe7586ca3ad35110d56fe9b52cd04572"
  }, {
    "url": "icon.svg",
    "revision": "6c0ecf48db9ff216b0fea60e1bedfd6c"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "168da8fba629a3c4f59e87b17e8b596b"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/purify.es-BZxk_wWO.js",
    "revision": null
  }, {
    "url": "assets/index.es-B-4MpwCv.js",
    "revision": null
  }, {
    "url": "assets/index-DpxsHOmW.js",
    "revision": null
  }, {
    "url": "assets/index-CcFSBbjr.css",
    "revision": null
  }, {
    "url": "assets/html2canvas-wj4Rk0oP.js",
    "revision": null
  }, {
    "url": "assets/aistudio/image_be851d84.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_9129e851.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_8ed4e08d.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_591d6316.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_40d90fc9.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_3bb600ee.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_2f9a9691.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_0523b186.png",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "168da8fba629a3c4f59e87b17e8b596b"
  }, {
    "url": "icon.svg",
    "revision": "6c0ecf48db9ff216b0fea60e1bedfd6c"
  }, {
    "url": "pwa-192x192.png",
    "revision": "64ea6a698394c5436976162396b7af3c"
  }, {
    "url": "pwa-512x512.png",
    "revision": "8d540d0b92772bfc1596c37556d19503"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "8d540d0b92772bfc1596c37556d19503"
  }, {
    "url": "manifest.webmanifest",
    "revision": "c3a1507b6d3b5361a1f9cab87f5f0cfe"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
